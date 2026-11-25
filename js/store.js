// Estado do app e salvamento no celular (localStorage). Toda função devolve um state novo.

const KEY = 'financas-v1';
const OUTROS = 'Outros';

export function defaultState() {
  return {
    version: 1,
    entries: [],
    categorias: {
      casa: ['Mercado', 'Contas da casa', 'Aluguel', 'Transporte', 'Saúde', 'Lazer', 'Comida fora', OUTROS],
      pj: ['Mercadoria', 'Anúncios (Ads)', 'Embalagem', 'Frete', 'Terceirizados (Bruno)', 'Taxas', OUTROS],
    },
    renda: {},
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
  return { version: 1, entries, categorias: { casa: s.categorias.casa, pj: s.categorias.pj }, renda };
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
