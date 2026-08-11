const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://demctbygmsrlycyaewwy.supabase.co',
  'sb_secret_DUXTLg5LJNr-31LJkEcY4Q_WrO3odib'
);

async function main() {
  // Fix Order 2: Golden Solstice Suite selling_price 3050 → 1950
  // Order ID: 1e0321fd-0ad0-4041-baa1-75d1a7a3b818
  // This makes the grouped total: 1500 + 1500 + 1950 = 4950 ✓
  const { data, error } = await supabase
    .from('orders')
    .update({ selling_price: 1950 })
    .eq('id', '1e0321fd-0ad0-4041-baa1-75d1a7a3b818')
    .select('id, tile, selling_price');

  if (error) {
    console.error('❌ Update failed:', error);
    return;
  }

  console.log('✅ Updated Golden Solstice Suite selling_price to 1950');
  console.log('Record:', data);

  // Verify the grouped total
  const { data: orders } = await supabase
    .from('orders')
    .select('id, tile, selling_price, base_price, quantity')
    .or('id.eq.783c4f7a-5c5d-4b7b-9d14-d7847fc619a5,id.eq.561df6c1-0feb-489d-add5-a21537b4b4a8,id.eq.1e0321fd-0ad0-4041-baa1-75d1a7a3b818');

  if (orders) {
    let totalRev = 0, totalCost = 0;
    orders.forEach(o => {
      const rev = Number(o.selling_price) * (parseInt(o.quantity) || 1);
      const cost = Number(o.base_price) * (parseInt(o.quantity) || 1);
      totalRev += rev;
      totalCost += cost;
      console.log(`  ${o.tile}: Rs. ${rev} (cost: ${cost})`);
    });
    console.log(`\n  Total Revenue: Rs. ${totalRev}`);
    console.log(`  Total Cost:    Rs. ${totalCost}`);
    console.log(`  Total Profit:  Rs. ${totalRev - totalCost}`);
  }
}

main().catch(console.error);
