# Planejamento do CSystem — 17/09/2026

Registro do **processo de decisão** que levou ao CSystem: as perguntas feitas, as
alternativas descartadas e por quê, o Teste do Engenheiro completo, e o que ainda
falta verificar.

Este documento é histórico. Ele não é atualizado conforme o sistema evolui — para o
estado atual, ver [`../README.md`](../README.md); para o histórico geral do projeto,
ver [`../../DOCUMENTACAO.md`](../../DOCUMENTACAO.md).

**Por que existe:** as decisões estão documentadas em outros lugares, mas as
alternativas rejeitadas não estavam em lugar nenhum. Sem elas, daqui a seis meses
alguém — inclusive um agente — vai propor de novo "e se a gente sincronizasse com o
Trello?" sem saber que isso já foi analisado e descartado.

---

## 1. O pedido original

Criar um CRM chamado **CSystem** para gestão de relacionamento, tarefas e
produtividade, que atenda a operação da Capill segundo o `MANUAL_OPERACIONAL`, o
`PROTOCOLO_DE_TRABALHO`, os `CRITERIOS_DE_SUCESSO` e o atendimento do SDR.

Requisitos explícitos do Alex:

- Design totalmente inspirado numa imagem de referência anexada (dashboard claro,
  acento verde-limão, pills pretas, cards muito arredondados)
- Modo claro e escuro alternáveis por botão
- Em Minhas Tarefas, alternar entre **Lista** e **Kanban**
- Arrastar cards entre listas como no Trello
- Sistema de etiquetas coloridas e o que está definido no manual de operação
- Integração com os fluxos de atendimento e o Agente SDR, para receber todos os leads

---

## 2. Decisões tomadas — e o que foi descartado

### 2.1 Relação com o Trello

**Escolhido: substituir o Trello.** CSystem vira a fonte única de verdade.

| Alternativa descartada | Por que não |
|---|---|
| **Espelho bidirecional** (os dois sincronizados via API) | Mais poderoso, mas bem mais complexo e com risco real de conflito e card duplicado — exatamente o que a Regra 1 existe para impedir. |
| **Independente, Trello em paralelo** | Mais rápido de entregar, mas cria duas fontes de verdade. É o cenário que o próprio `PADRAO_DE_COMENTARIOS` desaconselha ao dizer que dois métodos de registro não devem ser usados ao mesmo tempo. |

**Consequência aceita:** o board precisa ser arquivado ao fim da migração. Manter os
dois recebendo card quebra a Regra 1.

### 2.2 Importação dos dados do Trello

**Escolhido: não importar nada. Começar do zero.**

O plano original previa importar os 337 cards com seus comentários. O Alex descartou
isso na revisão. O seed cria só a estrutura — 12 listas, 15 etiquetas, 4 colunas de
tarefa, **zero clientes**.

Os ~21 cards do funil ativo ficaram de fora. Trazê-los depois é digitação manual ou
uma importação pontual.

### 2.3 Onde roda

**Escolhido: local agora, nuvem depois — mesma base de código.**

| Alternativa descartada | Por que não |
|---|---|
| **Direto na nuvem** (Vercel + Postgres) | Funcionaria no celular dentro do studio e o n8n entregaria o lead direto, mas exige o Alex criar contas nos serviços. |
| **Só local, sem webhook** | Mais simples, mas o lead do SDR entraria só por colagem manual — sem automação real, que era um requisito explícito. |

**Consequência aceita:** enquanto roda local, o n8n na nuvem não alcança `localhost`.
O endpoint já existe e está pronto; o acesso se resolve com túnel temporário ou
colagem manual.

### 2.4 Runtime

Descoberto no meio do planejamento: **não havia Node, npm nem Python real na máquina.**

**Escolhido: instalar o Node.js LTS.**

| Alternativa descartada | Por que não |
|---|---|
| **Arquivo único HTML**, sem instalar nada | Abriria com duplo clique e funcionaria offline, mas perde o webhook — o lead do SDR só entraria colado à mão. Sem acesso pelo celular. |
| **Pular o local e ir direto pra nuvem** | Não instala nada no PC, mas exige criar contas — e eu não posso criar conta por ninguém. |

### 2.5 Divergências entre o board real e os documentos

**Escolhido: corrigir o typo e manter `AGUARDANDO CONTRATO`.**

