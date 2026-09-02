export function cleanText(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export function validUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
