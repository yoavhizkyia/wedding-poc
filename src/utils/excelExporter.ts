import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Contact, SIDE_LABELS, GROUP_LABELS } from '../types/Contact';
import { normalizePhone } from './phoneNormalizer';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  rowsExported: number;
  error?: string;
}

export async function exportContactsToExcel(contacts: Contact[]): Promise<ExportResult> {
  try {
    const rows = contacts.map((c) => ({
      'שם מלא': c.fullName || `${c.firstName} ${c.lastName}`.trim(),
      'טלפון': normalizePhone(c.phone),
      'צד': SIDE_LABELS[c.side],
      'קבוצה': GROUP_LABELS[c.group],
      'הערות': c.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['שם מלא', 'טלפון', 'צד', 'קבוצה', 'הערות'],
    });

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, worksheet, 'מוזמנים');

    const wbout: string = XLSX.write(workbook, {
      type: 'base64',
      bookType: 'xlsx',
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `wedding-guests-${dateStr}.xlsx`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'ייצוא רשימת מוזמנים',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
    }

    return {
      success: true,
      filePath: fileUri,
      rowsExported: rows.length,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, rowsExported: 0, error: message };
  }
}