| Alternativa descartada | Por que não |
|---|---|
| **Copiar o board exatamente como está** | Zero risco de perder correspondência, mas carrega o erro de grafia `LEAD FOLOW-UP` para frente. |
| **Seguir os documentos e descartar `AGUARDANDO CONTRATO`** | Funil mais enxuto, mas perde uma etapa que estava em uso real com 3 cards. |

### 2.6 Módulos da v1

Todos os quatro foram escolhidos: funil (Kanban + Lista), Minhas Tarefas (Kanban +
Lista), Dashboard + Métricas, e Agenda + follow-ups + pagamentos.

---

## 3. Como o plano mudou depois da primeira revisão

O primeiro plano foi **rejeitado** pelo Alex, com três correções. Vale registrar
porque a terceira mudou o desenho inteiro do sistema:

1. **"Quero poder editar, criar listas e cards, etiquetas, escolher as cores das
   etiquetas."** → Edição virou funcionalidade de primeira classe, não tela de admin
   escondida.

2. **"Não iremos importar nada do Trello, irei começar a usar do zero."** → O passo de
   importação saiu do plano.

3. **"Quando eu arrastar o card entre a lista seja criado as informações para que
   possamos metrificar."** → **Isto inverteu a arquitetura.**

Sobre a terceira: o plano original era *o comentário move o card* — escrever `AGENDOU`
faria o sistema sugerir mover para AVALIAÇÃO AGENDADA. O pedido do Alex inverteu para
*mover o card grava o comentário*.

A inversão é melhor, e o motivo é concreto: no desenho original, a métrica dependia de
o Alex escrever o comentário. No desenho novo, ela sai do gesto que ele já faz de
qualquer jeito. **A métrica deixou de depender de disciplina de registro.**

Efeito colateral técnico da mesma mudança: o mapa "lista → palavra-chave" teve que
sair do código e virar configuração no banco. Com listas editáveis pelo usuário, um
mapa fixo quebraria na primeira lista nova.

---

## 4. Teste do Engenheiro — as 9 perguntas

Aplicado conforme exige a Regra 2 do `AGENTS.md`, usando o
`CRITERIOS_DE_SUCESSO_OPERACIONAL_CAPILL_V1.md`.

**1. Problema.** Não existe número de funil confiável. Contar "quantos agendaram este
mês" exige ler comentário por comentário, e só funciona se o comentário tiver sido
escrito.

**2. Definição.** O critério é objetivo e não depende de julgamento: *entrar numa lista
é o evento*. "Agendou" = card entrou em AVALIAÇÃO AGENDADA. Cabe numa frase e é
aplicável em segundos.

**3. Impacto no processo atual.** **Reduz** trabalho. O Alex já arrasta o card; o
registro passa a sair desse gesto em vez de exigir um comentário adicional.

**4. Impacto nas métricas.** É o ponto central. A cadeia LEAD → QUALIFICADO →
AVALIAÇÃO → COMPARECIMENTO → VENDA passa a ser contável automaticamente, com tempo
médio por etapa de brinde.

**5. Impacto nos agentes.** O Vendas ganha o histórico estruturado que o
`Vendas/AGENTS.md` já exige. O Estrategista ganha o número de gargalo que o
`DNA_DA_CAPILL.md` §30 levanta como hipótese e nunca pôde testar.

**6. Alternativas mais simples.** Continuar no Trello foi seriamente considerado e é
mais simples. Perde: contagem automática, dedupe confiável por telefone, validação da
palavra-chave e o parse do bloco `===REPASSE===`.

**7. Princípio da operação individual.** Nenhuma tela precisa ser "trabalhada". A
métrica é subproduto do gesto que já existe. Nada exige uma segunda pessoa.

**8. Critério de sucesso.** Em 30 dias de uso: (a) o dashboard responde "quantas
avaliações e quantos fechamentos no mês" sem ninguém abrir card; (b) o Alex não abre o
Trello nenhuma vez.

**9. Veredito: APROVAR COM AJUSTES.** Quatro ajustes, todos incorporados:

- **O arrasto é a decisão humana.** Gravar o evento a partir dele não viola o item 9 do
  `PROTOCOLO_DE_TRABALHO` — foi o Alex quem moveu. O que o sistema **não** faz é mover
  card sozinho.
