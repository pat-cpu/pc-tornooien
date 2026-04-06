import { supabase } from './supabase.js';

function rowToTournament(row) {
  return {
    id: row.id,
    date_iso: row.date_iso ?? '',
    date: row.date ?? '',
    club: row.club ?? '',
    spel: row.spel ?? '',
    time: row.time ?? '',
    category: row.category ?? '',
    rounds: row.rounds ?? '',
    team: row.team ?? '',
    status_code: row.status_code ?? '',
    played_at: row.played_at ?? '',
    note: row.note ?? '',
    updatedAt: row.updated_at ?? null,
    deleted: row.deleted ?? false
  };
}

function tournamentToRow(item) {
  return {
    id: item.id,
    date_iso: item.date_iso ?? '',
    date: item.date ?? '',
    club: item.club ?? '',
    spel: item.spel ?? '',
    time: item.time ?? '',
    category: item.category ?? '',
    rounds: item.rounds ?? '',
    team: item.team ?? '',
    status_code: item.status_code ?? '',
    played_at: item.played_at ?? '',
    note: item.note ?? '',
    updated_at: item.updatedAt ?? new Date().toISOString(),
    deleted: item.deleted ?? false
  };
}

export async function fetchToernooienFromCloud() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('date_iso', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(rowToTournament);
}

// STAP 1: alleen lezen uit cloud, niets mergen, niets pushen
export async function pullFromCloud() {
  return await fetchToernooienFromCloud();
}

// Nog niet gebruiken in stap 1
export async function pushAllToCloud() {
  const items = getToernooien();

  const rows = items.map(item => ({
    ...tournamentToRow(item),
    updated_at: item.updatedAt ?? new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('tournaments')
    .upsert(rows, { onConflict: 'id' })
    .select();

  if (error) throw error;

  return data;
}

function mergeToernooien(local, cloud) {
  const map = new Map();

  for (const item of local) {
    map.set(item.id, item);
  }

  for (const cloudItem of cloud) {
    const localItem = map.get(cloudItem.id);

    if (!localItem) {
      map.set(cloudItem.id, cloudItem);
      continue;
    }

    const localTime = new Date(localItem.updatedAt ?? 0).getTime();
    const cloudTime = new Date(cloudItem.updatedAt ?? 0).getTime();

    if (cloudTime >= localTime) {
      map.set(cloudItem.id, cloudItem);
    }
  }

  return [...map.values()];
}

// Nog niet gebruiken in stap 1
// export async function syncNow() {
//   const cloud = await fetchToernooienFromCloud();
//   return cloud;
// }

export async function syncNow() {
  const local = getToernooien();
  const cloud = await fetchToernooienFromCloud();

  const merged = mergeToernooien(local, cloud);

  setToernooien(merged);

  const rows = merged.map(item => ({
    ...tournamentToRow(item),
    updated_at: item.updatedAt ?? new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('tournaments')
    .upsert(rows, { onConflict: 'id' })
    .select();

  if (error) throw error;

  return data;
}