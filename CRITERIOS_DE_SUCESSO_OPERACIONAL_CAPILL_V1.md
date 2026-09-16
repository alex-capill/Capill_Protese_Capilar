# CRITÉRIOS DE SUCESSO OPERACIONAL E TESTE DO ENGENHEIRO — CAPILL V1

## STATUS DO DOCUMENTO

Este documento formaliza um framework que já estava em uso real no projeto — foi aplicado ao menos duas vezes em sessões anteriores (avaliação de automação no fluxo de Lead Follow-up, e avaliação da proposta de lista "LEAD QUALIFICADO") — mas nunca tinha sido salvo como arquivo próprio no Projeto. O original foi enviado como anexo numa conversa anterior; este documento é uma reconstrução fiel ao uso real observado, não uma cópia literal do arquivo original, que não está recuperável. Se você tiver o arquivo original em outro lugar, vale comparar e corrigir esta versão.

---

## QUANDO APLICAR

Sempre que alguém propuser: uma automação nova, uma lista/etiqueta/campo novo no Trello, um agente novo, ou qualquer alteração estrutural no processo — antes de implementar qualquer coisa.

Regra central: não presumir que automatizar, organizar ou adicionar estrutura é melhor por padrão. Se o processo manual atual for mais adequado, isso deve ser dito claramente, mesmo que pareça menos sofisticado.

---

## O TESTE (perguntas, nesta ordem)

### 1. PROBLEMA

Existe evidência de que o processo atual não consegue atender a uma necessidade real? Ou a mudança está sendo proposta só porque parece mais organizada?

### 2. DEFINIÇÃO

Se a proposta envolve uma nova categoria (lista, etiqueta, campo): existe um critério objetivo e aplicável em segundos para diferenciá-la do que já existe? Se não for possível escrever esse critério numa frase clara, a proposta não deveria avançar.

### 3. IMPACTO NO PROCESSO ATUAL

A mudança aumenta complexidade? Cria mais movimentações manuais? Aumenta trabalho? Cria risco de itens (cards) parados sem dono? Cria risco de duplicação? Dificulta a compreensão do fluxo por quem opera?

### 4. IMPACTO NAS MÉTRICAS

A mudança gera uma métrica que responde a uma pergunta de negócio hoje sem resposta? Ou só cria uma nova categoria pra contar, sem necessariamente melhorar a qualidade da decisão?

### 5. IMPACTO NOS AGENTES

Qual o efeito sobre cada agente envolvido no sistema (Estrategista, Vendas, Conteúdo, Red Team)? Um dado ruim ou pouco confiável é pior do que a ausência do dado, porque pode gerar conclusões erradas com aparência de precisão.

### 6. ALTERNATIVAS MAIS SIMPLES

Antes de recomendar a solução proposta, existe uma alternativa mais simples usando o que já existe (etiqueta, checklist, campo dentro do card, ou simplesmente não criar nada)? Não presumir que a solução mais estruturada é a melhor.

### 7. PRINCÍPIO DA OPERAÇÃO INDIVIDUAL

O fundador opera sozinho — isso é uma restrição real, não uma preferência. Uma melhoria que aumenta significativamente o trabalho operacional deve ser questionada, mesmo que traga ganho analítico.

### 8. CRITÉRIO DE SUCESSO

Se a mudança for aprovada: como saberemos, de forma objetiva, que ela funcionou? Se não for possível medir o benefício claramente, a proposta deve ser tratada como hipótese, não como melhoria comprovada.

### 9. VEREDITO

Escolher um: APROVAR / APROVAR COM AJUSTES / REVISAR / NÃO APROVAR — com explicação objetiva. Não é permitido concordar com a proposta só porque foi o fundador quem sugeriu; se a ideia for desnecessária, a resposta correta é "eu não criaria isso".

---

## PRIORIDADE ENTRE VALORES (ordem de decisão)

SIMPLICIDADE → CONFIABILIDADE → DADOS ÚTEIS → EXECUTABILIDADE → AUTOMAÇÃO APENAS QUANDO JUSTIFICADA.

---

## EXEMPLOS REAIS JÁ JULGADOS COM ESTE TESTE

Registrado para consistência futura — não reabrir sem nova evidência:

- Automação da criação de card em "Lead Follow-up": veredito REVISAR. A decisão de classificar um lead como follow-up deve continuar humana (não automatizável sem risco); só a execução mecânica (copiar modelo, nomear, mover) seria candidata a automação, e mesmo assim só depois de medir o tempo real gasto hoje.
- Nova lista "LEAD QUALIFICADO": veredito NÃO APROVAR. Sem problema comprovado, sem critério objetivo de diferenciação definido, aumento de trabalho manual permanente sem benefício analítico comprovado. Se o objetivo for identificar leads mais promissores, uma etiqueta simples resolve sem alterar a estrutura do funil.

  **REVISÃO (16/09/2026): veredito revertido para APROVAR, com evidência nova.**
  Os dois motivos da rejeição original deixaram de se aplicar: (1) "sem critério objetivo de diferenciação" — hoje existe, é a classificação QUALIFICADO/NÃO QUALIFICADO/INDEFINIDO produzida pelo Agente SDR a partir de critério já documentado (prazo declarado + sinal de ação); (2) "aumento de trabalho manual permanente" — a criação do card passou a ser automática via n8n, buscando por telefone antes de criar para respeitar a Regra 1 (card único por cliente), sem exigir cópia manual de template para os leads que vêm do SDR.
  O modo manual (Alex copiando o template em MATERIAIS DE APOIO) continua existindo para leads que chegam diretamente a ele, fora do fluxo do SDR — a automação não substitui esse caminho, só adiciona um segundo.

---

## REGRA FINAL

Uma alteração nunca deve ser aprovada só porque parece mais profissional, mais automatizada ou mais organizada. Ela precisa demonstrar benefício real, mensurável, proporcional ao custo operacional que adiciona — numa operação de uma pessoa só, esse custo nunca é hipotético, é real.
