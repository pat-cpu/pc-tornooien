import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://eapmskvllusllhyxovuw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1j3j4uqowVdVcPE7LoMbmg_r3KMrxnY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);