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

test('parseBRL recusa pontos de milhar mal agrupados', () => {
  for (const t of ['1.234.56', '1.2.3', '12.34.567', '1.23,45', '1,2,3']) assert.equal(parseBRL(t), null, t);
  assert.equal(parseBRL('1.234.567,89'), 123456789);
  assert.equal(parseBRL('1.234'), 123400);
});

test('parseBRL recusa valor acima de R$ 10.000.000,00', () => {
  assert.equal(parseBRL('10.000.000,00'), 1000000000);
  assert.equal(parseBRL('10000000,01'), null);
  assert.equal(parseBRL('99999999999999999999'), null);
});
