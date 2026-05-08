import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { Contact, SIDE_LABELS, GROUP_LABELS } from "../types/Contact";
import { normalizePhone } from "./phoneNormalizer";

export interface ExportResult {
  success: boolean;
  filePath?: string;
  rowsExported: number;
  error?: string;
}

function buildWorkbook(contacts: Contact[]) {
  const rows = contacts.map((c) => ({
    "שם מלא": c.fullName || `${c.firstName} ${c.lastName}`.trim(),
    טלפון: normalizePhone(c.phone),
    צד: SIDE_LABELS[c.side],
    קבוצה: GROUP_LABELS[c.group],
    הערות: c.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ["שם מלא", "טלפון", "צד", "קבוצה", "הערות"],
  });

  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, "מוזמנים");

  return { workbook, rowCount: rows.length };
}

function makeFileName(): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return `wedding-guests-${dateStr}.xlsx`;
}

async function exportNative(contacts: Contact[]): Promise<ExportResult> {
  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  const { workbook, rowCount } = buildWorkbook(contacts);

  const wbout: string = XLSX.write(workbook, {
    type: "base64",
    bookType: "xlsx",
  });

  const fileName = makeFileName();
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "ייצוא רשימת מוזמנים",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });
  }

  return { success: true, filePath: fileUri, rowsExported: rowCount };
}

function exportWeb(contacts: Contact[]): ExportResult {
  const { workbook, rowCount } = buildWorkbook(contacts);
  const wbout: ArrayBuffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  });

  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const fileName = makeFileName();

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { success: true, filePath: fileName, rowsExported: rowCount };
}

export async function exportContactsToExcel(
  contacts: Contact[],
): Promise<ExportResult> {
  try {
    if (Platform.OS === "web") {
      return exportWeb(contacts);
    }
    return await exportNative(contacts);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, rowsExported: 0, error: message };
  }
}
