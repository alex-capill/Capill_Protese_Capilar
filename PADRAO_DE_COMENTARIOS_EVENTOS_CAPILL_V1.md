# PADRÃO DE COMENTÁRIOS PARA REGISTRO DE EVENTOS — CAPILL V1

## STATUS DO DOCUMENTO

Esta é a primeira versão do padrão. Trata-se de uma **HIPÓTESE OPERACIONAL** a ser validada na prática.

Este documento **substitui** a ideia anterior de planilha manual semanal para registro de métricas de funil. Os dois métodos não devem ser usados ao mesmo tempo, para evitar duplicação de registro da mesma informação.

**ATUALIZAÇÃO (17/09/2026) — o que mudou com o CSystem.** A contagem de funil deixou de depender do comentário. No CSystem, **mover o card de lista já grava o evento de métrica sozinho**; o comentário passa a ter outra função, mais estreita e mais honesta: registrar o **porquê** (motivo de uma objeção, data de um retorno, contexto da conversa), não o **quanto**.

Na prática:

- As 11 palavras-chave abaixo continuam valendo integralmente, e agora são escolhidas numa lista fechada em vez de digitadas — o que elimina de vez o risco de variação inventada ("AGENDADO" no lugar de "AGENDOU") que a seção 2 adverte.
- Depois de arrastar um card, o sistema sugere a palavra-chave correspondente ao destino. Confirmar é opcional: **ignorar a sugestão não perde nenhum número.**
- A observação da seção 7 — "se o comentário não for feito, o evento não existe para fins de contagem" — **deixa de valer para a contagem de etapas do funil**, que agora é automática. Continua valendo para motivo de perda e data de follow-up, que só existem se forem registrados.

---

## 1. OBJETIVO

Permitir que cada evento relevante do funil comercial seja registrado no momento em que acontece, diretamente como comentário no card do Trello, de forma que possa ser contado de forma confiável posteriormente (por mim ou por qualquer agente).

O timestamp do comentário é gerado automaticamente pelo Trello — não é necessário anotar data manualmente, exceto quando o próprio evento tratar de uma data futura (ex: um agendamento).

---

## 2. REGRA PRINCIPAL

Todo comentário que representar um evento de funil deve **começar** com uma das palavras-chave abaixo, em maiúsculas.

O restante do comentário pode ser escrito livremente, com sua linguagem natural.

Não inventar variações da palavra-chave (ex: não usar "AGENDADO" quando o padrão é "AGENDOU"). Se surgir uma situação que nenhuma palavra-chave cobre, usar `OUTRO:` seguido da descrição, em vez de forçar uma palavra-chave que não se aplica exatamente.

Um comentário = um evento. Não combinar dois eventos diferentes no mesmo comentário.

---

## 3. PALAVRAS-CHAVE POR ETAPA DO FUNIL

| Palavra-chave | Quando usar | Transição no funil |
|---|---|---|
| `AGENDOU` | Lead marcou a avaliação presencial | LEAD FOLLOW-UP → AVALIAÇÃO AGENDADA |
| `COMPARECEU` | Cliente veio na avaliação agendada | AVALIAÇÃO AGENDADA → ANALISANDO PROPOSTA |
| `NAO COMPARECEU` | Cliente faltou à avaliação agendada | Fica em AVALIAÇÃO AGENDADA ou volta para acompanhamento |
| `FECHOU` | Cliente decidiu fechar negócio | ANALISANDO PROPOSTA → FOLLOW-UP (ou direto para FAZER PEDIDO DO SISTEMA, se não houver pendência) |
| `PEDIDO FEITO` | Pendência resolvida e pedido do sistema realizado | FAZER PEDIDO DO SISTEMA → AGUARDANDO A PEÇA |
| `PECA CHEGOU` | Peça chegou e está pronta para aplicação | AGUARDANDO A PEÇA → CHEGOU PEÇA |
| `APLICOU` | Aplicação realizada | CHEGOU PEÇA → 1° CONTATO PÓS VENDA |
| `SEM RETORNO` | Lead parou de responder | LEAD FOLLOW-UP → SEM RETORNO |
| `PENSANDO` | Cliente pediu tempo para decidir ("vou pensar") | Permanece em ANALISANDO PROPOSTA ou FOLLOW-UP |
| `PERDIDO` | Cliente confirmou que não vai fechar | Sai do funil ativo |
| `OUTRO` | Evento relevante não coberto pelas opções acima | — |

---

## 4. REGISTRO DE MOTIVO (quando aplicável)

Ao usar `PENSANDO` ou `PERDIDO`, incluir o motivo mais provável **somente quando houver evidência clara** (conforme o Checklist de Avaliação e Fechamento, seção 11 e 14). Usar as categorias já existentes:

`preço`, `condição de pagamento`, `cartão`, `esposa/parceira`, `família`, `medo`, `arrependimento`, `manutenção`, `rotina`, `comparação`, `necessidade de pensar`, `falta de urgência`, `necessidade de esperar`, `outro`.

Se não houver evidência suficiente do motivo real, **não adivinhar**. Registrar apenas:

`PENSANDO: motivo não identificado`

---

## 5. REGISTRO DE EVENTO FUTURO (FOLLOW-UP)

Quando o cliente informar que algo vai acontecer em uma data específica (ex: "vou esperar virar minha fatura"), registrar no formato do Checklist (seção 13):

```
FOLLOW-UP: motivo=[motivo] | evento=[o que precisa acontecer] | data=[data informada pelo cliente]
```

Exemplo:

```
FOLLOW-UP: motivo=condição financeira | evento=virada da fatura | data=05/10
```

---

## 6. EXEMPLOS DE COMENTÁRIOS VÁLIDOS

```
AGENDOU para 15/09 às 14h
COMPARECEU hoje, avaliação boa
FECHOU R$1.800, vai pagar em 2x
PENSANDO: esposa quer opinar antes
PERDIDO: preço, achou caro comparado ao concorrente
SEM RETORNO desde dia 20/08, mandei 2 mensagens
OUTRO: cliente remarcou avaliação para semana que vem
```

---

## 7. O QUE ESTE PADRÃO NÃO SUBSTITUI

- Não substitui o julgamento humano sobre qual é o motivo real de uma objeção — isso continua sendo decisão do fundador, registrada no comentário.
- Não elimina a dependência de disciplina no registro. Se o comentário não for feito, o evento não existe para fins de contagem, da mesma forma que aconteceria em qualquer registro manual.
- Não deve ser combinado com a planilha manual semanal (ver seção "Status do documento").

---

## 8. REVISÃO

Este padrão deve ser revisado após um período de uso real (sugestão: 4 a 6 semanas), para verificar se as palavras-chave cobrem os casos reais encontrados ou se precisam de ajuste. Até lá, trata-se de uma hipótese operacional, não de uma regra definitiva.