- **Métrica quantitativa e registro qualitativo são coisas separadas.** O arrasto grava
  o número; o motivo e o texto continuam sendo comentário humano, opcional. O sistema
  nunca inventa motivo.
- **A tela Entrada SDR é passiva** — sem badge de pendência, sem fila a trabalhar.
- **Sem campo novo sem uso comprovado** — nada de score ou temperatura de lead.

**Risco declarado na aprovação:** a partir do go-live, escrever no Trello cria uma
segunda fonte de verdade e quebra a Regra 1.

---

## 5. Stack e o porquê de cada peça

| Camada | Escolha | Por quê |
|---|---|---|
| App | Next.js 15 (App Router) + TypeScript | Um processo só serve a interface e o webhook do SDR. `npm run dev` e pronto. Sobe para a nuvem depois sem reescrita. |
| Estilo | Tailwind CSS v4 + tokens CSS | Tema claro/escuro por `data-theme` no `<html>`, sem flash. |
| Banco | SQLite (better-sqlite3) + Drizzle ORM | Arquivo único — backup é copiar o arquivo. Drizzle troca para Postgres na nuvem mudando só o driver. |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable | Arrastar entre colunas com suporte a teclado e acessibilidade. |
| Datas | date-fns + locale ptBR | |
| Gráficos | SVG inline, sem biblioteca | Ver a ressalva na seção 8. |

---

## 6. Especificação visual

Extraída da imagem de referência enviada pelo Alex.

```css
--accent:      #C9F24D;   /* verde-limão: barra de agenda, card de tarefa ativa */
--accent-ink:  #14200A;   /* texto sobre o verde */
--ink:         #111111;   /* pills pretas, botões redondos, "Nova Tarefa" */
--surface:     #FFFFFF;   /* cards */
--bg:          #E8E9E8;   /* fundo cinza levemente esverdeado */
--muted:       #8A8F8A;
--radius-card: 26px;  --radius-pill: 999px;
```

Escuro: `--bg:#0B0C0B` · `--surface:#161816` · `--ink:#F2F4F2`, com **o mesmo
verde-limão** — é a assinatura da interface.

Elementos fiéis à referência: rail vertical à esquerda com o ativo virando círculo
preto sólido; barra de agenda preta com segmentos verdes proporcionais ao horário e
marcador da hora atual; título gigante em caixa alta com botão preto colado;
contadores grandes com delta (`↑3` / `↓2`); chips de filtro (ativo = pill branca com
sombra); card de tarefa em destaque totalmente verde-limão; linhas com rolagem
horizontal.

Tipografia: Inter, peso 800 nos títulos gigantes.

---

## 7. Mapa lista → palavra-chave → etapa de métrica

Valores **iniciais**, editáveis em Configurações. Grafia fiel ao
`PADRAO_DE_COMENTARIOS`, com `NAO COMPARECEU` e `PECA CHEGOU` **sem acento**.

| Lista de destino | Palavra-chave sugerida | Conta como |
|---|---|---|
| MATERIAIS DE APOIO | — | — |
| LEAD QUALIFICADO | — | qualificado |
| LEAD FOLLOW-UP | — | lead |
| AVALIAÇÃO AGENDADA | `AGENDOU` (+ data/hora → agendamento) | agendado |
| ANALISANDO PROPOSTA | `COMPARECEU` | compareceu |
| FOLLOW-UP | `FECHOU` ou `PENSANDO` (escolha) | — (ambígua) |
| AGUARDANDO CONTRATO | `FECHOU` | fechou |
| FAZER PEDIDO DO SISTEMA | `FECHOU` | fechou |
| AGUARDANDO A PEÇA | `PEDIDO FEITO` | pedido |
| CHEGOU PEÇA | `PECA CHEGOU` | peca |
| 1° CONTATO PÓS VENDA | `APLICOU` | aplicou |
| SEM RETORNO | `SEM RETORNO` | sem_retorno |

Fora do arrasto: ação **"Marcar como perdido"** (`PERDIDO` + motivo, sai do funil
ativo), porque PERDIDO "sai do funil" e não é destino de lista.

---

## 8. Ressalva sobre os gráficos

A skill `dataviz` exige rodar um validador de paleta antes de publicar qualquer paleta
categórica — "a parte da cor é computável, então compute". O validador roda em Node,
que não estava instalado.

