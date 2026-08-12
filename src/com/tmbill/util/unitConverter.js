/**
 * Centralized Unit Conversion Utility for ALFA HMS
 * Safely converts quantities between different unit representations
 * (e.g., Kg ↔ g, L ↔ ml, Dozen ↔ Pcs) to prevent inventory deduction mismatches.
 */

function normalizeUnit(unitStr) {
  if (!unitStr || typeof unitStr !== 'string') return 'pcs';
  const u = unitStr.trim().toLowerCase();
  
  if (['kg', 'kilos', 'kilogram', 'kilograms'].includes(u)) return 'kg';
  if (['g', 'gm', 'gram', 'grams'].includes(u)) return 'g';
  if (['l', 'ltr', 'liter', 'liters', 'litre', 'litres'].includes(u)) return 'l';
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return 'ml';
  if (['dozen', 'doz'].includes(u)) return 'dozen';
  if (['box', 'boxes'].includes(u)) return 'box';
  if (['pcs', 'pc', 'piece', 'pieces', 'unit', 'units'].includes(u)) return 'pcs';

  return u;
}

/**
 * Convert quantity from one unit to another target unit.
 * @param {number} qty - The numerical quantity to convert.
 * @param {string} fromUnit - Original unit (e.g. 'g').
 * @param {string} toUnit - Target unit (e.g. 'kg').
 * @returns {number} Converted quantity in target unit.
 */
function convertQuantity(qty, fromUnit, toUnit) {
  const amount = Number(qty) || 0;
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return amount;

  // Mass conversion (kg <-> g)
  if (from === 'g' && to === 'kg') return amount / 1000;
  if (from === 'kg' && to === 'g') return amount * 1000;

  // Volume conversion (l <-> ml)
  if (from === 'ml' && to === 'l') return amount / 1000;
  if (from === 'l' && to === 'ml') return amount * 1000;

  // Count conversion (dozen <-> pcs)
  if (from === 'dozen' && to === 'pcs') return amount * 12;
  if (from === 'pcs' && to === 'dozen') return amount / 12;

  // Fallback: if units don't belong to a known conversion pair, return original amount
  return amount;
}

module.exports = {
  normalizeUnit,
  convertQuantity
};
