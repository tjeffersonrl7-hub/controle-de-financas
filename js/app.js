// Telas do app: desenha Casa/PJ e cuida dos toques. A lógica fica em money/finance/store.
import { parseBRL, formatBRL } from './money.js';
import { todayISO, monthOf, shiftMonth, monthLabel, entriesFor, total, byCategory, sobrou } from './finance.js';
import { load, save, setRenda, addCategory, renameCategory, deleteCategory, addCompra, updateCompra, deleteCompra, compraDe, PAGAMENTOS, MAX_PARCELAS } from './store.js';

// Uma cor fixa por categoria (pela posição dela na lista da aba).
const CORES = ['#3ddc97', '#f2b84b', '#6c9cff', '#ff7a9a', '#b48cff', '#4fd1e0', '#ff9f5a', '#a3d977', '#e07ad1', '#9aa5b1'];
const corDe = (aba, cat) => {
  const i = state.categorias[aba].indexOf(cat);
  return i < 0 ? '#9aa5b1' : CORES[i % CORES.length];
};
// "R$ 2.140<small>,30</small>": centavos menores, como no desenho aprovado.
const valorGrande = cents => {
  const t = formatBRL(cents);
  const i = t.lastIndexOf(',');
  return `${t.slice(0, i)}<small>${t.slice(i)}</small>`;
};
const mesCurto = ym => { const [nome, ano] = monthLabel(ym).split(' '); return `${nome.slice(0, 3)} ${ano}`; };

let state = load(localStorage);
const ui = { aba: 'casa', ym: monthOf(todayISO()) };
navigator.storage?.persist?.(); // pede ao celular pra não apagar os dados sozinho

const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const centsToInput = c => (c / 100).toFixed(2).replace('.', ',');
const dataCurta = d => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

// Salva primeiro; só muda a tela se salvou. Devolve false se falhou (a tela por cima continua aberta).
function commit(next) {
  try {
    save(localStorage, next);
  } catch {
    alert('Não foi possível salvar. Tente de novo.');
    return false;
  }
  state = next;
  render();
  return true;
}

function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.aba === ui.aba));
  $('#mes-label').textContent = mesCurto(ui.ym);

  const entries = entriesFor(state, ui.aba, ui.ym);
  const gasto = total(entries);

  if (ui.aba === 'casa') {
    const renda = state.renda[ui.ym] || 0;
    const sob = sobrou(state, ui.ym);
    $('#resumo').innerHTML = `
      <div class="lbl">Sobrou este mês</div>
      <div class="big ${sob < 0 ? 'neg' : ''}">${valorGrande(sob)}</div>
      <div class="mini">
        <button data-act="renda">Renda<b>${formatBRL(renda)}</b></button>
        <div>Gastou<b>${formatBRL(gasto)}</b></div>
      </div>`;
  } else {
    $('#resumo').innerHTML = `
      <div class="lbl">Gastos PJ este mês</div>
      <div class="big">${valorGrande(gasto)}</div>
      <div class="mini"><div>Lançamentos<b>${entries.length}</b></div></div>`;
  }

  const cats = byCategory(entries);
  const max = cats[0]?.total || 1;
  $('#categorias').innerHTML = cats.length
    ? cats.map(c => `<div class="cat"><div class="top"><span>${esc(c.categoria)}</span><b>${formatBRL(c.total)}</b></div>
        <div class="bar"><i style="width:${(c.total / max) * 100}%;background:${corDe(ui.aba, c.categoria)}"></i></div></div>`).join('')
    : '<div class="vazio">Nenhum gasto neste mês.</div>';

  $('#lista').innerHTML = entries.length
    ? entries.map(x => {
        const pag = PAGAMENTOS[x.pagamento];
        const detalhe = [dataCurta(x.data), pag && (x.parcelas > 1 ? `${pag} ${x.parcela}/${x.parcelas}` : pag), x.obs && esc(x.obs)].filter(Boolean).join(' · ');
        return `<li data-id="${esc(x.id)}"><i class="dot" style="background:${corDe(x.aba, x.categoria)}"></i>
          <span class="info">${esc(x.categoria)}<small>${detalhe}</small></span><b>${formatBRL(x.valor)}</b></li>`;
      }).join('')
    : '<li class="vazio">Toque no “+” pra lançar o primeiro gasto.</li>';
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

