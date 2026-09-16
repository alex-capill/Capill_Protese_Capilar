# MANUAL OPERACIONAL CAPILL — V1

## STATUS DO DOCUMENTO

Este documento consolida regras operacionais do Trello que vinham sendo citadas por outros documentos (ex: `AGENTE_VENDAS_CAPILL_V2.md` referencia "Regra 1 do Manual Operacional") mas que ainda não existiam como arquivo próprio. A partir de agora, este é o documento de referência para essas regras.

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

---

## PENDENTE

- Confirmar se as etiquetas do grupo SITUAÇÃO ESPECIAL já existem no board "Clientes Capill" ou se precisam ser criadas.
- Definir critério de quando aplicar cada etiqueta de Situação Especial (ex: o que qualifica um card como "Prioridade" vs. "Retorno Necessário").
