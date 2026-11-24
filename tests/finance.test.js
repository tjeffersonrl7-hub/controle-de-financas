import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, monthOf, shiftMonth, monthLabel, entriesFor, total, byCategory, sobrou } from '../js/finance.js';

const e = (id, aba, valor, categoria, data) => ({ id, aba, valor, categoria, obs: '', data });
const s = {
  version: 1,
  categorias: { casa: [], pj: [] },
  renda: { '2026-11': 500000 },
  entries: [
    e('1', 'casa', 8750, 'Mercado', '2026-11-03'),
    e('2', 'casa', 14000, 'Contas da casa', '2026-11-10'),
    e('3', 'casa', 5000, 'Lazer', '2026-10-28'),
    e('4', 'pj', 2200, 'Frete', '2026-11-05'),
  ],
};

test('todayISO usa a data local, mesmo às 23h30', () => {
  assert.equal(todayISO(new Date(2026, 10, 24, 23, 30)), '2026-11-24');
  assert.equal(todayISO(new Date(2026, 0, 5, 0, 10)), '2026-01-05');
});

test('monthOf, shiftMonth e monthLabel', () => {
  assert.equal(monthOf('2026-11-24'), '2026-11');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(monthLabel('2026-11'), 'Novembro 2026');
  assert.equal(monthLabel('2027-03'), 'Março 2027');
});

test('entriesFor separa por aba e mês, mais recente primeiro', () => {
  const casa = entriesFor(s, 'casa', '2026-11');
  assert.deepEqual(casa.map(x => x.id), ['2', '1']);
  assert.equal(total(casa), 22750);
  assert.equal(total(entriesFor(s, 'pj', '2026-11')), 2200);
  assert.equal(total(entriesFor(s, 'casa', '2026-09')), 0);
});

test('byCategory soma a mesma categoria e ordena do maior pro menor', () => {
  const list = [e('a', 'casa', 100, 'Mercado', '2026-11-01'), e('b', 'casa', 300, 'Lazer', '2026-11-01'), e('c', 'casa', 250, 'Mercado', '2026-11-02')];
  assert.deepEqual(byCategory(list), [{ categoria: 'Mercado', total: 350 }, { categoria: 'Lazer', total: 300 }]);
});

test('sobrou = renda menos gastos da Casa, PJ não entra', () => {
  assert.equal(sobrou(s, '2026-11'), 477250);
  assert.equal(sobrou(s, '2026-10'), -5000);
});

test('entriesFor: no mesmo dia, o último lançado aparece primeiro', () => {
  const st = { ...s, entries: [e('a', 'pj', 1, 'X', '2026-11-24'), e('b', 'pj', 2, 'Y', '2026-11-24'), e('c', 'pj', 3, 'Z', '2026-11-20')] };
  assert.deepEqual(entriesFor(st, 'pj', '2026-11').map(x => x.id), ['b', 'a', 'c']);
});
