// Entende uma frase falada ("mercado 87,50 no pix") e devolve valor, categoria, pagamento e parcelas.
// Não salva nada: só preenche a tela, e a pessoa confere antes de salvar.
import { parseBRL } from './money.js';

const semAcento = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const norm = t => semAcento(String(t ?? '').toLowerCase());

// ---------- números falados por extenso → dígitos ----------
const NUM = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300,
  quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
};
const ehNumero = w => w === 'mil' || w in NUM;

// "duzentos e cinquenta e nove e noventa" → "259 e 90" (um número só termina quando não dá mais pra somar)
function extensoParaDigitos(texto) {
  const w = texto.split(/\s+/).filter(Boolean);
  const out = [];
  let i = 0;
  while (i < w.length) {
    if (!ehNumero(w[i])) { out.push(w[i++]); continue; }
    let total = 0, cur = 0, limite = Infinity;
    const soma = palavra => {
      if (palavra === 'mil') { total += (cur || 1) * 1000; cur = 0; limite = 1000; return; }
      const n = NUM[palavra];
      cur += n;
      limite = n >= 100 ? 100 : n >= 20 ? 10 : 0;
    };
    soma(w[i++]);
    while (i < w.length) {
      const prox = w[i] === 'e' ? w[i + 1] : w[i];
      if (!prox || !ehNumero(prox)) break;
      const cabe = prox === 'mil' ? total === 0 && cur > 0 && cur < 1000 : NUM[prox] < limite;
      if (!cabe) break;
      i += w[i] === 'e' ? 2 : 1;
      soma(prox);
    }
    out.push(String(total + cur));
  }
  return out.join(' ');
}

// ---------- categoria: nome da própria categoria ou palavras do dia a dia ----------
const SINONIMOS = {
  'Mercado': ['supermercado', 'atacadao', 'atacado', 'feira', 'hortifruti', 'padaria', 'acougue', 'sacolao'],
  'Contas da casa': ['luz', 'agua', 'internet', 'energia', 'gas', 'telefone', 'celular', 'condominio', 'conta', 'boleto'],
  'Aluguel': ['aluguel'],
  'Transporte': ['uber', 'gasolina', 'combustivel', 'onibus', 'metro', 'estacionamento', 'pedagio', 'taxi', 'passagem'],
  'Saúde': ['farmacia', 'remedio', 'remedios', 'medico', 'consulta', 'exame', 'dentista', 'hospital'],
  'Lazer': ['cinema', 'bar', 'show', 'passeio', 'viagem', 'festa', 'parque'],
  'Comida fora': ['restaurante', 'lanche', 'ifood', 'almoco', 'jantar', 'pizza', 'hamburguer', 'lanchonete', 'cafe', 'delivery'],
  'Mercadoria': ['fornecedor', 'estoque', 'pecas', 'compra de mercadoria'],
  'Anúncios (Ads)': ['anuncio', 'anuncios', 'ads', 'propaganda', 'impulsionamento', 'trafego'],
  'Embalagem': ['embalagens', 'sacola', 'sacolas', 'caixa', 'caixas', 'etiqueta', 'etiquetas'],
  'Frete': ['correios', 'envio', 'entrega', 'motoboy', 'postagem'],
  'Terceirizados': ['terceirizado', 'freelancer', 'freela'],
  'Terceirizados (Bruno)': ['bruno', 'terceirizado', 'terceirizados'],
  'Taxas': ['taxa', 'tarifa', 'comissao'],
};
const temPalavra = (texto, termo) => new RegExp(`(^|[^a-z0-9])${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(texto);

function achaCategoria(texto, categorias) {
  const opcoes = categorias.filter(c => c !== 'Outros');
  // 1º: o nome da categoria (ou a parte dentro/fora do parêntese), do mais comprido pro mais curto
  const nomes = opcoes.flatMap(c => {
    const n = norm(c);
    const partes = [n, n.replace(/\s*\(.*\)\s*/, ''), (n.match(/\((.*)\)/) || [])[1]].filter(Boolean);
    return partes.map(p => [p, c]);
  }).sort((a, b) => b[0].length - a[0].length);
  for (const [p, c] of nomes) if (temPalavra(texto, p)) return c;
  // 2º: palavras do dia a dia, só se essa categoria existir na aba
  for (const c of opcoes) for (const s of SINONIMOS[c] || []) if (temPalavra(texto, s)) return c;
  return null;
}

// ---------- tudo junto ----------
export function interpretarFala(frase, categorias) {
  let t = extensoParaDigitos(norm(frase).replace(/[?!;:]/g, ' '));

  let parcelas = 1;
  const mParc = t.match(/(?:parcelado\s+)?(?:em\s+)?(\d{1,2})\s*(?:x|vezes|vez)(?![a-z])/);
  if (mParc) { parcelas = Math.max(1, Number(mParc[1])); t = t.replace(mParc[0], ' '); }

  let pagamento = null;
  if (temPalavra(t, 'pix')) pagamento = 'pix';
  else if (/(^|[^a-z])(cartao|credito|debito)([^a-z]|$)/.test(t)) pagamento = 'cartao';
  else if (/(^|[^a-z])(dinheiro|especie)([^a-z]|$)/.test(t)) pagamento = 'dinheiro';
  if (temPalavra(t, 'debito')) parcelas = 1;

  let txtValor = null;
  const NUMERO = '(\\d[\\d.]*(?:,\\d{1,2})?)';
  let m;
  if ((m = t.match(new RegExp(`r\\$\\s*${NUMERO}`)))) txtValor = m[1];
  else if ((m = t.match(new RegExp(`${NUMERO}\\s*(?:reais|real)(?:\\s*e\\s*(\\d{1,2})(\\s*centavos?)?)?`)))) {
    txtValor = m[2] ? `${m[1]},${m[3] ? m[2].padStart(2, '0') : m[2].padEnd(2, '0')}` : m[1];
  } else if ((m = t.match(/(\d[\d.]*)\s+e\s+(\d{1,2})(?!\d)/))) txtValor = `${m[1]},${m[2].padEnd(2, '0')}`;
  else if ((m = t.match(new RegExp(NUMERO)))) txtValor = m[1];

  return {
    valor: txtValor ? parseBRL(txtValor) : null,
    categoria: achaCategoria(t, categorias),
    pagamento,
    parcelas,
  };
}
