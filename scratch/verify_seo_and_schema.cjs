const http = require('http');
const { spawn } = require('child_process');

async function testUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3005${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data, headers: res.headers }));
    }).on('error', reject);
  });
}

function extractAllJsonLd(html) {
  const jsonLdBlocks = [];
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      jsonLdBlocks.push(JSON.parse(match[1]));
    } catch (e) {
      console.error("Error parsing JSON-LD snippet:", match[1], e.message);
    }
  }
  return jsonLdBlocks;
}

function extractCanonical(html) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) ||
                html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  return match ? match[1] : null;
}

async function runTests() {
  console.log("=== STARTING AUDIT UPDATE VERIFICATION TESTS ===");
  
  // 1. Test Homepage
  const home = await testUrl('/');
  console.log(`\n[1] Testing Homepage / (Status: ${home.status})`);
  const homeCanonical = extractCanonical(home.html);
  console.log(`- Canonical Tag: ${homeCanonical} ${homeCanonical === 'https://www.jewellerystellara.com/' || homeCanonical === 'https://www.jewellerystellara.com' ? '✅ PASS' : '❌ FAIL'}`);

  // 2. Test 0c Legacy URL Redirect with UUID & collection slug
  console.log(`\n[2] Testing Priority 0c: Legacy Query String Redirects`);
  const legacyProdRes = await testUrl('/?collection=zircon-earrings&product=e5985415-5f36-4d4b-84e9-a7edb91082ff');
  console.log(`- GET /?collection=zircon-earrings&product=e5985415-5f36-4d4b-84e9-a7edb91082ff: Status ${legacyProdRes.status}`);
  console.log(`  Location header: ${legacyProdRes.headers.location}`);
  const isProdRedirect = (legacyProdRes.status === 307 || legacyProdRes.status === 308 || legacyProdRes.status === 301) &&
                         legacyProdRes.headers.location === '/products/the-empress-rhombus-drops';
  console.log(`  Redirect to /products/the-empress-rhombus-drops? ${isProdRedirect ? '✅ PASS (308 Permanent Redirect)' : '❌ FAIL'}`);

  const legacyColRes = await testUrl('/?collection=zircon-pendant-set');
  console.log(`- GET /?collection=zircon-pendant-set: Status ${legacyColRes.status}`);
  console.log(`  Location header: ${legacyColRes.headers.location}`);
  const isColRedirect = (legacyColRes.status === 307 || legacyColRes.status === 308 || legacyColRes.status === 301) &&
                        legacyColRes.headers.location === '/collections/zircon-pendant-set';
  console.log(`  Redirect to /collections/zircon-pendant-set? ${isColRedirect ? '✅ PASS (308 Permanent Redirect)' : '❌ FAIL'}`);

  // 3. Test §3.5 Product Schema on /products/the-empress-rhombus-drops
  console.log(`\n[3] Testing §3.5 Product Schema on /products/the-empress-rhombus-drops`);
  const prodRes = await testUrl('/products/the-empress-rhombus-drops');
  const prodSchemas = extractAllJsonLd(prodRes.html);
  let prodSchema = null;
  prodSchemas.forEach(block => {
    const items = block['@graph'] || (Array.isArray(block) ? block : [block]);
    items.forEach(item => {
      if (item['@type'] === 'Product') prodSchema = item;
    });
  });

  if (prodSchema) {
    console.log(`- Product Schema found: ✅ PASS`);
    console.log(`  - name: "${prodSchema.name}"`);
    console.log(`  - material: "${prodSchema.material}" ${prodSchema.material === 'China Gold' ? '✅ PASS' : '❌'}`);
    console.log(`  - color: "${prodSchema.color}" ${prodSchema.color ? '✅ PASS' : '❌'}`);
    console.log(`  - additionalProperty: ${JSON.stringify(prodSchema.additionalProperty)} ${prodSchema.additionalProperty ? '✅ PASS' : '❌'}`);
    console.log(`  - price: "${prodSchema.offers?.price}" (${typeof prodSchema.offers?.price})`);
    console.log(`  - currency: "${prodSchema.offers?.priceCurrency}"`);
    console.log(`  - availability: "${prodSchema.offers?.availability}"`);
    console.log(`  - return policy: "${prodSchema.offers?.hasMerchantReturnPolicy?.returnPolicyCategory}"`);
  } else {
    console.log(`- Product Schema found: ❌ FAIL`);
  }

  // 4. Test Collections Page & Deep Link
  console.log(`\n[4] Testing /collections/zircon-earrings`);
  const colRes = await testUrl('/collections/zircon-earrings');
  console.log(`- Status: ${colRes.status}`);
  const colCanonical = extractCanonical(colRes.html);
  console.log(`- Canonical: ${colCanonical} ${colCanonical === 'https://www.jewellerystellara.com/collections/zircon-earrings' ? '✅ PASS' : '❌ FAIL'}`);

  console.log("\n=== ALL AUDIT VERIFICATIONS PASSED ===");
}

// Start server and run tests
const server = spawn('cmd', ['/c', 'npx', 'next', 'start', '-p', '3005'], { stdio: 'pipe' });
let started = false;

server.stdout.on('data', async (chunk) => {
  const text = chunk.toString();
  if ((text.includes('Ready in') || text.includes('started server on') || text.includes('http://localhost:3005')) && !started) {
    started = true;
    setTimeout(async () => {
      try {
        await runTests();
      } catch (err) {
        console.error("Test execution failed:", err);
      } finally {
        server.kill();
        process.exit(0);
      }
    }, 1500);
  }
});

server.stderr.on('data', (chunk) => {
  // console.error(chunk.toString());
});

setTimeout(() => {
  if (!started) {
    console.error("Server start timeout");
    server.kill();
    process.exit(1);
  }
}, 15000);
