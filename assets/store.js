<<<<<<< HEAD
console.log("STORE VERSION STATIC 2026-04-04-A");

const DATA_URL = "./data/tornooien.json";
const STORAGE_KEY_CACHE = "pc_tornooien_cache_v8";

function _asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.tournaments)) return payload.tournaments;
  return null;
}

export function getCacheKey() {
  return STORAGE_KEY_CACHE;
}

export function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    const payload = raw ? JSON.parse(raw) : null;
    return _asArray(payload) ?? [];
  } catch (e) {
    console.warn("Cache lezen mislukt:", e);
    return [];
  }
}

export function writeCache(arr) {
  try {
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(arr ?? []));
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

  return arr;
}

export async function loadAll() {
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
  const data = Array.isArray(arr) ? arr : [];
  writeCache(data);
  return true;
}

export async function clearAll() {
  writeCache([]);
  return true;
}

export async function archiveSeason() {
  throw new Error("Archiveren is niet voorzien in deze versie.");
}
=======
const API_URL = "/api/tournaments";
const STORAGE_KEY_CACHE = "pc_tornooien_cache_v7";

function _asArray(payload){
  // ondersteunt: [ ... ]  of  { tournaments: [ ... ] }
  if(Array.isArray(payload)) return payload;
  if(payload && Array.isArray(payload.tournaments)) return payload.tournaments;
  return null;
}

export async function loadAll(){
  // 1) Server
  try{
    const r = await fetch(API_URL, { cache: "no-store" });
    if(!r.ok) throw new Error("API not ok");

    const payload = await r.json();
    const arr = _asArray(payload);
    if(arr){
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(arr));
      return arr;
    }

    throw new Error("API payload is not a list");
  }catch(e){
    // fallback hieronder
  }

  // 2) Cache
  try{
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    const payload = raw ? JSON.parse(raw) : null;
    const arr = _asArray(payload);
    return arr || [];
  }catch{
    return [];
  }
}

export async function saveAll(arr){
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arr ?? [])
  });
  if(!r.ok){
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(arr ?? []));
    throw new Error("Opslaan naar server mislukt");
  }
  localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(arr ?? []));
}

export async function clearAll(){
  await saveAll([]);
}
export async function archiveSeason({ year = "", mode = "empty" } = {}){
  const r = await fetch("/api/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year, mode })
  });
  if(!r.ok) throw new Error("Archiveren mislukt");
  return await r.json();
}
>>>>>>> f1f106c (Initial commit)
