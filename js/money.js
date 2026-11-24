// Converte texto digitado em centavos (inteiro) e centavos em "R$ 1.234,56".

export function parseBRL(text) {
  let s = String(text ?? '').replace(/R\$/gi, '').replace(/\s/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/\.\d{1,2}$/.test(s) && s.split('.').length === 2) {
    // "87.5" → ponto é decimal
  } else {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 ? cents : null;
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents) {
  const txt = fmt.format(Math.abs(cents) / 100).replace(/\s/g, ' ');
  return cents < 0 ? '-' + txt : txt;
}
