export function normalizeString(str: string) {
  return str
    .normalize("NFD") // Normalize for diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .toLowerCase(); // Convert to lowercase
}