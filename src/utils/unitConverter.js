// Conversion factors to base units (grams for weight, ml for volume)
const CONVERSIONS = {
  // Weight to Grams (g)
  g: 1,
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
  
  // Volume to Milliliters (ml)
  ml: 1,
  l: 1000,
  gal: 3785.41,
  'fl oz': 29.5735
};

export const getType = (unit) => {
  if (['g', 'kg', 'lb', 'oz'].includes(unit.toLowerCase())) return 'weight';
  if (['ml', 'l', 'gal', 'fl oz'].includes(unit.toLowerCase())) return 'volume';
  return 'unit'; // piece, packet, etc.
};

// Convert ANY unit to its base metric unit (g or ml)
export const toBase = (amount, unit) => {
  const u = unit.toLowerCase();
  if (CONVERSIONS[u]) {
    return amount * CONVERSIONS[u];
  }
  return amount; // Unrecognized or 'unit'
};

// Convert FROM base unit (g or ml) to a specific target unit
export const fromBase = (baseAmount, targetUnit) => {
  const u = targetUnit.toLowerCase();
  if (CONVERSIONS[u]) {
    return baseAmount / CONVERSIONS[u];
  }
  return baseAmount;
};

// Format a base amount for display in the preferred system
// system: 'metric' | 'imperial'
export const formatDisplay = (baseAmount, baseType, system) => {
  if (baseType === 'unit') return `${baseAmount.toFixed(2)} unid.`;
  
  if (system === 'metric') {
    if (baseType === 'weight') {
      return baseAmount >= 1000 ? `${(baseAmount / 1000).toFixed(2)} kg` : `${baseAmount.toFixed(0)} g`;
    } else {
      return baseAmount >= 1000 ? `${(baseAmount / 1000).toFixed(2)} L` : `${baseAmount.toFixed(0)} ml`;
    }
  } else {
    // Imperial
    if (baseType === 'weight') {
      const lbs = baseAmount / CONVERSIONS.lb;
      return lbs >= 1 ? `${lbs.toFixed(2)} lb` : `${(baseAmount / CONVERSIONS.oz).toFixed(2)} oz`;
    } else {
      const gals = baseAmount / CONVERSIONS.gal;
      return gals >= 1 ? `${gals.toFixed(2)} gal` : `${(baseAmount / CONVERSIONS['fl oz']).toFixed(2)} fl oz`;
    }
  }
};
