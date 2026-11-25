import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, load, addCompra, updateCompra, deleteCompra, compraDe } from '../js/store.js';

const base = { aba: 'casa', valor: 60000, categoria: 'Lazer', obs: 'TV', data: '2026-11-24' };
const mem = init => { const d = { ...init }; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, d }; };

test('compra no Pix vira 1 lançamento com a forma de pagamento', () => {
  const s = addCompra(defaultState(), { ...base, pagamento: 'pix', parcelas: 1 });
  assert.equal(s.entries.length, 1);
  const e = s.entries[0];
  assert.equal(e.pagamento, 'pix'); assert.equal(e.valor, 60000);
  assert.equal(e.parcela, 1); assert.equal(e.parcelas, 1); assert.equal(typeof e.grupo, 'string');
});

test('cartão em 3x vira R$ 200 em cada um dos 3 meses, começando no mês da compra', () => {
  const s = addCompra(defaultState(), { ...base, pagamento: 'cartao', parcelas: 3 });
  assert.deepEqual(s.entries.map(e => [e.data, e.valor, e.parcela, e.parcelas]),
    [['2026-11-24', 20000, 1, 3], ['2026-12-24', 20000, 2, 3], ['2027-01-24', 20000, 3, 3]]);
  assert.equal(new Set(s.entries.map(e => e.grupo)).size, 1);
  assert.equal(new Set(s.entries.map(e => e.id)).size, 3);
});

test('centavo que sobra da divisão vai na primeira parcela', () => {
  const s = addCompra(defaultState(), { ...base, valor: 10000, pagamento: 'cartao', parcelas: 3 });
  assert.deepEqual(s.entries.map(e => e.valor), [3334, 3333, 3333]);
});

test('dia 31 em mês curto cai no último dia do mês', () => {
  const s = addCompra(defaultState(), { ...base, data: '2027-01-31', pagamento: 'cartao', parcelas: 3 });
  assert.deepEqual(s.entries.map(e => e.data), ['2027-01-31', '2027-02-28', '2027-03-31']);
});

test('Pix e dinheiro sempre 1 parcela, mesmo se mandar mais', () => {
  const s = addCompra(defaultState(), { ...base, pagamento: 'dinheiro', parcelas: 5 });
  assert.equal(s.entries.length, 1);
});

test('compraDe junta as parcelas de volta no valor total', () => {
  const s = addCompra(defaultState(), { ...base, pagamento: 'cartao', parcelas: 3 });
  assert.deepEqual(compraDe(s, s.entries[1].grupo), { aba: 'casa', valor: 60000, categoria: 'Lazer', obs: 'TV', data: '2026-11-24', pagamento: 'cartao', parcelas: 3 });
});

test('updateCompra refaz as parcelas e deleteCompra apaga todas', () => {
  let s = addCompra(defaultState(), { ...base, pagamento: 'cartao', parcelas: 3 });
  const g = s.entries[0].grupo;
  s = updateCompra(s, g, { ...base, valor: 40000, pagamento: 'cartao', parcelas: 2 });
  assert.deepEqual(s.entries.map(e => [e.valor, e.parcela, e.grupo]), [[20000, 1, g], [20000, 2, g]]);
  assert.equal(deleteCompra(s, g).entries.length, 0);
});

test('lançamento antigo, sem forma de pagamento, continua funcionando', () => {
  const antigo = { id: 'x', aba: 'casa', valor: 500, categoria: 'Mercado', obs: '', data: '2026-11-01' };
  const s = load(mem({ 'financas-v1': JSON.stringify({ ...defaultState(), entries: [antigo] }) }));
  assert.equal(s.entries.length, 1);
  assert.deepEqual(compraDe(s, 'x'), { aba: 'casa', valor: 500, categoria: 'Mercado', obs: '', data: '2026-11-01', pagamento: '', parcelas: 1 });
  assert.equal(deleteCompra(s, 'x').entries.length, 0);
});

test('load guarda e devolve as compras parceladas', () => {
  const s = addCompra(defaultState(), { ...base, pagamento: 'cartao', parcelas: 2 });
  const st = mem({ 'financas-v1': JSON.stringify(s) });
  assert.deepEqual(load(st), s);
});
