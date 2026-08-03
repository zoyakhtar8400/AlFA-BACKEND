const SAMPLE_CURRENT_ORDER_STATE = {
  total: 2983.0,
  items: [
    {
      title: 'Americana',
      quantity: 1,
      amount: 10,
      addons: [
        {
          title: 'Small',
          quantity: 1,
          amount: 10,
        },
        {
          title: 'Turkish Beans',
          quantity: 1,
          amount: 10,
        },
      ],
    },
    {
      title: 'Peets Tiramasu',
      quantity: 223,
      amount: 1030,
    },
    {
      title: 'Large White Chocolate Mocha Iced',
      quantity: 2,
      amount: 170,
    },
    {
      title: 'Medium White Chocolate Mocha',
      quantity: 4,
      amount: 270,
    },
    {
      title: 'Small Caramel Macchiato Iced',
      quantity: 4,
      amount: 270,
    },
    {
      title: 'Large Latte Iced',
      quantity: 4,
      amount: 270,
    },
  ],
  billNumber: 1,
  qrCode: 'https://order.tmbill.com/outlet/22446688739675',
};

const CD_MEDIA_FIT = {
  CONTAIN: 'contain',
  COVER: 'cover',
};

module.exports = {
  SAMPLE_CURRENT_ORDER_STATE,
  CD_MEDIA_FIT,
};
