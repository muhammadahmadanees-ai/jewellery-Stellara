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

async function testFetch() {
  try {
    const { data, error } = await supabase.from('client_products').select('id, name').limit(5);
    if (error) {
      console.error("Error fetching products:", error.message);
    } else {
      console.log("Successfully fetched products:", data);
    }
  } catch (err) {
    console.error("Fetch threw error:", err);
  }
}

testFetch();
