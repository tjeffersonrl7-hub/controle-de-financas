import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, load, save, addEntry, updateEntry, deleteEntry, setRenda, addCategory, renameCategory, deleteCategory } from '../js/store.js';

const memStorage = (init = {}) => {
  const data = { ...init };
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
};
const novo = { aba: 'casa', valor: 8750, categoria: 'Mercado', obs: 'Atacadão', data: '2026-11-24' };

test('defaultState tem as categorias iniciais da spec', () => {
  const s = defaultState();
  assert.deepEqual(s.categorias.casa, ['Mercado', 'Contas da casa', 'Aluguel', 'Transporte', 'Saúde', 'Lazer', 'Comida fora', 'Outros']);
  assert.deepEqual(s.categorias.pj, ['Mercadoria', 'Anúncios (Ads)', 'Embalagem', 'Frete', 'Terceirizados (Bruno)', 'Taxas', 'Outros']);
  assert.deepEqual(s.entries, []);
  assert.deepEqual(s.renda, {});
});

test('load devolve o padrão com storage vazio, corrompido ou sem version', () => {
  for (const v of [undefined, '{lixo', '{"entries":[]}', 'null']) {
    const st = memStorage(v === undefined ? {} : { 'financas-v1': v });
    assert.deepEqual(load(st), defaultState(), String(v));
  }
});

test('save e load devolvem o mesmo state', () => {
  const st = memStorage();
  const s = addEntry(defaultState(), novo);
  save(st, s);
  assert.ok('financas-v1' in st.data);
  assert.deepEqual(load(st), s);
});

test('addEntry não altera o original e gera id', () => {
  const s0 = defaultState();
  const s1 = addEntry(s0, novo);
  assert.equal(s0.entries.length, 0);
  assert.equal(s1.entries.length, 1);
  assert.equal(typeof s1.entries[0].id, 'string');
  assert.equal(s1.entries[0].valor, 8750);
});

test('updateEntry e deleteEntry', () => {
  const s1 = addEntry(defaultState(), novo);
  const id = s1.entries[0].id;
  const s2 = updateEntry(s1, id, { valor: 9000, categoria: 'Lazer' });
  assert.equal(s2.entries[0].valor, 9000);
  assert.equal(s2.entries[0].categoria, 'Lazer');
  assert.equal(s1.entries[0].valor, 8750);
  assert.equal(deleteEntry(s2, id).entries.length, 0);
});

test('setRenda guarda por mês', () => {
  const s = setRenda(defaultState(), '2026-11', 500000);
  assert.equal(s.renda['2026-11'], 500000);
});

test('deleteCategory manda os lançamentos para Outros', () => {
  const s1 = addEntry(defaultState(), novo);
  const s2 = deleteCategory(s1, 'casa', 'Mercado');
  assert.ok(!s2.categorias.casa.includes('Mercado'));
  assert.equal(s2.entries[0].categoria, 'Outros');
});

test('Outros não pode ser apagada nem renomeada', () => {
  const s = defaultState();
  assert.deepEqual(deleteCategory(s, 'casa', 'Outros'), s);
  assert.deepEqual(renameCategory(s, 'pj', 'Outros', 'Diversos'), s);
});

test('renameCategory renomeia só nos lançamentos daquela aba', () => {
  let s = addEntry(defaultState(), novo);
  s = addEntry(s, { ...novo, aba: 'pj', categoria: 'Outros' });
  s = addCategory(s, 'pj', 'Mercado');
  s = addEntry(s, { ...novo, aba: 'pj', categoria: 'Mercado' });
  const r = renameCategory(s, 'casa', 'Mercado', 'Supermercado');
  assert.ok(r.categorias.casa.includes('Supermercado'));
  assert.equal(r.entries.find(x => x.aba === 'casa').categoria, 'Supermercado');
  assert.equal(r.entries.find(x => x.aba === 'pj' && x.categoria === 'Mercado').categoria, 'Mercado');
});

test('addCategory e renameCategory recusam nome vazio ou repetido', () => {
  const s = defaultState();
  assert.deepEqual(addCategory(s, 'casa', 'Mercado'), s);
  assert.deepEqual(addCategory(s, 'casa', '   '), s);
  assert.deepEqual(renameCategory(s, 'casa', 'Lazer', 'Mercado'), s);
  assert.ok(addCategory(s, 'casa', ' Pet ').categorias.casa.includes('Pet'));
});
