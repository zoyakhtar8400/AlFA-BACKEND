/**
 * Change the type based on current application
 */
const APP_TYPE = {
  MASTER_POS: 'MASTER_POS',
  TERMINAL: 'TERMINAL',
};

const ORDER_SOURCE = [
  {
    title: 'Atlantic POS',
    value: 'atlantic_pos',
  },
  {
    title: 'Online Order',
    value: 'digital',
  },
  {
    title: 'Self Ordering Kiosk',
    value: 'kiosk',
  },
  {
    title: 'Captain App',
    value: 'captain',
  },
];

const ORDER_SOURCE_MAP = {
  all: 'Default',
  atlantic_pos: 'Atlantic POS',
  digital: 'Online Order',
  kiosk: 'Self Ordering Kiosk',
  captain: 'Captain App',
};

const ORDER_SOURCE_FOR_PRINT = {
  ATLANTIC_POS: 'atlantic_pos',
  DIGITAL: 'digital',
  KIOSK: 'kiosk',
  CAPTAIN: 'captain',
};

module.exports = {
  APP_TYPE,
  ORDER_SOURCE,
  ORDER_SOURCE_MAP,
  ORDER_SOURCE_FOR_PRINT,
};
