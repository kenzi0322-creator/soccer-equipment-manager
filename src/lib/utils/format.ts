/**
 * Formats internal equipment codes into human-readable labels.
 * Example: B1 -> 一般1, OTH-16 -> 共16
 */
export const formatItemCode = (code: string, includeInternal: boolean = false) => {
  if (!code) return '';
  
  let label = code;
  if (code.startsWith('B')) label = `一般${code.slice(1)}`;
  else if (code.startsWith('T')) label = `O40都${code.slice(1)}`;
  else if (code.startsWith('S')) label = `シニア${code.slice(1)}`;
  else if (code.startsWith('U')) label = `アップ${code.slice(1)}`;
  else if (code.startsWith('OTH-')) label = `共${code.split('-')[1]}`;
  
  if (includeInternal && label !== code) {
    return `${label}〔${code}〕`;
  }
  
  return label;
};
