const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const token = jwt.sign({ id: 1, role: 'admin', store_id: 'STORE_1' }, '7FGnB8A2WrgmfJaMJYTfM7tDS7mYUNDa', { expiresIn: '1h' });
    
    // 1. Reserve Table 10
    console.log('1. Reserving Table 10...');
    const res = await axios.post('http://localhost:3000/api/reservations', {
      tableId: 10,
      customerName: 'Test Seated Guest',
      phone: '9876543210',
      persons: 4,
      bookingDate: new Date().toISOString().split('T')[0],
      isToday: true
    }, { headers: { Authorization: 'Bearer ' + token } });
    console.log('Reservation response status:', res.status);

    // 2. Check table status before KOT
    const tblBefore = await axios.get('http://localhost:3000/api/tables/10', { headers: { Authorization: 'Bearer ' + token } });
    console.log('Table 10 status before KOT:', tblBefore.data?.table?.status, 'color:', tblBefore.data?.table?.color);

    // 3. Cut KOT for Table 10
    console.log('2. Cutting KOT on Table 10...');
    const kotRes = await axios.post('http://localhost:3000/api/kot', {
      tableId: 10,
      tableNo: '10',
      customerName: 'Test Seated Guest',
      waiter: 'Staff',
      items: [{ itemId: 1, itemName: 'Butter Chicken', qty: 2, unitPrice: 350 }]
    }, { headers: { Authorization: 'Bearer ' + token } });
    console.log('KOT created:', kotRes.data?.kotId || kotRes.data?.custom_bill_number);

    // 4. Check table status after KOT
    const tblAfter = await axios.get('http://localhost:3000/api/tables/10', { headers: { Authorization: 'Bearer ' + token } });
    console.log('Table 10 status after KOT:', tblAfter.data?.table?.status, 'color:', tblAfter.data?.table?.color, 'actions:', tblAfter.data?.table?.available_actions);
  } catch(e) {
    console.error('Error:', e.message, e.response?.data);
  }
})();
