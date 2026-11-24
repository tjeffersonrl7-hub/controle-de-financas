// Telas do app: desenha Casa/PJ e cuida dos toques. A lógica fica em money/finance/store.
import { parseBRL, formatBRL } from './money.js';
import { todayISO, monthOf, shiftMonth, monthLabel, entriesFor, total, byCategory, sobrou } from './finance.js';
import { load, save, addEntry, updateEntry, deleteEntry, setRenda, addCategory, renameCategory, deleteCategory } from './store.js';

let state = load(localStorage);
const ui = { aba: 'casa', ym: monthOf(todayISO()) };

const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const centsToInput = c => (c / 100).toFixed(2).replace('.', ',');
const dataCurta = d => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function commit(next) {
  state = next;
  save(localStorage, state);
  render();
}

function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.aba === ui.aba));
  $('#mes-label').textContent = monthLabel(ui.ym);

  const entries = entriesFor(state, ui.aba, ui.ym);
  const gasto = total(entries);

  if (ui.aba === 'casa') {
    const renda = state.renda[ui.ym] || 0;
    const sob = sobrou(state, ui.ym);
    $('#resumo').innerHTML = `
      <div class="linha"><span>Renda do mês</span><button class="renda-btn" data-act="renda">${formatBRL(renda)} ✎</button></div>
      <div class="linha"><span>Gastou</span><b>${formatBRL(gasto)}</b></div>
      <div class="linha"><span>Sobrou</span><span class="grande ${sob < 0 ? 'neg' : ''}">${formatBRL(sob)}</span></div>`;
  } else {
    $('#resumo').innerHTML = `<div class="linha"><span>Gastos PJ no mês</span><span class="grande">${formatBRL(gasto)}</span></div>`;
  }

  const cats = byCategory(entries);
  const max = cats[0]?.total || 1;
  $('#categorias').innerHTML = cats.length
    ? cats.map(c => `<div class="cat"><div class="top"><span>${esc(c.categoria)}</span><span>${formatBRL(c.total)}</span></div>
        <div class="bar" style="width:${(c.total / max) * 100}%"></div></div>`).join('')
    : '<div class="vazio">Nenhum gasto neste mês.</div>';

  $('#lista').innerHTML = entries.length
    ? entries.map(x => `<li data-id="${esc(x.id)}"><span class="info">${esc(x.categoria)}<small>${dataCurta(x.data)}${x.obs ? ' · ' + esc(x.obs) : ''}</small></span><b>${formatBRL(x.valor)}</b></li>`).join('')
    : '<li class="vazio">Toque em “+ Lançar gasto” pra começar.</li>';
}

// ---------- telas por cima (sheet) ----------
function openSheet(html) {
  $('#sheet-box').onclick = null;
  $('#sheet-box').innerHTML = html;
  $('#sheet').hidden = false;
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheet-box').innerHTML = '';
}

