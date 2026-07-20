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

async function checkSchema() {
  // We can run a direct SQL query via information_schema if we execute it or if we use an RPC.
  // Wait, does Supabase have a way to inspect schema?
  // Let's run a query to information_schema.columns using Postgres SQL function if available.
  // But wait! Supabase JS client doesn't support raw SQL query unless we have an RPC function like 'exec_sql'.
  // Let's see if we have any RPC functions.
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_info', { table_name: 'orders' });
  if (rpcError) {
    console.log("get_table_info rpc not found. Error:", rpcError.message);
  } else {
    console.log("Table Info:", rpcData);
  }

  // Let's try to query information_schema via standard select if the API allows it (usually not exposed in postgrest)
  // Let's print out what columns are returned from a select limit 1 keys:
  const { data: colsData, error: colsError } = await supabase.from('orders').select('*').limit(1);
  if (colsData && colsData.length > 0) {
    console.log("Columns in orders table:", Object.keys(colsData[0]));
  }
}

checkSchema();
