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

// Re-implement the helper locally to test
async function testBestSellers() {
  try {
    const { data, error } = await supabase.from('client_products').select('*').eq('is_bestseller', true);
    if (error) {
      console.error("DB Query error:", error.message);
    } else {
      console.log("Database results for is_bestseller=true:", data);
    }
  } catch (e) {
    console.error("Test threw error:", e);
  }
}

testBestSellers();
