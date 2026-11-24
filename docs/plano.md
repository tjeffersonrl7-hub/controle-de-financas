# App de Finanças (v1): plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA de uso pessoal para lançar gastos na hora pelo celular, com abas Casa e PJ separadas.

**Architecture:** HTML/CSS/JS puros, módulos ES, sem build. Lógica pura (`money.js`, `finance.js`, `store.js`) testada com `node --test`. A UI (`app.js`) só desenha e chama a lógica. Estado em `localStorage`. Service worker para abrir sem internet. Publicado no GitHub Pages.

**Tech Stack:** JavaScript (ES modules), Node 26 só para testes (`node --test`, nada instalado), GitHub Pages.

**Spec:** `G:\Meu Drive\Meu Claude Empresa\Pessoal\Finanças da casa\2026-11-24-app-financas-design.md`

## Global Constraints
- Repo: `C:\Users\tjeff\Documents\GitHub\app-financas`. Nunca no Google Drive.
- Zero dependências (sem npm install). Servidor de teste: `node dev-server.js` (script próprio).
- Todo texto da interface em português do Brasil.
- Dinheiro sempre em **centavos inteiros**. Exibição: `R$ 1.234,56` (espaço normal, não nbsp).
- Abas: `'casa'` e `'pj'`. Nunca existe total que some as duas.
- Categorias iniciais Casa: Mercado, Contas da casa, Aluguel, Transporte, Saúde, Lazer, Comida fora, Outros.
- Categorias iniciais PJ: Mercadoria, Anúncios (Ads), Embalagem, Frete, Terceirizados (Bruno), Taxas, Outros.
- Renda só existe na aba Casa, uma por mês.
- Chave do localStorage: `financas-v1`.
- Commit ao fim de cada task, com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus
1. **Data "hoje" à noite:** `toISOString()` usa UTC; às 22h no Brasil viraria o dia seguinte. `todayISO()` usa data local. (Task 2)
2. **Valor digitado com vírgula ou ponto:** "87,50", "1.234,56", "87" e "87.5" precisam funcionar. Vazio, zero, negativo ou texto devolvem `null` e o app não salva. (Task 1)
3. **localStorage corrompido ou vazio:** abre com o estado padrão, sem travar. (Task 3)
4. **Apagar categoria que tem lançamentos:** os lançamentos vão para "Outros". "Outros" não pode ser apagada nem renomeada. (Task 3)
5. **Mês sem renda:** renda = 0 e "Sobrou" fica negativo, mostrado em vermelho, sem erro. (Tasks 2 e 4)

---

### Task 1: Repo e dinheiro (`money.js`)

**Files:**
- Create: `.gitignore`, `README.md`, `docs/design.md` e `docs/plano.md` (cópias da spec e deste plano), `js/money.js`, `tests/money.test.js`

**Interfaces:**
- Produces: `parseBRL(text: string) -> number|null` (centavos), `formatBRL(cents: number) -> string`

- [ ] **Step 1:** `git init` na pasta do repo e criar `.gitignore` (`.env`, `node_modules/`).
- [ ] **Step 2: Teste que falha** em `tests/money.test.js`:
  - `parseBRL("87,50") === 8750`, `parseBRL("1.234,56") === 123456`, `parseBRL("87") === 8700`, `parseBRL("87.5") === 8750`, `parseBRL(" R$ 10,00 ") === 1000`
  - `parseBRL("")`, `parseBRL("0")`, `parseBRL("-5")`, `parseBRL("abc")` → `null`
  - `formatBRL(123456) === "R$ 1.234,56"`, `formatBRL(5) === "R$ 0,05"`, `formatBRL(-1000) === "-R$ 10,00"`
- [ ] **Step 3:** Rodar `node --test tests/` → FAIL (módulo não existe).
- [ ] **Step 4:** Implementar. Regra: tira "R$" e espaços; se tem vírgula, pontos são milhar e vírgula é decimal; se não tem vírgula e termina em `.` + 1-2 dígitos, o ponto é decimal; senão pontos são milhar. `formatBRL` usa `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})` e troca `\u00a0` por espaço; sinal de negativo antes do "R$".
- [ ] **Step 5:** `node --test tests/` → PASS.
- [ ] **Step 6:** Commit `feat: estrutura do repo e conversão de valores em reais`.

