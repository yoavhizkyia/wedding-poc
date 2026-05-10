const CYRILLIC_REGEX = /[Ѐ-ӿ]/;

export function hasCyrillic(s: string | null | undefined): boolean {
  if (!s) return false;
  return CYRILLIC_REGEX.test(s);
}

const SIMPLE_MAP: Record<string, string> = {
  а: "א",
  б: "ב",
  в: "ו",
  г: "ג",
  д: "ד",
  е: "י",
  ё: "יו",
  ж: "ז'",
  з: "ז",
  и: "י",
  й: "י",
  к: "ק",
  л: "ל",
  м: "מ",
  н: "נ",
  о: "ו",
  п: "פ",
  р: "ר",
  с: "ס",
  т: "ט",
  у: "ו",
  ф: "פ",
  х: "ח",
  ц: "צ",
  ч: "צ'",
  ш: "ש",
  щ: "ש",
  ъ: "",
  ы: "י",
  ь: "",
  э: "ה",
  ю: "יו",
  я: "יה",
};

const FINAL_SWAPS: Record<string, string> = {
  מ: "ם",
  נ: "ן",
  פ: "ף",
  צ: "ץ",
};

function transliterateWord(word: string): string {
  let cleaned = "";
  let prev = "";
  for (const ch of word) {
    if (
      ch.toLowerCase() === prev.toLowerCase() &&
      CYRILLIC_REGEX.test(ch)
    ) {
      continue;
    }
    cleaned += ch;
    prev = ch;
  }

  const len = cleaned.length;
  let out = "";
  for (let i = 0; i < len; i++) {
    const ch = cleaned[i];
    const lower = ch.toLowerCase();
    const isLast = i === len - 1;

    if ((lower === "а" || lower === "я") && isLast) {
      out += "ה";
      continue;
    }
    if (lower === "е" && i === 0) {
      out += "א";
      continue;
    }

    const mapped = SIMPLE_MAP[lower];
    if (mapped !== undefined) {
      out += mapped;
    } else {
      out += ch;
    }
  }

  if (out.length > 0) {
    const lastChar = out[out.length - 1];
    if (FINAL_SWAPS[lastChar]) {
      out = out.slice(0, -1) + FINAL_SWAPS[lastChar];
    }
  }

  return out;
}

export function transliterateRuToHe(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : transliterateWord(part)))
    .join("")
    .trim();
}
