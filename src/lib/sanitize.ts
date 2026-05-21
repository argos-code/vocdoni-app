const UNSAFE_PROTOCOLS = new Set(['javascript:', 'vbscript:', 'data:'])

function decodeNumericEntities(url: string): string {
  return url
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * Returns an empty string for URLs with dangerous schemes (javascript:, vbscript:, data:),
 * including numeric HTML-entity–encoded variants. Safe URLs are returned unchanged.
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return url
  const normalized = decodeNumericEntities(url).trim().toLowerCase()
  for (const proto of UNSAFE_PROTOCOLS) {
    if (normalized.startsWith(proto)) return ''
  }
  return url
}
