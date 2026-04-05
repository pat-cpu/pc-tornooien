import { supabase } from './supabase.js'; // ← jouw bestaande lijn laten staan

async function testSupabase() {
  const { data, error, count } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact' });

  console.log('data:', data);
  console.log('count:', count);
  console.log('error:', error);
}

testSupabase();