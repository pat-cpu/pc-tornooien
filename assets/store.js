console.log("STORE VERSION STATIC 2026-04-05-C");

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

export function getToernooien() {
  return normalizeArray(
    parseJsonSafe(localStorage.getItem(STORAGE_KEY_CACHE) || "[]", [])
  );
}

export function setToernooien(items) {
  localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(normalizeArray(items)));
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
  const arr = normalizeArray(data);
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
  items.push(item);
  setToernooien(items);
  return item;
}

export async function updateTournament(id, nextItem) {
  const items = getToernooien();
  const idx = items.findIndex(x => String(x.id) === String(id));

  if (idx === -1) {
    throw new Error("Tornooi niet gevonden");
  }

  items[idx] = nextItem;
  setToernooien(items);
  return nextItem;
}

export async function deleteTournament(id) {
  const items = getToernooien();
  const filtered = items.filter(x => String(x.id) !== String(id));
  setToernooien(filtered);
}