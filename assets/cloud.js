import { supabase } from './supabase.js';
import { getToernooien, setToernooien } from './store.js';

function rowToTournament(row) {
  return {
    id: row.id,
    naam: row.naam,
    datum: row.datum,
    locatie: row.locatie,
    spelers: row.spelers ?? [],
    status: row.status ?? 'open',
    updatedAt: row.updated_at ?? new Date().toISOString()
  };
}

export async function fetchToernooienFromCloud() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(rowToTournament);
}

export async function pullFromCloud() {
  const local = getToernooien();
  const cloud = await fetchToernooienFromCloud();

  const map = new Map(local.map(item => [item.id, item]));

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

  const merged = [...map.values()];
  setToernooien(merged);
  return merged;
}