### Task 2: Contas do mês (`finance.js`)

**Files:** Create `js/finance.js`, `tests/finance.test.js`

**Interfaces:**
- Entry: `{ id: string, aba: 'casa'|'pj', valor: number (centavos), categoria: string, obs: string, data: 'YYYY-MM-DD' }`
- Produces:
  - `todayISO(now: Date = new Date()) -> 'YYYY-MM-DD'` (data local)
  - `monthOf(data: string) -> 'YYYY-MM'`
  - `shiftMonth(ym: string, delta: number) -> 'YYYY-MM'`
  - `monthLabel(ym: string) -> string` (ex.: `"Novembro 2026"`)
  - `entriesFor(state, aba, ym) -> Entry[]` (mais recentes primeiro)
  - `total(entries) -> number`
  - `byCategory(entries) -> {categoria: string, total: number}[]` (maior primeiro)
  - `sobrou(state, ym) -> number` (renda do mês − total da Casa no mês; renda ausente = 0)

- [ ] **Step 1: Teste que falha:**
  - `todayISO(new Date(2026, 10, 24, 23, 30)) === "2026-11-24"`
  - `shiftMonth("2026-01", -1) === "2025-12"`, `shiftMonth("2026-12", 1) === "2027-01"`
  - `monthLabel("2026-11") === "Novembro 2026"`
  - Com um state de exemplo (casa nov: 8750 + 14000; casa out: 5000; pj nov: 2200; renda nov 500000): `entriesFor(s,'casa','2026-11')` tem 2 itens; `total` deles = 22750; `entriesFor(s,'pj','2026-11')` total = 2200 (PJ nunca entra na Casa); `sobrou(s,'2026-11') === 477250`; `sobrou(s,'2026-10') === -5000` (sem renda).
  - `byCategory` devolve maior primeiro e soma lançamentos da mesma categoria.
- [ ] **Step 2:** `node --test tests/` → FAIL.
- [ ] **Step 3:** Implementar as funções acima em `js/finance.js`.
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `feat: cálculos do mês (total, por categoria, sobrou)`.

### Task 3: Estado e salvamento (`store.js`)

**Files:** Create `js/store.js`, `tests/store.test.js`

**Interfaces:**
- State: `{ version: 1, entries: Entry[], categorias: { casa: string[], pj: string[] }, renda: { [ym: string]: number } }`
- Produces (todas devolvem um **novo** state, sem alterar o anterior):
  - `defaultState() -> State`
  - `load(storage) -> State` / `save(storage, state) -> void` (`storage` tem `getItem`/`setItem`, chave `financas-v1`)
  - `addEntry(state, {aba, valor, categoria, obs, data}) -> State` (gera `id` com `crypto.randomUUID()`)
  - `updateEntry(state, id, campos) -> State` / `deleteEntry(state, id) -> State`
  - `setRenda(state, ym, cents) -> State`
  - `addCategory(state, aba, nome)` / `renameCategory(state, aba, antigo, novo)` / `deleteCategory(state, aba, nome)` → State

- [ ] **Step 1: Teste que falha** (usar um storage falso em memória):
  - `defaultState()` tem as categorias iniciais exatas da spec.
  - `load` com storage vazio, com `"{lixo"` e com JSON sem `version` → `defaultState()`.
  - `save` e depois `load` devolvem o mesmo state.
  - `addEntry` não altera o state original e o novo tem 1 entry com `id`.
  - `deleteCategory(s,'casa','Mercado')`: lançamentos de Mercado viram "Outros".
  - `deleteCategory` e `renameCategory` de "Outros" devolvem o state igual.
  - `renameCategory` também renomeia nos lançamentos daquela aba (só daquela aba).
  - `addCategory` com nome repetido ou vazio devolve o state igual.
- [ ] **Step 2:** `node --test tests/` → FAIL.
- [ ] **Step 3:** Implementar em `js/store.js`.
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `feat: estado do app salvo no celular`.

### Task 4: Telas (Casa, PJ e Lançar)

