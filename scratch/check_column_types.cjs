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

async function checkColumnTypes() {
  // Let's run a query to information_schema.columns using an RPC or another way if possible.
  // Wait, does Supabase have a way to run SQL?
  // If we don't have exec_sql, let's try to query the REST API for information_schema.
  // Wait! Supabase REST API does NOT expose information_schema by default because it is in a different schema (not public).
  // But wait! Is there any RPC function in the database?
  // Let's check if we can query the public tables and see their types.
  // Actually, we can list the RPC functions. But we can write a quick query using Postgres PG tables:
  // But wait! We don't have exec_sql.
  // Let's think: is there a client-side truncation that occurred when they clicked "Send Inquiry"?
  // Let's inspect the `Contact.jsx` fetch request:
  // The fetch request goes to 'https://api.web3forms.com/submit' first!
  // And then saves to Supabase.
  // Wait! Did Web3Forms or some other validation fail?
  // Let's check if the browser's form input elements are being truncated.
  // Wait, in `Contact.jsx`:
  // `<textarea id="message" name="message" rows="4" placeholder="How can we help you?" required></textarea>`
  // This has no limit.
  // But let's check the database table structure using pg_catalog if exposed, but it isn't.
  // Let's see: how did this message get created?
  // The message in the database has exactly 200 characters.
  // Let's check if we can verify the data type of the message column by creating a row with a longer message!
  // Yes! Let's write a node script that attempts to insert a 500-character message into the orders table.
  // If it inserts successfully, then the column type in Postgres is TEXT (or varchar with no limit) and the truncation happened BEFORE inserting!
  // If it throws an error ("value too long for type character varying(200)"), then the database column is indeed varchar(200)!
  console.log("Testing insert of 500-character message...");
  const longMessage = "A".repeat(500);
  const { data, error } = await supabase.from('orders').insert([{
    name: "Test Truncation",
    email: "test@example.com",
    message: longMessage,
    type: 'General Inquiry',
    status: 'new'
  }]).select();

  if (error) {
    console.error("Insert failed! Error:", error.message, error.details, error.hint);
  } else {
    console.log("Insert succeeded! Inserted message length:", data[0].message.length);
    // Delete the test row
    await supabase.from('orders').delete().eq('id', data[0].id);
    console.log("Test row deleted.");
  }
}

checkColumnTypes();