// entry = um lançamento da lista (pode ser uma parcela). Editar/apagar vale pra compra inteira.
function abrirLancamento(entry) {
  const grupo = entry ? (entry.grupo || entry.id) : null;
  const compra = grupo ? compraDe(state, grupo) : null;
  const aba = compra?.aba || ui.aba;
  const cats = state.categorias[aba];
  let catSel = compra?.categoria || null;
  let pagSel = compra ? compra.pagamento : 'pix';
  const titulo = compra ? (compra.parcelas > 1 ? `Editar compra · ${compra.parcelas}x` : 'Editar gasto') : 'Lançar gasto';
  openSheet(`
    <h3>${titulo} · ${aba === 'casa' ? 'Casa' : 'PJ'}</h3>
    <label for="f-valor" id="f-valor-lbl">Valor (R$)</label>
    <input id="f-valor" class="valor" inputmode="decimal" placeholder="0,00" autocomplete="off" value="${compra ? centsToInput(compra.valor) : ''}">
    <label>Como pagou</label>
    <div class="chips pag" id="f-pag">${Object.entries(PAGAMENTOS).map(([k, nome]) => `<button type="button" data-pag="${k}" class="${k === pagSel ? 'on' : ''}">${nome}</button>`).join('')}</div>
    <div id="f-parc-box" hidden>
      <label for="f-parc">Em quantas vezes</label>
      <div class="parc">
        <select id="f-parc">${Array.from({ length: MAX_PARCELAS }, (_, i) => `<option value="${i + 1}" ${i + 1 === (compra?.parcelas || 1) ? 'selected' : ''}>${i + 1}x</option>`).join('')}</select>
        <span id="f-parc-info"></span>
      </div>
    </div>
    <label>Categoria</label>
    <div class="chips" id="f-cats">${cats.map(c => `<button type="button" data-cat="${esc(c)}" class="${c === catSel ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
    <label for="f-obs">Observação (opcional)</label>
    <input id="f-obs" placeholder="ex: Atacadão" value="${esc(compra?.obs || '')}">
    <label for="f-data" id="f-data-lbl">Data</label>
    <input id="f-data" type="date" value="${compra?.data || todayISO()}">
    <div class="erro" id="f-erro"></div>
    <div class="acoes">
      ${compra ? '<button class="apagar" id="f-apagar">Apagar</button>' : '<button class="cancelar" id="f-cancelar">Cancelar</button>'}
      <button class="salvar" id="f-salvar">Salvar</button>
    </div>`);
  if (!compra) $('#f-valor').focus();

  // Cartão mostra "em quantas vezes" e o valor de cada parcela.
  const atualizaParcelas = () => {
    const cartao = pagSel === 'cartao';
    const n = cartao ? Number($('#f-parc').value) : 1;
    $('#f-parc-box').hidden = !cartao;
    $('#f-valor-lbl').textContent = n > 1 ? 'Valor total da compra (R$)' : 'Valor (R$)';
    $('#f-data-lbl').textContent = n > 1 ? 'Data da compra (1ª parcela)' : 'Data';
    const v = parseBRL($('#f-valor').value);
    $('#f-parc-info').textContent = n > 1 ? (v ? `${n}x de ${formatBRL(Math.floor(v / n))}` : 'uma parcela por mês') : 'à vista';
  };
  atualizaParcelas();
  $('#f-valor').oninput = atualizaParcelas;
  $('#f-parc').onchange = atualizaParcelas;
  $('#f-pag').onclick = ev => {
    const b = ev.target.closest('[data-pag]');
    if (!b) return;
    pagSel = b.dataset.pag;
    document.querySelectorAll('#f-pag button').forEach(x => x.classList.toggle('on', x === b));
    atualizaParcelas();
  };
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
    if (!pagSel) return void ($('#f-erro').textContent = 'Escolha como pagou.');
    if (!catSel) return void ($('#f-erro').textContent = 'Escolha uma categoria.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return void ($('#f-erro').textContent = 'Escolha a data.');
    const parcelas = pagSel === 'cartao' ? Number($('#f-parc').value) : 1;
    const campos = { aba, valor, categoria: catSel, obs: $('#f-obs').value.trim(), data, pagamento: pagSel, parcelas };
    const ymAntes = ui.ym;
    ui.ym = monthOf(data); // mostra o mês da compra
    if (!commit(compra ? updateCompra(state, grupo, campos) : addCompra(state, campos))) { ui.ym = ymAntes; return; }
    closeSheet();
  };
  if (compra) {
    $('#f-apagar').onclick = () => {
      const msg = compra.parcelas > 1
        ? `Apagar a compra de ${formatBRL(compra.valor)} e as ${compra.parcelas} parcelas?`
        : `Apagar ${formatBRL(compra.valor)} em ${compra.categoria}?`;
      if (!confirm(msg)) return;
      if (commit(deleteCompra(state, grupo))) closeSheet();
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
    if (commit(setRenda(state, ui.ym, v))) closeSheet();
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
// Toque no fundo escuro fecha, menos quando já tem valor digitado (pra não perder o gasto por engano).
$('#sheet').onclick = ev => {
  if (ev.target.id !== 'sheet') return;
  const digitado = [...document.querySelectorAll('#sheet-box input.valor')].some(i => i.value.trim() !== '' && i.defaultValue !== i.value);
  if (!digitado) closeSheet();
};

render();
