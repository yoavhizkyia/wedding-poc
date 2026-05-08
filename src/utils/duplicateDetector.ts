import { Contact } from "../types/Contact";
import { normalizePhone } from "./phoneNormalizer";

export function markDuplicates(contacts: Contact[]): Contact[] {
  const counts = new Map<string, number>();

  for (const c of contacts) {
    const key = normalizePhone(c.phone);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return contacts.map((c) => {
    const key = normalizePhone(c.phone);
    const isDup = !!key && (counts.get(key) || 0) > 1;
    return c.isDuplicate === isDup ? c : { ...c, isDuplicate: isDup };
  });
}

export function groupDuplicates(contacts: Contact[]): Contact[][] {
  const groups = new Map<string, Contact[]>();
  for (const c of contacts) {
    const key = normalizePhone(c.phone);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  return Array.from(groups.values()).filter((g) => g.length > 1);
}

export function mergeContacts(items: Contact[]): Contact {
  const sorted = [...items].sort((a, b) => {
    const score = (c: Contact) =>
      (c.fullName ? 1 : 0) +
      (c.notes ? 1 : 0) +
      (c.side !== "unknown" ? 1 : 0) +
      (c.group !== "other" ? 1 : 0);
    return score(b) - score(a);
  });

  const primary = sorted[0];
  const notes = Array.from(
    new Set(sorted.map((c) => c.notes).filter(Boolean)),
  ).join(" | ");

  return {
    ...primary,
    notes: notes || primary.notes,
    isDuplicate: false,
  };
}