**Files:** Create `index.html`, `styles.css`, `js/app.js`, `dev-server.js`, `.claude/launch.json`

**Interfaces:** Consumes Tasks 1-3. `app.js` guarda `{ aba, ym }` da tela e o state; toda mudança faz `save` e redesenha.

Telas (seguir os desenhos de `Proposta-App-Financas.html`):
- **Topo:** abas CASA | PJ; mês com setas ‹ ›.
- **Casa:** Renda do mês (tocar para editar), Gastou, **Sobrou** (vermelho se negativo); botão grande "+ LANÇAR GASTO"; barras por categoria (largura proporcional à maior); lista dos lançamentos do mês.
- **PJ:** "Gastos PJ no mês" + o mesmo botão, barras e lista. Sem renda.
- **Lançar/editar (tela por cima):** campo valor com `inputmode="decimal"` e foco automático; categorias como botões; observação opcional; data (padrão `todayISO()`); SALVAR. Valor inválido (`parseBRL` = null) mostra "Digite um valor válido" e não salva. Ao editar aparece também APAGAR (com confirmação).
- **Categorias:** link "Editar categorias" na aba aberta: criar, renomear, apagar (aviso: "os lançamentos vão para Outros").
- Toques mínimos: lançar = tocar no botão, digitar valor, tocar na categoria, SALVAR.

- [ ] **Step 1:** `dev-server.js`: servidor estático com `node:http` na porta 5173 (tipos: html, css, js, json, webmanifest, svg, png). `launch.json` com `runtimeExecutable: "node"`, `runtimeArgs: ["dev-server.js"]`, `port: 5173`.
- [ ] **Step 2:** Construir `index.html`, `styles.css` (pensado para celular, largura 360-430px) e `js/app.js`.
- [ ] **Step 3: Verificar no painel do navegador** (viewport mobile), com prints: lançar R$ 87,50 em Mercado na Casa → aparece na lista, Gastou = R$ 87,50; trocar para PJ → total R$ 0,00; renda R$ 5.000,00 → Sobrou R$ 4.912,50; recarregar a página → dados continuam; editar e apagar um lançamento; mês anterior vazio; valor "abc" não salva; apagar categoria com lançamento → vai para Outros.
- [ ] **Step 4:** `node --test tests/` → PASS (nada quebrou).
- [ ] **Step 5:** Commit `feat: telas Casa, PJ e lançamento`.

### Task 5: Virar app no celular e publicar

**Files:** Create `manifest.webmanifest`, `sw.js`, `icons/icon.svg`, `icons/icon-192.png`, `icons/icon-512.png`. Modify `index.html` (link do manifest, registro do service worker, `theme-color`).

- [ ] **Step 1:** `manifest.webmanifest`: `name: "Finanças"`, `short_name: "Finanças"`, `start_url: "./"`, `display: "standalone"`, `lang: "pt-BR"`, cor `#1a7f5a`, ícones 192 e 512. Caminhos relativos (o site fica em `/app-financas/`).
- [ ] **Step 2:** Ícones: desenhar o SVG; gerar os PNG desenhando o SVG num canvas no painel do navegador e salvando (sem instalar nada).
- [ ] **Step 3:** `sw.js`: guarda todos os arquivos do app ao instalar e responde do cache primeiro (cache com nome versionado `financas-v1`, apaga caches antigos ao ativar).
- [ ] **Step 4: Verificar no painel:** manifest carregado sem erro no console, service worker ativo, e com o servidor parado a página recarrega.
- [ ] **Step 5:** Commit `feat: app instalável e funcionando sem internet`.
- [ ] **Step 6:** **Pedir ok ao Thomas** antes de criar o repositório público no GitHub (conta `tjeffersonrl7-hub`) e ligar o GitHub Pages. Com o ok: `gh repo create app-financas --public --source . --push`, ativar Pages na branch `main`, raiz.
- [ ] **Step 7:** Conferir que `https://tjeffersonrl7-hub.github.io/app-financas/` abre. Passar o link ao Thomas com o passo a passo: abrir no Chrome do celular → menu ⋮ → "Adicionar à tela inicial". Pedir print do ícone na tela dele como prova.
