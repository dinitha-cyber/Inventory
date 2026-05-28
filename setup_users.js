import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log("Setting up Admin User...");
  const { data: adminData, error: adminErr } = await supabase.auth.signUp({
    email: 'plmttit@gmail.com',
    password: 'Plmttit@Inventory2025'
  });
  if (adminErr) console.error("Admin error:", adminErr.message);
  else console.log("Admin setup complete. (If email confirmation is required, you must verify the email)");

  console.log("Setting up Standard User...");
  const { data: userData, error: userErr } = await supabase.auth.signUp({
    email: 'backup.plmtt@gmail.com',
    password: 'Plmtt@Inventory@User'
  });
  if (userErr) console.error("User error:", userErr.message);
  else console.log("User setup complete.");
}

setup();
