import Papa from "papaparse";

export interface CsvContact {
  name: string;
  phone: string;
  tags?: string;
  notes?: string;
}

export interface CsvParseResult {
  valid: CsvContact[];
  errors: { row: number; message: string }[];
}

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function parseCsvContacts(csvText: string): CsvParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const valid: CsvContact[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2; // 1-indexed + header row

    if (!row.name?.trim()) {
      errors.push({ row: rowNum, message: "Missing name" });
      continue;
    }

    if (!row.phone?.trim()) {
      errors.push({ row: rowNum, message: "Missing phone" });
      continue;
    }

    const phone = row.phone.trim();
    if (!PHONE_REGEX.test(phone)) {
      errors.push({
        row: rowNum,
        message: `Invalid phone format: ${phone}. Must be E.164 (e.g., +212612345678)`,
      });
      continue;
    }

    valid.push({
      name: row.name.trim(),
      phone,
      tags: row.tags?.trim() || undefined,
      notes: row.notes?.trim() || undefined,
    });
  }

  return { valid, errors };
}
