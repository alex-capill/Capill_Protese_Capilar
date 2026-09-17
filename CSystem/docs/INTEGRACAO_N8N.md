# Integração n8n → CSystem

> **Nada aqui foi aplicado no n8n.** Este documento descreve a mudança; a alteração
> no fluxo que atende cliente real depende de autorização do Alex.

## O que muda

Hoje, quando o Agente SDR classifica um repasse como `QUALIFICADO`, o fluxo do n8n faz
duas coisas:

1. manda o bloco de repasse no WhatsApp do Alex;
2. cria (ou atualiza) um card na lista `LEAD QUALIFICADO` do Trello, buscando por telefone.

A mudança é **substituir só o passo 2**. O passo 1 continua exatamente como está — o
Alex continua recebendo o repasse no WhatsApp.

```
ANTES:  [SDR] → [separar ===REPASSE===] → ┬→ [WhatsApp para Alex]
                                          └→ [Trello: criar/atualizar card]

DEPOIS: [SDR] → [separar ===REPASSE===] → ┬→ [WhatsApp para Alex]
                                          └→ [HTTP Request → CSystem]
```

## Configuração do nó HTTP Request

| Campo | Valor |
|---|---|
| **Method** | `POST` |
| **URL** | `{{ $env.CSYSTEM_URL }}/api/sdr/repasse` |
| **Authentication** | None (o segredo vai no header) |
| **Send Headers** | ligado |
| **Header — Name** | `x-csystem-token` |
| **Header — Value** | o valor de `CSYSTEM_WEBHOOK_TOKEN` do `.env.local` |
| **Send Body** | ligado |
| **Body Content Type** | `JSON` |
| **Specify Body** | `Using JSON` |
| **JSON** | `{ "raw": {{ JSON.stringify($json.repasse) }} }` |

Trocar `$json.repasse` pelo campo onde o nó anterior deixa o bloco de repasse já
separado do texto do cliente.

**Importante:** o CSystem espera o bloco **bruto**, do jeito que o SDR escreveu, com o
marcador `===REPASSE===` e tudo. Não pré-processar, não converter para JSON campo a
campo — o parser do CSystem faz isso e registra o texto original para auditoria.

### Resposta

```json
{
  "ok": true,
  "clientId": "9f3a…",
  "url": "http://localhost:3000/clientes/9f3a…",
  "created": true,
  "classification": "QUALIFICADO",
  "enteredFunnel": true,
  "agendouRejeitado": false,
  "camposAusentes": [],
  "warnings": []
}
```

O campo `url` serve para anexar o link do card à mensagem que já vai para o WhatsApp
do Alex — assim ele abre o cliente direto do celular.

## Comportamento, campo a campo

| Situação | O que o CSystem faz |
|---|---|
| `CLASSIFICAÇÃO: QUALIFICADO` | Cria ou atualiza o cliente e coloca na lista marcada como estágio `qualificado`. Grava a transição, então o lead já conta na métrica do mês. |
| `NÃO QUALIFICADO` / `INDEFINIDO` | Grava só na Entrada SDR. **Não toca no funil** — idêntico ao comportamento documentado no `SDR/AGENTS.md`. |
| Telefone já existe | Atualiza o cliente existente e move. **Nunca cria um segundo card** (Regra 1). A descrição antiga é preservada e o novo repasse entra abaixo dela. |
| Telefone ausente ou ilegível | O repasse entra mesmo assim, com um aviso em `warnings` de que não foi possível checar duplicidade. |
| `ORIGEM` preenchida | Aplica a etiqueta de origem correspondente. |
| `CIDADE` preenchida | Deriva a modalidade pela lista de cidades do `SDR/AGENTS.md` e aplica `Avaliação Studio` ou `Avaliação Online`. **Isto é novo** — hoje a modalidade fica só na conversa e nunca chega ao card. |
| Comentário com `AGENDOU` | Convertido para `OUTRO`, com aviso. O SDR não agenda. |
| Qualquer erro de processamento | O bloco bruto **já foi salvo** antes do processamento. Nenhum lead se perde por erro aqui. |

## Enquanto o app roda local

O n8n na nuvem não alcança `localhost`. Dois caminhos:

**A. Túnel temporário** — para testar de ponta a ponta:

```bash
cloudflared tunnel --url http://localhost:3000
```

Usar a URL que o comando imprime como `CSYSTEM_URL` no n8n. O túnel cai quando o
comando é encerrado; serve para teste, não para produção.

**B. Colagem manual** — o caminho do dia a dia até o deploy: abrir **Entrada SDR** no
CSystem e colar o bloco que chegou no WhatsApp. O botão "Ver o que o sistema entendeu"
mostra o parse antes de gravar.

## Testar o endpoint sem o n8n

```bash
curl -X POST http://localhost:3000/api/sdr/repasse \
  -H "Content-Type: application/json" \
  -H "x-csystem-token: SEU_TOKEN" \
  -d '{"raw":"===REPASSE===\nLEAD: Teste\nCIDADE: Natal\nTELEFONE: 84999998888\nCLASSIFICAÇÃO:\nQUALIFICADO\nNÍVEL DE CONFIANÇA:\nALTA"}'
```

Rodar duas vezes: na segunda, a resposta deve trazer `"created": false` e continuar
existindo **um** cliente. É o teste da Regra 1.

Para conferir só o parse, sem gravar nada e sem token:

```bash
curl -X POST http://localhost:3000/api/sdr/repasse/preview \
  -H "Content-Type: application/json" \
  -d '{"raw":"===REPASSE===\nLEAD: Teste"}'
```

## Depois de migrar

Quando o CSystem estiver recebendo os leads, o board `Clientes Capill` no Trello deve
ser **arquivado ou deixado somente-leitura**. Manter os dois recebendo card quebra a
Regra 1 e cria duas fontes de verdade — exatamente o que o
`PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md` proíbe ao dizer que dois métodos de
registro não devem ser usados ao mesmo tempo.
