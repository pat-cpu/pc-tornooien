// cloud.js
import { supabase } from './supabase.js';
import { getToernooien, setToernooien } from './store.js';

// Supabase → lokaal object
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

// data ophalen uit Supabase
export async function fetchToernooienFromCloud() {
  const { data, error } = await supabase
    .from('tournaments') // ✅ juiste tabelnaam
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(rowToTournament);
}

// cloud → lokaal zetten (merge)
export async function pullFromCloud() {
  const local = getToernooien();
  const cloud = await fetchToernooienFromCloud();

  const map = new Map(local.map(t => [t.id, t]));

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