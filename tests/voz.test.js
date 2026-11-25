import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretarFala } from '../js/voz.js';
import { defaultState } from '../js/store.js';

const CASA = defaultState().categorias.casa;
const PJ = defaultState().categorias.pj;
const f = (txt, cats = CASA) => interpretarFala(txt, cats);

test('frase completa com número em dígitos', () => {
  assert.deepEqual(f('mercado 87,50 no pix'), { valor: 8750, categoria: 'Mercado', pagamento: 'pix', parcelas: 1 });
});

test('reais e centavos', () => {
  assert.equal(f('87 reais e 50 centavos dinheiro').valor, 8750);
  assert.equal(f('87 reais e 50 centavos dinheiro').pagamento, 'dinheiro');
  assert.equal(f('uber 23 e 40 no pix').valor, 2340);
  assert.equal(f('uber 23 e 40 no pix').categoria, 'Transporte');
});

test('número falado por extenso', () => {
  assert.equal(f('oitenta e sete reais no pix mercado').valor, 8700);
  assert.equal(f('mil e duzentos de aluguel no pix').valor, 120000);
  assert.equal(f('mil e duzentos de aluguel no pix').categoria, 'Aluguel');
  assert.equal(f('cem reais de gasolina').valor, 10000);
  assert.equal(f('duzentos e cinquenta e nove e noventa').valor, 25990);
});

test('valores com R$, milhar e sem centavos', () => {
  assert.equal(f('R$ 1.234,56 farmácia débito').valor, 123456);
  assert.equal(f('aluguel 1500').valor, 150000);
  assert.equal(f('aluguel 2.500 pix').valor, 250000);
  assert.equal(f('luz 189,90').valor, 18990);
});

test('cartão parcelado e débito', () => {
  assert.deepEqual(f('TV 600 reais no cartão em 3 vezes'), { valor: 60000, categoria: null, pagamento: 'cartao', parcelas: 3 });
  assert.equal(f('geladeira 3000 no crédito em doze vezes').parcelas, 12);
  assert.equal(f('geladeira 3000 no crédito em doze vezes').valor, 300000);
  assert.equal(f('tênis 400 cartão 4x').parcelas, 4);
  assert.deepEqual(f('farmácia 32 no débito'), { valor: 3200, categoria: 'Saúde', pagamento: 'cartao', parcelas: 1 });
});

test('palavras do dia a dia viram a categoria certa', () => {
  assert.equal(f('conta de luz 189,90').categoria, 'Contas da casa');
  assert.equal(f('ifood 45 pix').categoria, 'Comida fora');
  assert.equal(f('supermercado 300').categoria, 'Mercado');
  assert.equal(f('cinema 60').categoria, 'Lazer');
});

test('aba PJ usa as categorias da PJ', () => {
  assert.equal(f('frete 22 reais pix', PJ).categoria, 'Frete');
  assert.equal(f('anúncio 150 no cartão', PJ).categoria, 'Anúncios (Ads)');
  assert.equal(f('pagamento do bruno 500 pix', PJ).categoria, 'Terceirizados (Bruno)');
  assert.equal(f('mercado 50', PJ).categoria, null, 'Mercado não existe na PJ');
});

test('categoria criada pelo usuário também é reconhecida', () => {
  assert.equal(f('ração do pet 120', [...CASA, 'Pet']).categoria, 'Pet');
});

test('sem valor ou sem forma de pagamento devolve null nesses campos', () => {
  assert.deepEqual(f('mercado no pix'), { valor: null, categoria: 'Mercado', pagamento: 'pix', parcelas: 1 });
  assert.equal(f('mercado 50').pagamento, null);
  assert.deepEqual(f(''), { valor: null, categoria: null, pagamento: null, parcelas: 1 });
});
