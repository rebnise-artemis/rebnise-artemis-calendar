const CRLF = '\r\n';
const MAX_OCTETS = 75;

export function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function byteLength(str) {
  return new TextEncoder().encode(str).length;
}

export function foldLine(line) {
  if (byteLength(line) <= MAX_OCTETS) return line;

  const parts = [];
  let current = '';
  // 1行目は75オクテット、継続行は先頭スペース1オクテットを含めて75オクテット
  let limit = MAX_OCTETS;

  for (const ch of [...line]) {
    if (byteLength(current) + byteLength(ch) > limit) {
      parts.push(current);
      current = ch;
      limit = MAX_OCTETS - 1;
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  return parts.map((p, i) => (i === 0 ? p : ' ' + p)).join(CRLF);
}
