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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProducts() {
  const { data, error } = await supabase.from('client_products').select('*').limit(1);
  if (error) {
    console.error("Error fetching client_products:", error.message);
  } else {
    console.log("Fields in client_products:", Object.keys(data[0]));
    console.log("Full client product object:", data[0]);
  }

  // Let's also check if we can query 'products' table using anon key (it should fail if RLS works as expected or if base_price is blocked)
  const { data: rawData, error: rawError } = await supabase.from('products').select('*').limit(1);
  console.log("Can query 'products' table directly with anon key?", rawError ? "No: " + rawError.message : "Yes! Fields: " + Object.keys(rawData[0]));
}

inspectProducts();
