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

// Use service role key to bypass RLS policies if necessary, but anon key might be enough for public lists
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkStorage() {
  try {
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (bucketErr) {
      console.error("Error listing buckets:", bucketErr);
      return;
    }
    console.log("Buckets:", buckets.map(b => b.name));

    for (const bucket of buckets) {
      console.log(`\n--- Objects in bucket "${bucket.name}" ---`);
      
      // List folders or files
      // We will search recursively if possible or list some files
      const { data: files, error: listErr } = await supabase.storage.from(bucket.name).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

      if (listErr) {
        console.error(`Error listing bucket ${bucket.name}:`, listErr);
        continue;
      }

      console.log(`Found ${files.length} objects at root:`);
      let totalSize = 0;
      files.forEach(f => {
        console.log(`- ${f.name} (Size: ${(f.metadata?.size / 1024 / 1024).toFixed(2)} MB, Created: ${f.created_at})`);
        if (f.metadata?.size) totalSize += f.metadata.size;
      });
      console.log(`Total size at root of "${bucket.name}": ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      // Let's also check subfolders like 'collections/' or 'products/'
      for (const folder of ['collections', 'products']) {
        const { data: subFiles, error: subErr } = await supabase.storage.from(bucket.name).list(folder, {
          limit: 100
        });
        if (subErr) {
          console.warn(`Could not list folder ${folder}:`, subErr.message);
          continue;
        }
        if (subFiles && subFiles.length > 0) {
          console.log(`\n  Folder "${folder}/" contains ${subFiles.length} objects:`);
          let folderSize = 0;
          subFiles.forEach(f => {
            console.log(`  - ${folder}/${f.name} (Size: ${(f.metadata?.size / 1024 / 1024).toFixed(2)} MB, Created: ${f.created_at})`);
            if (f.metadata?.size) folderSize += f.metadata.size;
          });
          console.log(`  Total size of "${folder}/": ${(folderSize / 1024 / 1024).toFixed(2)} MB`);
        }
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkStorage();
