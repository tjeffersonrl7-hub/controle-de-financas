// Contas do mês: separar por aba e mês, somar, agrupar por categoria e calcular o que sobrou.

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad = n => String(n).padStart(2, '0');

export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const monthOf = data => data.slice(0, 7);

export function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export function entriesFor(state, aba, ym) {
  return state.entries
    .map((x, i) => [x, i]) // i = ordem em que foi lançado
    .filter(([x]) => x.aba === aba && monthOf(x.data) === ym)
    .sort(([a, ia], [b, ib]) => b.data.localeCompare(a.data) || ib - ia)
    .map(([x]) => x);
}

export const total = entries => entries.reduce((sum, x) => sum + x.valor, 0);

export function byCategory(entries) {
  const map = new Map();
  for (const x of entries) map.set(x.categoria, (map.get(x.categoria) || 0) + x.valor);
  return [...map].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

export function sobrou(state, ym) {
  return (state.renda[ym] || 0) - total(entriesFor(state, 'casa', ym));
}
