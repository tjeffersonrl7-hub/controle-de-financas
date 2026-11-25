# Controle de Finanças

App pessoal pelo navegador do celular pra lançar gastos na hora. Duas abas: Casa e PJ.
Os dados ficam só no celular (localStorage).

- Testes: `node --test tests/`
- Rodar no computador: `node dev-server.js` e abrir http://localhost:5173
- Desenho: `docs/design.md` · Plano: `docs/plano.md`

## Publicar uma atualização
O app busca a versão nova sozinho quando o celular tem internet. Não precisa trocar nada.
**Nunca** use "limpar dados do site" no celular: isso apaga todos os lançamentos.
