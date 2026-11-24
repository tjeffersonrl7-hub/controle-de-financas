import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBRL, formatBRL } from '../js/money.js';

test('parseBRL entende vírgula, milhar e ponto decimal', () => {
  assert.equal(parseBRL('87,50'), 8750);
  assert.equal(parseBRL('1.234,56'), 123456);
  assert.equal(parseBRL('87'), 8700);
  assert.equal(parseBRL('87.5'), 8750);
  assert.equal(parseBRL(' R$ 10,00 '), 1000);
});

test('parseBRL recusa vazio, zero, negativo e texto', () => {
  for (const t of ['', '0', '-5', 'abc', '0,00']) assert.equal(parseBRL(t), null, t);
});

test('formatBRL mostra no formato brasileiro com espaço normal', () => {
  assert.equal(formatBRL(123456), 'R$ 1.234,56');
  assert.equal(formatBRL(5), 'R$ 0,05');
  assert.equal(formatBRL(-1000), '-R$ 10,00');
});
