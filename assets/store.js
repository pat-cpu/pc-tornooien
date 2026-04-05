console.log("STORE VERSION STATIC 2026-04-05-B");

const DATA_URL = "./data/tornooien.json";
const STORAGE_KEY_CACHE = 'pc_tornooien_cache_v9';

export function getToernooien() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_CACHE) || '[]');
}

export function setToernooien(items) {
  localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(items));
}
function nowIso() {
  return new Date().toISOString();
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function _asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.tournaments)) return payload.tournaments;
  return null;
}

function normalizeTournament(item) {
  if (!item || typeof item !== "object") return null;

  const normalized = {
    ...item,
    id: item.id ?? createId(),
    naam: item.naam ?? "",
    locatie: item.locatie ?? "",
    datum: item.datum ?? "",
    categorie: item.categorie ?? "",
    notities: item.notities ?? "",
    created_at: item.created_at ?? item.updated_at ?? nowIso(),
    updated_at: item.updated_at ?? item.created_at ?? nowIso(),
    deleted: item.deleted ?? false
  };

  return normalized;
}

function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];

  return arr
    .map(normalizeTournament)
    .filter(Boolean);
}

export function getCacheKey() {
  return STORAGE_KEY_CACHE;
}

export function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    const payload = raw ? JSON.parse(raw) : null;
    const arr = _asArray(payload) ?? [];
    return normalizeArray(arr);
  } catch (e) {
    console.warn("Cache lezen mislukt:", e);
    return [];
  }
}

export function writeCache(arr) {
  try {
    const data = normalizeArray(arr);
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(data));
  } catch (e) {
    console.warn("Cache schrijven mislukt:", e);
  }
}

export async function fetchServerAll() {
  const r = await fetch(DATA_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!r.ok) {
    throw new Error(`JSON laden mislukt (${r.status})`);
  }

  const payload = await r.json();
  const arr = _asArray(payload);

  if (!arr) {
    throw new Error("JSON payload is geen lijst");
  }

  return normalizeArray(arr);
}

export async function loadAll() {
  try {
    const arr = await fetchServerAll();
    writeCache(arr);
    return arr.filter(t => !t.deleted);
  } catch (e) {
    console.warn("Laden mislukt, fallback naar cache:", e);
    return readCache().filter(t => !t.deleted);
  }
}

export async function loadAllRaw() {
  try {
    const arr = await fetchServerAll();
    writeCache(arr);
    return arr;
  } catch (e) {
    console.warn("Laden mislukt, fallback naar cache:", e);
    return readCache();
  }
}

export async function saveAll(arr) {
  const data = normalizeArray(arr);
  writeCache(data);
  return true;
}

export async function clearAll() {
  writeCache([]);
  return true;
}

export async function getTournamentById(id) {
  const all = await loadAllRaw();
  return all.find(t => t.id === id) ?? null;
}

export async function addTournament(tournament) {
  const all = await loadAllRaw();

  const item = normalizeTournament({
    ...tournament,
    id: tournament?.id ?? createId(),
    created_at: tournament?.created_at ?? nowIso(),
    updated_at: nowIso(),
    deleted: false
  });

  all.push(item);
  writeCache(all);

  return item;
}

export async function updateTournament(id, updates) {
  const all = await loadAllRaw();
  const index = all.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error(`Tornooi niet gevonden: ${id}`);
  }

  all[index] = normalizeTournament({
    ...all[index],
    ...updates,
    id: all[index].id,
    created_at: all[index].created_at,
    updated_at: nowIso()
  });

  writeCache(all);
  return all[index];
}

export async function deleteTournament(id) {
  const all = await loadAllRaw();
  const index = all.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error(`Tornooi niet gevonden: ${id}`);
  }

  all[index] = normalizeTournament({
    ...all[index],
    deleted: true,
    updated_at: nowIso()
  });

  writeCache(all);
  return true;
}

export async function archiveSeason() {
  throw new Error("Archiveren is niet voorzien in deze versie.");
}

import { getToernooien, setToernooien } from './store.js';

function ensureUpdatedAt() {
  const items = getToernooien();
  const fixed = items.map(item => ({
    ...item,
    updatedAt: item.updatedAt ?? new Date().toISOString()
  }));
  setToernooien(fixed);
  console.log('updatedAt toegevoegd aan lokale records:', fixed);
}

ensureUpdatedAt();