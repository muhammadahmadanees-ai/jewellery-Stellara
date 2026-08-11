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

async function checkSizes() {
  try {
    const { data: products, error: prodErr } = await supabase.from('client_products').select('*');
    if (prodErr) {
      console.error("Error fetching products:", prodErr);
      return;
    }

    console.log("Total products:", products.length);
    let totalCharLength = 0;
    let base64Count = 0;
    let imageLengths = [];

    products.forEach((p, idx) => {
      const serialized = JSON.stringify(p);
      totalCharLength += serialized.length;

      // check if img contains base64
      const isBase64 = p.img && (p.img.includes('data:image/') || p.img.length > 5000);
      if (isBase64) {
        base64Count++;
      }
      if (p.img) {
        imageLengths.push({ id: p.id, name: p.name, imgLength: p.img.length, isBase64: !!isBase64 });
      }
    });

    console.log("Total serialized char length of all products:", totalCharLength, "chars (~", (totalCharLength / 1024).toFixed(2), "KB)");
    console.log("Products with potential base64/long images:", base64Count);
    console.log("Top 5 largest product image data lengths:");
    imageLengths.sort((a, b) => b.imgLength - a.imgLength);
    imageLengths.slice(0, 5).forEach(img => {
      console.log(`- Product: "${img.name}" (ID: ${img.id}), Length: ${img.imgLength}, Base64: ${img.isBase64}`);
      if (img.imgLength > 200) {
        console.log("  Preview:", img.imgLength > 500 ? img.imgLength : img.img);
      }
    });

    // Check collections
    const { data: collections, error: colErr } = await supabase.from('collections').select('*');
    if (colErr) {
      console.error("Error fetching collections:", colErr);
      return;
    }
    console.log("Total collections:", collections.length);
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkSizes();