function abrirLancamento(entry) {
  const aba = entry?.aba || ui.aba;
  const cats = state.categorias[aba];
  let catSel = entry?.categoria || null;
  openSheet(`
    <h3>${entry ? 'Editar gasto' : 'Lançar gasto'} · ${aba === 'casa' ? 'Casa' : 'PJ'}</h3>
    <label for="f-valor">Valor (R$)</label>
    <input id="f-valor" class="valor" inputmode="decimal" placeholder="0,00" autocomplete="off" value="${entry ? centsToInput(entry.valor) : ''}">
    <label>Categoria</label>
    <div class="chips" id="f-cats">${cats.map(c => `<button type="button" data-cat="${esc(c)}" class="${c === catSel ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
    <label for="f-obs">Observação (opcional)</label>
    <input id="f-obs" placeholder="ex: Atacadão" value="${esc(entry?.obs || '')}">
    <label for="f-data">Data</label>
    <input id="f-data" type="date" value="${entry?.data || todayISO()}">
    <div class="erro" id="f-erro"></div>
    <div class="acoes">
      ${entry ? '<button class="apagar" id="f-apagar">Apagar</button>' : '<button class="cancelar" id="f-cancelar">Cancelar</button>'}
      <button class="salvar" id="f-salvar">Salvar</button>
    </div>`);
  if (!entry) $('#f-valor').focus();

  $('#f-cats').onclick = ev => {
    const b = ev.target.closest('[data-cat]');
    if (!b) return;
    catSel = b.dataset.cat;
    document.querySelectorAll('#f-cats button').forEach(x => x.classList.toggle('on', x === b));
  };
  $('#f-salvar').onclick = () => {
    const valor = parseBRL($('#f-valor').value);
    const data = $('#f-data').value;
    if (valor === null) return void ($('#f-erro').textContent = 'Digite um valor válido.');
    if (!catSel) return void ($('#f-erro').textContent = 'Escolha uma categoria.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return void ($('#f-erro').textContent = 'Escolha a data.');
    const campos = { aba, valor, categoria: catSel, obs: $('#f-obs').value.trim(), data };
    closeSheet();
    ui.ym = monthOf(data); // mostra o mês do lançamento
    commit(entry ? updateEntry(state, entry.id, campos) : addEntry(state, campos));
  };
  if (entry) {
    $('#f-apagar').onclick = () => {
      if (!confirm(`Apagar ${formatBRL(entry.valor)} em ${entry.categoria}?`)) return;
      closeSheet();
      commit(deleteEntry(state, entry.id));
    };
  } else {
    $('#f-cancelar').onclick = closeSheet;
  }
}

function abrirRenda() {
  const atual = state.renda[ui.ym];
  openSheet(`
    <h3>Renda de ${monthLabel(ui.ym)}</h3>
    <label for="r-valor">Quanto entrou no mês (R$)</label>
    <input id="r-valor" class="valor" inputmode="decimal" placeholder="0,00" value="${atual ? centsToInput(atual) : ''}">
    <div class="erro" id="r-erro"></div>
    <div class="acoes"><button class="cancelar" id="r-cancelar">Cancelar</button><button class="salvar" id="r-salvar">Salvar</button></div>`);
  $('#r-valor').focus();
  $('#r-cancelar').onclick = closeSheet;
  $('#r-salvar').onclick = () => {
    const txt = $('#r-valor').value.trim();
    const v = txt === '' || txt === '0' ? 0 : parseBRL(txt);
    if (v === null) return void ($('#r-erro').textContent = 'Digite um valor válido.');
    closeSheet();
    commit(setRenda(state, ui.ym, v));
  };
}

function abrirCategorias() {
  const aba = ui.aba;
  const lista = state.categorias[aba].map(c => `
    <div class="cat-edit"><span>${esc(c)}</span>
      ${c === 'Outros' ? '' : `<button data-ren="${esc(c)}">Renomear</button><button data-del="${esc(c)}">Apagar</button>`}
    </div>`).join('');
  openSheet(`
    <h3>Categorias · ${aba === 'casa' ? 'Casa' : 'PJ'}</h3>
    ${lista}
    <div class="acoes"><button class="cancelar" id="c-fechar">Fechar</button><button class="salvar" id="c-nova">+ Nova</button></div>`);
  $('#c-fechar').onclick = closeSheet;
  $('#c-nova').onclick = () => {
    const nome = prompt('Nome da nova categoria:');
    if (nome) { commit(addCategory(state, aba, nome)); abrirCategorias(); }
  };
  $('#sheet-box').onclick = ev => {
    const ren = ev.target.closest('[data-ren]')?.dataset.ren;
    const del = ev.target.closest('[data-del]')?.dataset.del;
    if (ren) {
      const novo = prompt(`Novo nome para "${ren}":`, ren);
      if (novo) { commit(renameCategory(state, aba, ren, novo)); abrirCategorias(); }
    } else if (del) {
      if (confirm(`Apagar a categoria "${del}"? Os lançamentos dela vão para "Outros".`)) {
        commit(deleteCategory(state, aba, del)); abrirCategorias();
      }
    }
  };
}

// ---------- toques na tela principal ----------
document.querySelector('.tabs').onclick = ev => {
  const b = ev.target.closest('[data-aba]');
  if (b) { ui.aba = b.dataset.aba; render(); }
};
document.body.addEventListener('click', ev => {
  const act = ev.target.closest('[data-act]')?.dataset.act;
  if (act === 'mes-ant') { ui.ym = shiftMonth(ui.ym, -1); render(); }
  else if (act === 'mes-prox') { ui.ym = shiftMonth(ui.ym, 1); render(); }
  else if (act === 'lancar') abrirLancamento(null);
  else if (act === 'renda') abrirRenda();
  else if (act === 'editar-cats') abrirCategorias();
});
$('#lista').onclick = ev => {
  const id = ev.target.closest('li[data-id]')?.dataset.id;
  const entry = id && state.entries.find(x => x.id === id);
  if (entry) abrirLancamento(entry);
};
$('#sheet').onclick = ev => { if (ev.target.id === 'sheet') closeSheet(); };

render();
