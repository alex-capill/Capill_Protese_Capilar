# Capill — CHIA

Sistema de contexto, habilidades, integrações e automações para os agentes de IA da Capill (estúdio de prótese capilar masculina em Natal/RN), cobrindo marketing, conteúdo, vendas e operação.

## Documentos-fonte

- [DNA_DA_CAPILL.md](DNA_DA_CAPILL.md)
- [PROTOCOLO_DE_VERDADE_E_EXTREMA_SINCERIDADE___CAPILL_V2.md](PROTOCOLO_DE_VERDADE_E_EXTREMA_SINCERIDADE___CAPILL_V2.md)
- [MANUAL_OPERACIONAL_CAPILL_V1.md](MANUAL_OPERACIONAL_CAPILL_V1.md)
- [PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md](PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md)
- [CRITERIOS_DE_SUCESSO_OPERACIONAL_CAPILL_V1.md](CRITERIOS_DE_SUCESSO_OPERACIONAL_CAPILL_V1.md)
- [CHECKLIST_AVALIACAO_E_FECHAMENTO_CAPILL_V1.md](CHECKLIST_AVALIACAO_E_FECHAMENTO_CAPILL_V1.md)
- [PROTOCOLO_DE_TRABALHO_CAPILL_V1.md](PROTOCOLO_DE_TRABALHO_CAPILL_V1.md)

## Regras

1. Todo agente deve seguir o `PROTOCOLO_DE_VERDADE_E_EXTREMA_SINCERIDADE___CAPILL_V2.md` em toda resposta (fato ≠ inferência ≠ hipótese ≠ opinião, sinalizar nível de confiança, nunca inventar dado).

2. Antes de propor qualquer automação, lista, etiqueta ou processo novo, aplicar o teste do `CRITERIOS_DE_SUCESSO_OPERACIONAL_CAPILL_V1.md`.

3. O fundador (Alex) opera sozinho o atendimento, avaliação, aplicação e manutenção — toda recomendação deve considerar essa capacidade operacional real.

4. Nenhum agente decide preço, desconto ou condição comercial por conta própria sem autorização do fundador.

## Agentes (subpastas)

| Agente | Status |
|---|---|
| `Estrategista/` | ✅ pronto |
| `Conteudo/` | ✅ pronto |
| `Vendas/` | ✅ pronto |
| `RedTeam/` | ✅ pronto — única camada de autocrítica do sistema (os três agentes acima delegam a ela) |
| `Engenheiro/` | ✅ pronto — guardião da arquitetura do sistema (agentes, documentos, estrutura), transversal como o Red Team, mas focado em estrutura, não em conteúdo |
| `SDR/` | ✅ pronto — agente autônomo que atende o WhatsApp via n8n; qualifica e encaminha para o Alex, escopo mais estreito que o Vendas (nunca agenda, nunca fecha preço) |

Cada subpasta tem seu próprio AGENTS.md, contendo só o que é
específico daquele papel — nunca duplicando os documentos-fonte
da raiz.
