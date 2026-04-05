export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function norm(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .replaceAll("\u00A0", " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toDisplayDate(iso) {
  const value = String(iso ?? "").slice(0, 10);
  if (!value) return "";

  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";

  const wds = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  const mos = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  return `${wds[d.getDay()]} ${d.getDate()} ${mos[d.getMonth()]} ${d.getFullYear()}`;
}

export function todayMidnight() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function isValidDateIso(iso) {
  const value = String(iso ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

export function normalizeDateIso(value) {
  const v = String(value ?? "").slice(0, 10);
  return isValidDateIso(v) ? v : "";
}

export const STATUS = Object.freeze({
  PLANNED: "planned",
  REGISTERED: "registered",
  PAID: "paid",
  PLAYED: "played"
});

export function normalizeStatus(code) {
  const v = norm(code).toLowerCase();

  switch (v) {
    case STATUS.PLANNED:
      return STATUS.PLANNED;
    case STATUS.REGISTERED:
      return STATUS.REGISTERED;
    case STATUS.PAID:
      return STATUS.PAID;
    case STATUS.PLAYED:
      return STATUS.PLAYED;
    default:
      return STATUS.PLANNED;
  }
}

export function statusFromLegacyText(s) {
  const v = norm(s).toLowerCase();

  if (v === "ingeschreven") return STATUS.REGISTERED;
  if (v === "betaald" || v.includes("betaald")) return STATUS.PAID;
  if (v === "gespeeld") return STATUS.PLAYED;
  return STATUS.PLANNED;
}

export function toStatusCode(value) {
  const normalized = normalizeStatus(value);
  if (normalized !== STATUS.PLANNED || norm(value).toLowerCase() === STATUS.PLANNED) {
    return normalized;
  }

  return statusFromLegacyText(value);
}

export function statusLabel(code) {
  switch (normalizeStatus(code)) {
    case STATUS.PLANNED:
      return "Gepland";
    case STATUS.REGISTERED:
      return "Ingeschreven";
    case STATUS.PAID:
      return "Betaald";
    case STATUS.PLAYED:
      return "Gespeeld";
    default:
      return "Gepland";
  }
}
