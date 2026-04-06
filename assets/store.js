console.log("STORE VERSION STATIC 2026-04-06-A");

const DATA_URL = "./data/tornooien.json";
const STORAGE_KEY_CACHE = "pc_tornooien_cache_v9";

function parseJsonSafe(value, fallback = []) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeTournament(item) {
  const x = item ?? {};

  return {
    ...x,
    id: x.id ?? "",
    date_iso: x.date_iso ?? "",
    date: x.date ?? "",
    club: x.club ?? "",
    spel: x.spel ?? "",
    time: x.time ?? "",
    category: x.category ?? "",
    rounds: x.rounds ?? "",
    team: x.team ?? "",
    status_code: x.status_code ?? "",
    played_at: x.played_at ?? "",
    note: x.note ?? "",
    deleted: Boolean(x.deleted),

    // Compatibel met cloud.js en app.js
    updatedAt: x.updatedAt ?? x.updated_at ?? "",
    updated_at: x.updated_at ?? x.updatedAt ?? ""
  };
}

function normalizeTournamentList(items) {
  return normalizeArray(items).map(normalizeTournament);
}

export function getToernooien() {
  const raw = parseJsonSafe(localStorage.getItem(STORAGE_KEY_CACHE) || "[]", []);
  return normalizeTournamentList(raw);
}

export function setToernooien(items) {
  localStorage.setItem(
    STORAGE_KEY_CACHE,
    JSON.stringify(normalizeTournamentList(items))
  );
}

// ---- compat met je bestaande app-live.js ----

export function readCache() {
  return getToernooien();
}

export function writeCache(items) {
  setToernooien(items);
}

export async function loadAll() {
  const cached = getToernooien();
  if (cached.length) return cached;

  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`JSON laden mislukt (${res.status})`);
  }

  const data = await res.json();
  const arr = normalizeTournamentList(data);
  setToernooien(arr);
  return arr;
}

export async function clearAll() {
  setToernooien([]);
}

export async function getTournamentById(id) {
  return getToernooien().find(x => String(x.id) === String(id)) || null;
}

export async function addTournament(item) {
  const items = getToernooien();

  const timestamp = item?.updatedAt || item?.updated_at || nowIso();

  const withTimestamp = normalizeTournament({
    ...item,
    updatedAt: timestamp,
    updated_at: timestamp
  });

  items.push(withTimestamp);
  setToernooien(items);
  return withTimestamp;
}

export async function updateTournament(id, nextItem) {
  const items = getToernooien();
  const idx = items.findIndex(x => String(x.id) === String(id));

  if (idx === -1) {
    throw new Error("Tornooi niet gevonden");
  }

  const timestamp = nowIso();

  const withTimestamp = normalizeTournament({
    ...nextItem,
    updatedAt: timestamp,
    updated_at: timestamp
  });

  items[idx] = withTimestamp;
  setToernooien(items);
  return withTimestamp;
}

export async function deleteTournament(id) {
  const items = getToernooien();
  const filtered = items.filter(x => String(x.id) !== String(id));
  setToernooien(filtered);
}