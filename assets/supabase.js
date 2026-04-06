import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://eapmskvllusllhyxovuw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1j3j4uqowVdVcPE7LoMbmg_r3KMrxnY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);