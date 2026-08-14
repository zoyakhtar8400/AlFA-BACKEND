const rawOutletsList = [
  { id: 1, store_id: 'STORE_1', name: 'Main Restaurant', title: 'Main Restaurant' },
  { id: 4, store_id: 'STORE_4', name: 'Bar & Lounge', title: 'Bar & Lounge' },
  { id: 5, store_id: 'STORE_5', name: 'Cafe & Bakery', title: 'Cafe & Bakery' },
  { id: 3, store_id: 'STORE_3', name: 'City Restaurant', title: 'City Restaurant' },
  { id: 2, store_id: 'STORE_2', name: 'Airport Restaurant', title: 'Airport Restaurant' },
  { id: 1, store_id: 'STORE_1', name: 'Main Kitchen', title: 'Main Kitchen' }
];

const tables = [
  {
    id: 178,
    table_name: 'T03',
    store_id: 'STORE_1',
    department: 'Restaurant',
    section: 'Main Restaurant',
    floor: 'Ground Floor'
  },
  {
    id: 190,
    table_name: 'Airport T01',
    store_id: 'STORE_2',
    department: 'Restaurant',
    section: 'Airport Restaurant',
    floor: 'Ground Floor'
  }
];

function checkOutletMatch(t, activeRestaurant, rawOutletsList) {
  if (!activeRestaurant || activeRestaurant === 'All' || activeRestaurant === 'All Outlets') {
    return true;
  }

  const act = activeRestaurant.toLowerCase().trim();
  const tStore = String(t.store_id || '').trim();
  const tDept = String(t.department || '').toLowerCase().trim();
  const tSec = String(t.section || '').toLowerCase().trim();

  // Find selected outlet in raw outlets
  const matchedOutlet = rawOutletsList.find(o =>
    String(o.name || '').toLowerCase().trim() === act ||
    String(o.title || '').toLowerCase().trim() === act ||
    String(o.store_id || '').toLowerCase().trim() === act
  );

  const targetStoreId = matchedOutlet ? String(matchedOutlet.store_id || '').trim() : '';
  const isTargetPrimary = targetStoreId === 'STORE_1' || targetStoreId === '1' || (!targetStoreId && (act === 'main restaurant' || act === 'main'));

  // If table has store_id
  if (tStore) {
    if (targetStoreId) {
      return tStore.toUpperCase() === targetStoreId.toUpperCase() ||
             tStore.replace(/[^0-9]/g, '') === targetStoreId.replace(/[^0-9]/g, '');
    }
    // If matched by name
    return tDept === act || tSec === act;
  }

  // If table has no store_id (legacy), it belongs only to Primary Store (STORE_1 / Main Restaurant)
  return isTargetPrimary;
}

console.log('--- Filter: Airport Restaurant ---');
tables.forEach(t => {
  console.log(`Table ${t.table_name} (${t.store_id}) -> Match: ${checkOutletMatch(t, 'Airport Restaurant', rawOutletsList)}`);
});

console.log('\n--- Filter: Main Restaurant ---');
tables.forEach(t => {
  console.log(`Table ${t.table_name} (${t.store_id}) -> Match: ${checkOutletMatch(t, 'Main Restaurant', rawOutletsList)}`);
});

console.log('\n--- Filter: All Outlets ---');
tables.forEach(t => {
  console.log(`Table ${t.table_name} (${t.store_id}) -> Match: ${checkOutletMatch(t, 'All Outlets', rawOutletsList)}`);
});
