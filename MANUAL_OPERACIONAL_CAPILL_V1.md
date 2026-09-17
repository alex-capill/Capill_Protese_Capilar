# MANUAL OPERACIONAL CAPILL — V1

## STATUS DO DOCUMENTO

Este documento consolida regras operacionais do Trello que vinham sendo citadas por outros documentos (ex: `AGENTE_VENDAS_CAPILL_V2.md` referencia "Regra 1 do Manual Operacional") mas que ainda não existiam como arquivo próprio. A partir de agora, este é o documento de referência para essas regras.

**ATUALIZAÇÃO (17/09/2026).** O sistema operacional do funil passa a ser o **CSystem** (`CSystem/`), que substitui o board `Clientes Capill` do Trello. As duas regras abaixo continuam valendo integralmente — mudou o lugar onde elas são aplicadas, não o conteúdo delas. Onde este documento diz "card", leia "card do CSystem". O board do Trello deve ser arquivado assim que a migração for concluída: manter os dois recebendo card quebra a Regra 1 e cria duas fontes de verdade.

---

## REGRA 1 — CARD ÚNICO POR CLIENTE

Cada cliente deve ter um único card ativo no fluxo comercial.

O card acompanha o cliente durante toda a jornada. Não se cria um novo card para cada etapa.

O que muda ao longo da jornada:

- Lista = estágio atual do cliente no funil.
- Etiquetas = classificações (ver seção abaixo).
- Descrição = cadastro do cliente + contexto comercial.
- Comentários = histórico com data e horário (ver `PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md`).

### Sobre os templates em "MATERIAIS DE APOIO"

Os cards presentes na lista MATERIAIS DE APOIO (ex: "LEAD Nome Cliente", "AVALIAÇÃO Nome Cliente") não são cards de cliente — são modelos. Alex os copia manualmente para criar o card único do cliente quando existe intenção de fixar uma data de retorno para agendar a avaliação. O card resultante da cópia é que passa a ser o card único e contínuo daquele cliente, seguindo a Regra 1.

A partir de 16/09/2026, a lista LEAD QUALIFICADO passa a ter uma segunda via de entrada, automática: quando o Agente SDR classifica um repasse como QUALIFICADO, uma automação no n8n cria (ou atualiza, se já existir) o card diretamente nessa lista, buscando por telefone para respeitar a Regra 1 (card único por cliente). O modo manual — Alex copiando o template — continua existindo para os casos que chegam diretamente a ele, fora do fluxo do SDR.

A partir de 17/09/2026, essa segunda via passa a apontar para o CSystem em vez do Trello: o n8n chama `POST /api/sdr/repasse`, que faz a mesma busca por telefone e a mesma criação-ou-atualização. A configuração do nó está em `CSystem/docs/INTEGRACAO_N8N.md`. No CSystem não existem cards-template: criar cliente é um botão na própria coluna.

---

## REGRA 2 — ESTRUTURA DE ETIQUETAS

As etiquetas classificam o card em quatro grupos independentes. Um card pode ter etiquetas de mais de um grupo ao mesmo tempo.

### ORIGEM

Identifica de onde veio o lead.

- Instagram Orgânico
- Instagram Anúncio
- Google Pesquisa
- Google Anúncio
- Indicação
- Cliente Antigo
- Outros

### MODALIDADE DA AVALIAÇÃO

Identifica como a avaliação foi ou será conduzida.

- Avaliação Studio
- Avaliação Online

### PAGAMENTO

Identifica a situação financeira do cliente.

- Pagamento Ok
- Resta Pagamento
- Aguardando Pagamento

### SITUAÇÃO ESPECIAL

Sinaliza um card que precisa de atenção fora do fluxo padrão.

- Retorno Necessário
- Prioridade
- Problema

Observação: este grupo (Situação Especial) não foi confirmado como já existente no board real do Trello até o momento deste documento — não apareceu na auditoria realizada anteriormente. Vale confirmar se as etiquetas já foram criadas no Trello ou se ainda precisam ser criadas antes de serem usadas.

**RESOLVIDO (17/09/2026).** Leitura direta do board `Clientes Capill` confirmou que as três etiquetas de SITUAÇÃO ESPECIAL **já existem** — `Prioridade` (vermelho), `Retorno Necessário` (vermelho claro) e `Problema` (vermelho escuro) — todas com zero usos. As 15 etiquetas dos quatro grupos foram replicadas no CSystem com as mesmas cores, com uma correção: no Trello as 7 etiquetas de ORIGEM têm todas a mesma cor (`sky_light`), o que as torna indistinguíveis no card; no CSystem cada uma recebeu um tom próprio.

---

## LISTAS DO FUNIL

Levantamento do board real em 17/09/2026, na ordem em que aparecem. São 12 listas — os outros documentos citavam apenas 10.

1. MATERIAIS DE APOIO *(apoio, não é etapa)*
2. LEAD QUALIFICADO
3. LEAD FOLLOW-UP — **no Trello está escrito `LEAD FOLOW-UP`, com um L a menos. Grafia corrigida no CSystem.**
4. AVALIAÇÃO AGENDADA
5. ANALISANDO PROPOSTA
6. FOLLOW-UP
7. AGUARDANDO CONTRATO — **em uso real (3 cards), mas não mencionada em nenhum documento até aqui. Mantida no funil.**
8. FAZER PEDIDO DO SISTEMA
9. AGUARDANDO A PEÇA
10. CHEGOU PEÇA
11. 1° CONTATO PÓS VENDA
12. SEM RETORNO

No CSystem, cada lista carrega duas configurações próprias, editáveis em Configurações: a **etapa de métrica** que ela representa e a **palavra-chave** que ela sugere quando um card é solto ali. Isso é configuração e não código justamente porque listas podem ser criadas e renomeadas.

---

## PENDENTE

- Definir critério de quando aplicar cada etiqueta de Situação Especial (ex: o que qualifica um card como "Prioridade" vs. "Retorno Necessário").
- Definir o que exatamente diferencia AGUARDANDO CONTRATO de FAZER PEDIDO DO SISTEMA. Hoje as duas contam como "fechou" na métrica; se a diferença for relevante, ela precisa estar escrita.
