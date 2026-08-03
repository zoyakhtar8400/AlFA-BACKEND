const Colors = {
  // FREE_TABLE: '#1A9A62',
  FREE_TABLE: '#007c45',
  CURRENT_TABLE: '#F8BB5D',
  KOT_SAVED: '#0095d7',
  KOT_HAS_ITEMS: '#00C9A7',
  BILL_SAVED: '#EF5350',
  BILL_PRINTED: '#4B4453',
  DRAFT_BILL_PRINTED: '#8d6e63',
  RESERVED_TABLE: '#ffc107',
};

const State = {
  FREE_TABLE: 0,
  KOT_SAVED: 1,
  KOT_HAS_ITEMS: 5,
  BILL_SAVED: 2,
  BILL_PRINTED: 3,
  DRAFT_BILL_PRINTED: 4,
};

module.exports = {
  Colors,
  State,
};