Em vez de publicar uma paleta não validada, **todos os gráficos foram estruturados em
série única**. Os motivos de perda viraram tabela com barra de total em vez de duas
cores; origem e distribuição usam a cor da própria etiqueta ou lista, que é cor
seguindo a entidade, não paleta inventada.

**Se um dia for preciso um gráfico multi-série, o validador tem que rodar antes.**

---

## 9. Passos de implementação — status

| # | Passo | Status |
|---|---|---|
| 1 | Scaffold, tokens de tema, alternador claro/escuro, rail e cabeçalho | escrito |
| 2 | Schema Drizzle, migração e seed da estrutura (sem clientes) | escrito |
| 3 | Funil: Kanban, lista, CRUD de listas e cards, motor de transição, desfazer | escrito |
| 4 | Etiquetas: CRUD com seletor de cor | escrito |
| 5 | Tarefas: Kanban + Lista, colunas editáveis | escrito |
| 6 | Métricas: agregações, dashboard, regras de amostra pequena | escrito |
| 7 | Webhook SDR, agenda, pagamentos, configurações | escrito |
| 8 | Doc do n8n e correção dos documentos-fonte | feito |

**"Escrito" não é "funcionando".** Nada foi compilado nem executado — ver a seção
seguinte.

---

## 10. Checklist de verificação — PENDENTE

Nenhum item abaixo foi executado. O Node não estava instalado na máquina no momento da
construção.

**Subir:**

- [ ] `npm install` conclui sem erro (atenção ao `better-sqlite3`, que é módulo nativo)
- [ ] `npm run build` compila sem erro de tipo
- [ ] `npm run dev` sobe em `localhost:3000`
- [ ] `npm run db:seed` cria 12 listas, 15 etiquetas e **zero clientes**

**O teste principal — a métrica pelo arrasto:**

- [ ] Criar 3 clientes, arrastar pelo funil até `1° CONTATO PÓS VENDA` e conferir que
      `/metricas` mostra 3 agendados, 3 compareceram, 3 fecharam e 3 aplicaram —
      **sem ter escrito nenhum comentário**
- [ ] Ignorar o balão de confirmação num arrasto e conferir que o número continua certo
- [ ] Arrastar um card de volta e conferir que não infla a contagem do período
- [ ] Desfazer um arrasto e conferir que card, transição e evento somem juntos

**Edição:**

- [ ] Renomear e reordenar listas; criar lista nova com palavra-chave própria e mover
      um card para ela
- [ ] Excluir uma lista com cards: confirma que pede destino e que as métricas antigas
      continuam corretas
- [ ] Criar etiqueta com cor personalizada, aplicar em card e em tarefa, conferir nos
      dois temas

**Regra 1:**

- [ ] Criar cliente com telefone já existente e confirmar o aviso de duplicidade
- [ ] Disparar o mesmo `===REPASSE===` duas vezes no webhook e confirmar que continua
      existindo **um** cliente, atualizado

**Webhook:**

- [ ] Repasse `NÃO QUALIFICADO` **não** entra no funil, só em `/entrada-sdr`
- [ ] Repasse com `AGENDOU` é convertido para `OUTRO`

**Resto:**

- [ ] `npm test` passa (telefone, parser, palavras-chave)
- [ ] Arrastar com mouse e com teclado, no funil e nas tarefas; recarregar e conferir
      que a posição persistiu
- [ ] Alternar Lista ⇄ Kanban e claro ⇄ escuro em todas as telas; recarregar e
      conferir que ficou
- [ ] Comparar `/` lado a lado com a imagem de referência

---

## 11. Pendências abertas

- **Diferença entre `AGUARDANDO CONTRATO` e `FAZER PEDIDO DO SISTEMA`.** Hoje as duas
  contam como "fechou". Se a distinção importa operacionalmente, precisa estar escrita.
  Só o Alex pode responder.
- **Critério das etiquetas de Situação Especial** — o que qualifica "Prioridade" vs.
  "Retorno Necessário". Pendência herdada do `MANUAL_OPERACIONAL`.
- **Autorização para alterar o n8n.** A configuração está pronta em
  [`INTEGRACAO_N8N.md`](INTEGRACAO_N8N.md); nada foi aplicado.
- **Arquivar o board do Trello** ao fim da migração.
- **Os ~21 cards do funil ativo** que ficaram no Trello: digitar à mão ou importar.
