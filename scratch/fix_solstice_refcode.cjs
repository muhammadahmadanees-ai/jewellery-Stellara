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

async function fixRefcode() {
  const { data, error } = await supabase
    .from('products')
    .update({ refcode: 'ZPS-04' })
    .ilike('name', '%Golden Solstice%')
    .select();

  if (error) {
    console.error("Error updating refcode:", error);
  } else {
    console.log("Successfully updated Golden Solstice Suite refcode to ZPS-04:", data);
  }
}

fixRefcode();
