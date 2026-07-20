const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Service Role Key to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log("Found orders count:", data.length);
  data.forEach(order => {
    console.log("-----------------------------------------");
    console.log("ID:", order.id);
    console.log("Name:", order.name);
    console.log("Type:", order.type);
    console.log("Message length:", order.message ? order.message.length : 0);
    console.log("Message content (RAW):");
    console.log(JSON.stringify(order.message));
    console.log("-----------------------------------------");
  });
}

listOrders();
