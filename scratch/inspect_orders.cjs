const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://demctbygmsrlycyaewwy.supabase.co',
  'sb_secret_DUXTLg5LJNr-31LJkEcY4Q_WrO3odib'
);

async function main() {
  // Find all orders belonging to the STL-20260721-144024 walk-in bill
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, tile, message, selling_price, base_price, quantity, type, created_at, name, email')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) { console.error(error); return; }

  // Find all orders for this bill (by message or type containing the bill number)
  const billNum = 'STL-20260721-144024';
  const related = orders.filter(o =>
    (o.message && o.message.includes(billNum)) ||
    (o.type && o.type.includes(billNum))
  );

  console.log(`\nOrders for bill ${billNum}: ${related.length} found`);
  related.forEach(o => {
    console.log('\n--- ORDER ---');
    console.log('ID:', o.id);
    console.log('Name:', o.name);
    console.log('Tile:', o.tile);
    console.log('Selling Price:', o.selling_price);
    console.log('Base Price:', o.base_price);
    console.log('Quantity:', o.quantity);
    console.log('Type:', o.type);
    console.log('Message:', o.message);
    console.log('---');
  });

  // Total selling price across all grouped orders
  const totalRev = related.reduce((sum, o) => sum + (Number(o.selling_price) || 0) * (parseInt(o.quantity) || 1), 0);
  const totalCost = related.reduce((sum, o) => sum + (Number(o.base_price) || 0) * (parseInt(o.quantity) || 1), 0);
  console.log(`\nGrouped Total Revenue: Rs. ${totalRev}`);
  console.log(`Grouped Total Cost: Rs. ${totalCost}`);
  console.log(`Grouped Profit: Rs. ${totalRev - totalCost}`);
}

main().catch(console.error);
