import { supabase } from './supabase.js';
import { getToernooien } from './store.js';

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
    updated_at: row.updated_at ?? null,
    deleted: row.deleted ?? false
  };
}

function tournamentToRow(item) {
  const timestamp = item.updatedAt ?? item.updated_at ?? new Date().toISOString();

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
    updated_at: timestamp,
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

export async function pullFromCloud() {
  return await fetchToernooienFromCloud();
}

export async function saveTournamentToCloud(item) {
  const row = tournamentToRow(item);

  const { data, error } = await supabase
    .from('tournaments')
    .upsert([row], { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;

  return rowToTournament(data);
}

export async function pushAllToCloud(items = null) {
  const source = Array.isArray(items) ? items : getToernooien();
  const rows = source.map(tournamentToRow);

  if (!rows.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('tournaments')
    .upsert(rows, { onConflict: 'id' })
    .select();

  if (error) throw error;

  return (data ?? []).map(rowToTournament);
}

export async function deleteTournamentFromCloud(id) {
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}

export async function clearCloudAll() {
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .neq('id', '');

  if (error) throw error;

  return true;
}