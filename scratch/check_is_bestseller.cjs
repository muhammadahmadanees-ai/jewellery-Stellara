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

async function checkBestseller() {
  const { data, error } = await supabase.from('client_products').select('*').limit(1);
  if (error) {
    console.error("Failed to fetch client_products:", error.message);
  } else if (data && data.length > 0) {
    const hasCol = 'is_bestseller' in data[0];
    console.log("Does client_products view contain 'is_bestseller'?", hasCol ? "YES" : "NO");
    console.log("Full product sample keys:", Object.keys(data[0]));
  } else {
    console.log("No products found in database.");
  }
}

checkBestseller();
