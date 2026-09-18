# CSystem — instruções de continuidade

As instruções de `../AGENTS.md` continuam obrigatórias neste diretório. Antes de
alterar o CSystem, leia, nesta ordem:

1. `README.md` — operação, rotas e arquitetura;
2. `docs/CONTEXTO_DE_CONTINUIDADE.md` — handoff técnico e visual mais recente;
3. `docs/PLANEJAMENTO.md` — decisões de produto que não devem ser reabertas sem
   motivo;
4. `../DOCUMENTACAO.md` — histórico geral append-only da Capill.

Regras locais adicionais:

- `data/csystem.db` é dado operacional local e fica fora do Git. Nunca use
  `db:reset`, apague a base, nem substitua esse arquivo para "limpar" um teste sem
  autorização explícita do Alex.
- A métrica de funil vem de `list_transitions`, criada ao mover um card. Preservar o
  snapshot da lista na transição é requisito de histórico, inclusive ao renomear ou
  excluir listas.
- Não inferir motivo de perda, interesse, preço ou decisão comercial. A confiança
  exibida no card é a que o SDR declarou; não é um score calculado.
- Consulte o handoff antes de iniciar servidor ou build: `next build` concorrendo com
  `next dev` pode corromper temporariamente `.next` e deixar o navegador sem
  hidratação. Pare o dev server antes de gerar build.
- Toda descoberta nova, bug ou decisão relevante deve ser acrescentada em
  `../DOCUMENTACAO.md`, sem reescrever entradas antigas, e o handoff deve refletir o
  estado resultante.
