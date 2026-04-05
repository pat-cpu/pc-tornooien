import { supabase } from "./supabase.js";

async function test() {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*");

  if (error) {
    console.error("Supabase fout:", error);
  } else {
    console.log("Supabase OK:", data);
  }
}

test();