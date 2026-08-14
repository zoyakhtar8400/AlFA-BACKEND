const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const token = jwt.sign({ id: 1, role: 'admin', store_id: 'STORE_1' }, '7FGnB8A2WrgmfJaMJYTfM7tDS7mYUNDa', { expiresIn: '1h' });
    
    // Create reservation for a future date (e.g. 2026-08-20)
    const createRes = await axios.post('http://localhost:3000/api/reservations', {
      tableId: 5,
      customerName: 'Future Guest Zoya',
      phone: '9988776655',
      persons: 6,
      bookingDate: '2026-08-20',
      bookingTime: '19:30',
      occasion: 'Anniversary Dinner'
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Created future reservation:', createRes.data?.reservation);

    // Fetch all reservations
    const allRes = await axios.get('http://localhost:3000/api/reservations', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('All reservations count:', allRes.data?.reservations?.length);
    console.log('Latest reservation:', allRes.data?.reservations?.[0]);

    // Fetch reservations filtered by future date
    const dateFiltered = await axios.get('http://localhost:3000/api/reservations?date=2026-08-20', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Reservations on 2026-08-20 count:', dateFiltered.data?.reservations?.length);
    console.log('Reservations on 2026-08-20:', dateFiltered.data?.reservations);
  } catch(e) {
    console.error('Test error:', e.message, e.response?.data);
  }
})();
