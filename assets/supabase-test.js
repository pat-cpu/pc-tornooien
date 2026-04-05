import { supabase } from './supabase-client.js'; // laat jouw bestaande pad staan

async function testSupabase() {
  const { data, error, count } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact' });

  console.log('data:', data);
  console.log('count:', count);
  console.log('error:', error);
}

testSupabase();