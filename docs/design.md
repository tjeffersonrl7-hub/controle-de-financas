# App de Finanças: desenho da versão 1

Aprovado por Thomas em 24/11/2026. Proposta visual: `Proposta-App-Financas.html` (mesma pasta).

## Intenção
Thomas esquece o que gastou até chegar em casa. Ele quer lançar o gasto na hora, pelo celular, e ver pra onde vai a renda do mês. O casamento (7/11/2026) apertou o caixa, por isso o controle importa agora.

## Objetivos
- Lançar um gasto em poucos toques (valor, categoria, salvar). Data padrão: hoje.
- Duas abas separadas: **Casa** (gastos dele, da esposa e contas da casa) e **PJ** (gastos das lojas ro7 tricot + RTM Imports, sem separar por loja).
- Casa: renda do mês (digitada uma vez por mês) − gastos = **Sobrou**, mais uma barra por categoria.
- PJ: total gasto no mês, mais uma barra por categoria. Sem renda.
- Navegar entre meses (‹ ›). Tocar num lançamento pra corrigir ou apagar.
- Categorias editáveis (criar, renomear, apagar).
  - Casa: Mercado, Contas da casa, Aluguel, Transporte, Saúde, Lazer, Comida fora, Outros.
  - PJ: Mercadoria, Anúncios (Ads), Embalagem, Frete, Terceirizados (Bruno), Taxas, Outros.

## Fora da versão 1
Limite por categoria, aviso de vencimento, gráfico de vários meses, separar por cartão, outra pessoa lançando, cópia de segurança.

## O que não pode acontecer
- Casa e PJ nunca se somam nem aparecem num total único.
- Lançar não pode ser lento ou cheio de campos (senão ele não usa na rua).
- Nenhum número dele sai do celular.
- Allontricot fica fora.

## Restrições
- Um usuário só (Thomas), um celular.
- Sem cópia de segurança: ele aceitou que trocar de celular ou limpar o navegador apaga os dados.
- Custo zero. Nada instalado no computador sem avisar.
- O código mora em `Documents\GitHub\<repo>`, nunca no Google Drive.

## Caminhos considerados
| Caminho | Prós | Contras |
|---|---|---|
| **App pelo navegador (PWA, escolhido)** | Grátis, rápido de fazer, vira ícone na tela, funciona sem internet | Dados presos ao navegador do celular |
| App de loja (Play Store) | App "de verdade" | Taxa de US$ 25 e semanas de trabalho |
| Planilha Google + formulário | Grátis | Lançar é lento e precisa de internet |

Escolhido: PWA, porque é um usuário só, sem necessidade de cópia, sem custo.

## Decisões técnicas (chamadas do Claude)
- HTML, CSS e JavaScript puros, sem framework e sem etapa de build.
- Dados no `localStorage` do navegador.
- Manifest + service worker (pra virar ícone e abrir sem internet).
- Publicado no GitHub Pages (repo público: o código fica visível, os dados não).
- Valores em reais, formato brasileiro (R$ 1.234,56).

## Fica pro construtor
Layout exato, cores, ícone, estrutura dos arquivos.
