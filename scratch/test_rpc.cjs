const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testRPC() {
  // Test calling a generic exec_sql RPC
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1 as val' });
    console.log("exec_sql (query) response:", { data, error });
  } catch (err) {
    console.error("exec_sql (query) threw error:", err);
  }

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1 as val' });
    console.log("exec_sql (sql) response:", { data, error });
  } catch (err) {
    console.error("exec_sql (sql) threw error:", err);
  }

  try {
    const { data, error } = await supabase.rpc('run_sql', { sql: 'SELECT 1 as val' });
    console.log("run_sql response:", { data, error });
  } catch (err) {
    console.error("run_sql threw error:", err);
  }
}

testRPC();
