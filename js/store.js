// Estado do app e salvamento no celular (localStorage). Toda função devolve um state novo.

const KEY = 'financas-v1';
const OUTROS = 'Outros';

export function defaultState() {
  return {
    version: 1,
    entries: [],
    categorias: {
      casa: ['Mercado', 'Contas da casa', 'Aluguel', 'Transporte', 'Saúde', 'Lazer', 'Comida fora', OUTROS],
      pj: ['Mercadoria', 'Anúncios (Ads)', 'Embalagem', 'Frete', 'Terceirizados', 'Taxas', OUTROS],
    },
    renda: {},
    mostrarPJ: false, // quem começa do zero não vê a aba PJ (liga no app se tiver empresa)
  };
}

const isStrList = v => Array.isArray(v) && v.every(c => typeof c === 'string');
const isEntry = x => x && typeof x.id === 'string' && (x.aba === 'casa' || x.aba === 'pj')
  && Number.isSafeInteger(x.valor) && x.valor > 0 && typeof x.categoria === 'string'
  && typeof x.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.data);

// Guarda uma cópia do dado original antes de descartar qualquer coisa (é a única cópia que existe).
function backup(storage, raw) {
  try { storage.setItem(`${KEY}-corrupt-${Date.now()}`, raw); } catch { /* sem espaço: segue */ }
}

export function load(storage) {
  const raw = storage.getItem(KEY);
  if (!raw) return defaultState();
  let s;
  try { s = JSON.parse(raw); } catch { s = null; }
  if (!s || s.version !== 1 || !Array.isArray(s.entries) || !s.categorias
      || !isStrList(s.categorias.casa) || !isStrList(s.categorias.pj)
      || !s.renda || typeof s.renda !== 'object' || Array.isArray(s.renda)) {
    if (raw !== 'null') backup(storage, raw);
    return defaultState();
  }
  const entries = s.entries.filter(isEntry).map(x => ({ ...x, obs: typeof x.obs === 'string' ? x.obs : '' }));
  const renda = Object.fromEntries(Object.entries(s.renda).filter(([k, v]) => /^\d{4}-\d{2}$/.test(k) && Number.isSafeInteger(v) && v >= 0));
  if (entries.length !== s.entries.length || Object.keys(renda).length !== Object.keys(s.renda).length) backup(storage, raw);
  // quem já usava antes dessa opção existir tinha a aba PJ: continua vendo
  const mostrarPJ = typeof s.mostrarPJ === 'boolean' ? s.mostrarPJ : true;
  return { version: 1, entries, categorias: { casa: s.categorias.casa, pj: s.categorias.pj }, renda, mostrarPJ };
}

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function save(storage, state) {
  storage.setItem(KEY, JSON.stringify(state));
}

export function addEntry(state, { aba, valor, categoria, obs = '', data }) {
  const entry = { id: newId(), aba, valor, categoria, obs, data };
  return { ...state, entries: [...state.entries, entry] };
}

export function updateEntry(state, id, campos) {
  return { ...state, entries: state.entries.map(x => (x.id === id ? { ...x, ...campos, id } : x)) };
}

export function deleteEntry(state, id) {
  return { ...state, entries: state.entries.filter(x => x.id !== id) };
}

// ---------- compras com forma de pagamento (cartão pode ser parcelado) ----------
export const PAGAMENTOS = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' };
export const MAX_PARCELAS = 24;

const grupoDe = x => x.grupo || x.id; // lançamento antigo: o próprio id é o grupo

// Mesma data, i meses depois. Dia 31 em mês curto cai no último dia do mês.
function somaMeses(data, i) {
  const [y, m, d] = data.split('-').map(Number);
  const alvo = new Date(y, m - 1 + i, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  const p = n => String(n).padStart(2, '0');
  return `${alvo.getFullYear()}-${p(alvo.getMonth() + 1)}-${p(Math.min(d, ultimo))}`;
}

function parcelasDe({ aba, valor, categoria, obs = '', data, pagamento, parcelas }, grupo) {
  const n = pagamento === 'cartao' ? Math.min(Math.max(1, Math.floor(parcelas) || 1), MAX_PARCELAS) : 1;
  const base = Math.floor(valor / n);
  const resto = valor - base * n; // centavos que sobram vão na 1ª parcela
  return Array.from({ length: n }, (_, i) => ({
    id: i === 0 ? grupo : newId(), grupo, aba, valor: base + (i === 0 ? resto : 0), categoria, obs,
    data: somaMeses(data, i), pagamento, parcela: i + 1, parcelas: n,
  }));
}

export function addCompra(state, campos) {
  return { ...state, entries: [...state.entries, ...parcelasDe(campos, newId())] };
}

export function compraDe(state, grupo) {
  const itens = state.entries.filter(x => grupoDe(x) === grupo);
  if (!itens.length) return null;
  const p1 = itens.find(x => (x.parcela || 1) === 1) || itens[0];
  return {
    aba: p1.aba, valor: itens.reduce((s, x) => s + x.valor, 0), categoria: p1.categoria, obs: p1.obs || '',
    data: p1.data, pagamento: p1.pagamento || '', parcelas: p1.parcelas || 1,
  };
}

export function updateCompra(state, grupo, campos) {
  const pos = state.entries.findIndex(x => grupoDe(x) === grupo);
  if (pos < 0) return state;
  const resto = state.entries.filter(x => grupoDe(x) !== grupo);
  const novos = parcelasDe(campos, grupo);
  return { ...state, entries: [...resto.slice(0, pos), ...novos, ...resto.slice(pos)] };
}

export function deleteCompra(state, grupo) {
  return { ...state, entries: state.entries.filter(x => grupoDe(x) !== grupo) };
}

export function setRenda(state, ym, cents) {
  return { ...state, renda: { ...state.renda, [ym]: cents } };
}

const withCats = (state, aba, list) => ({ ...state, categorias: { ...state.categorias, [aba]: list } });

export function addCategory(state, aba, nome) {
  const n = String(nome).trim();
  const list = state.categorias[aba];
  if (!n || list.includes(n)) return state;
  const i = list.indexOf(OUTROS); // nova categoria entra antes de "Outros"
  return withCats(state, aba, i < 0 ? [...list, n] : [...list.slice(0, i), n, ...list.slice(i)]);
}

export function renameCategory(state, aba, antigo, novo) {
  const n = String(novo).trim();
  const list = state.categorias[aba];
  if (antigo === OUTROS || !n || !list.includes(antigo) || list.includes(n)) return state;
  const s = withCats(state, aba, list.map(c => (c === antigo ? n : c)));
  return { ...s, entries: s.entries.map(x => (x.aba === aba && x.categoria === antigo ? { ...x, categoria: n } : x)) };
}

export function deleteCategory(state, aba, nome) {
  const list = state.categorias[aba];
  if (nome === OUTROS || !list.includes(nome)) return state;
  const s = withCats(state, aba, list.filter(c => c !== nome));
  return { ...s, entries: s.entries.map(x => (x.aba === aba && x.categoria === nome ? { ...x, categoria: OUTROS } : x)) };
}

export function setMostrarPJ(state, ligado) {
  return { ...state, mostrarPJ: !!ligado };
}
