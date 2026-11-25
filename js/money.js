// Converte texto digitado em centavos (inteiro) e centavos em "R$ 1.234,56".

const MAX_CENTS = 1_000_000_000; // R$ 10.000.000,00
// "1234" ou "1.234" (milhar sempre com 3 dígitos), com ",56" opcional
const COM_VIRGULA = /^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/;
const PONTO_DECIMAL = /^\d+\.\d{1,2}$/; // "87.5" (teclado só com ponto)

export function parseBRL(text) {
  const s = String(text ?? '').replace(/R\$/gi, '').replace(/\s/g, '');
  let num;
  if (PONTO_DECIMAL.test(s) && !/^\d{1,3}\.\d{3}$/.test(s)) num = s;
  else if (COM_VIRGULA.test(s)) num = s.replace(/\./g, '').replace(',', '.');
  else return null;
  const cents = Math.round(Number(num) * 100);
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents) {
  const txt = fmt.format(Math.abs(cents) / 100).replace(/\s/g, ' ');
  return cents < 0 ? '-' + txt : txt;
}
