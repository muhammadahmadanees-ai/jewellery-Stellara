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

async function insertTest() {
  const longMessage = "This is a very long test inquiry message designed to verify that the admin panel can display full details when the data is longer than 200 characters. " +
    "Let's add more text here to reach at least 300 characters. " +
    "We want to make sure that when the admin clicks the Read More button, the entire text expands inline and is fully readable. " +
    "This confirms that the truncation is not happening in the code or database schema during retrieve.";
    
  const { data, error } = await supabase.from('orders').insert([{
    name: "Test Long Message",
    email: "test-long@example.com",
    phone: "1234567890",
    message: longMessage,
    type: 'General Inquiry',
    status: 'new'
  }]).select();

  if (error) {
    console.error("Error inserting test order:", error.message);
  } else {
    console.log("Successfully inserted test order with ID:", data[0].id);
    console.log("Message length:", data[0].message.length);
  }
}

insertTest();
