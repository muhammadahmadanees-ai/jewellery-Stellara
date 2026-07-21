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

async function checkRefcodes() {
  const { data, error } = await supabase.from('products').select('id, name, refcode, price');
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }
  console.log(`Total products: ${data.length}`);
  data.forEach(p => {
    console.log(`- ${p.name} | RefCode: "${p.refcode}"`);
  });
}

checkRefcodes();
