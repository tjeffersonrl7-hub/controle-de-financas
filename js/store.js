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

export function load(storage) {
  try {
    const s = JSON.parse(storage.getItem(KEY));
    if (s && s.version === 1 && Array.isArray(s.entries) && s.categorias && s.renda) return s;
  } catch { /* dado corrompido: começa do zero */ }
  return defaultState();
}

export function save(storage, state) {
  storage.setItem(KEY, JSON.stringify(state));
}

export function addEntry(state, { aba, valor, categoria, obs = '', data }) {
  const entry = { id: crypto.randomUUID(), aba, valor, categoria, obs, data };
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
