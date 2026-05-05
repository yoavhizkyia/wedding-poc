export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';

  let p = String(raw).trim();

  p = p.replace(/[\s\-(). ‎‏]/g, '');

  if (p.startsWith('00')) {
    p = '+' + p.slice(2);
  }

  if (p.startsWith('+972')) {
    p = '0' + p.slice(4);
  } else if (p.startsWith('972') && p.length >= 11) {
    p = '0' + p.slice(3);
  }

  p = p.replace(/[^\d]/g, '');

  return p;
}

export function isValidIsraeliMobile(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^05\d{8}$/.test(normalized);
}

export function formatPhoneForDisplay(phone: string): string {
  const n = normalizePhone(phone);
  if (n.length === 10 && n.startsWith('05')) {
    return `${n.slice(0, 3)}-${n.slice(3)}`;
  }
  return n || phone || '';
}
