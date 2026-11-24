# App de Finanças

App pessoal pelo navegador do celular pra lançar gastos na hora. Duas abas: Casa e PJ.
Os dados ficam só no celular (localStorage).

- Testes: `node --test tests/`
- Rodar no computador: `node dev-server.js` e abrir http://localhost:5173
- Desenho: `docs/design.md` · Plano: `docs/plano.md`

## Publicar uma atualização
O app guarda os arquivos no celular. Ao mudar qualquer arquivo, troque o nome do cache em `sw.js`
(`financas-v1` → `financas-v2`) pra o celular baixar a versão nova.
