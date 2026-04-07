

# Melhorias de UX — Paginas Internas

Apos analisar todas as paginas do dashboard (Chat, Libraries, Agents, Settings, Organization, Groups, AI Config, Library Detail), identifiquei as seguintes melhorias organizadas por impacto.

---

## 1. Chat — Empty state fraco e input pouco convidativo (Alto impacto)

**Problema:** O estado vazio mostra apenas um icone opaco com "Ask anything..." — nao orienta o usuario nem sugere o que perguntar. O input e um textarea basico sem destaque visual.

**Melhoria:**
- Adicionar sugestoes de perguntas clicaveis no empty state (ex: "Resuma os ultimos relatorios", "Quais documentos tenho?")
- Melhorar o empty state com titulo de boas-vindas e subtexto explicativo
- Adicionar borda com glow sutil no input ao focar

**Arquivos:** `src/pages/Chat.tsx`

---

## 2. Chat — Lista de historico sem busca nem organizacao (Alto impacto)

**Problema:** A sidebar de historico e uma lista plana sem busca, sem agrupamento por data, e sem indicacao de qual agente foi usado em cada conversa.

**Melhoria:**
- Adicionar campo de busca no topo da lista de historico
- Agrupar conversas por periodo (Hoje, Ontem, Esta semana, Anteriores)
- Mostrar badge do agente ao lado do titulo quando disponivel

**Arquivos:** `src/pages/Chat.tsx`

---

## 3. LibraryDetail — Status badges com cores hardcoded (Medio impacto)

**Problema:** A funcao `statusBadge` na linha 304-308 ainda usa `bg-green-500` e `bg-yellow-500` hardcoded, fora do design system.

**Melhoria:**
- Substituir por tokens do design system (mesma abordagem ja usada em Settings com `hsl(var(--success))`)

**Arquivos:** `src/pages/LibraryDetail.tsx`

---

## 4. Paginas de listagem — Cards sem informacao util (Medio impacto)

**Problema:** Os cards de Libraries mostram apenas nome + descricao + ID truncado. Cards de Groups mostram apenas nome + data. Nao ha contagem de documentos, membros, ou indicadores de atividade.

**Melhoria:**
- Libraries: mostrar contagem de documentos (se disponivel na API) e data de ultimo upload
- Groups: mostrar contagem de membros
- Agents: mostrar quais libraries estao vinculadas de forma mais visual (icones em vez de badges de texto)

**Arquivos:** `src/pages/UserLibraries.tsx`, `src/pages/Groups.tsx`, `src/pages/UserAgents.tsx`

---

## 5. Formularios em Dialogs — Inputs sem labels visiveis (Medio impacto)

**Problema:** Varios dialogs usam apenas placeholders como indicacao do campo (ex: "Group name", "Agent name", "Email address"). Quando o usuario digita, perde a referencia do que e o campo.

**Melhoria:**
- Adicionar labels explicitas acima dos inputs em todos os dialogs de criacao (Groups, Agents, Organization invite, Libraries)

**Arquivos:** `src/pages/Groups.tsx`, `src/pages/UserAgents.tsx`, `src/pages/Organization.tsx`, `src/pages/UserLibraries.tsx`

---

## 6. Organization — Tabela de usuarios sem avatar real nem busca (Baixo impacto)

**Problema:** Avatares sao apenas as 2 primeiras letras do email. Em organizacoes com muitos membros, nao ha busca nem paginacao.

**Melhoria:**
- Adicionar campo de busca para filtrar membros por email
- Melhorar avatar com cores variadas baseadas no hash do email

**Arquivos:** `src/pages/Organization.tsx`

---

## 7. Textos misturados em ingles e portugues (Baixo impacto)

**Problema:** Paginas internas estao em ingles ("No documents yet", "Ask anything", "History") enquanto Settings e dicas estao em portugues. Inconsistencia de idioma.

**Melhoria:**
- Padronizar todos os textos internos para portugues, ja que e o idioma do usuario e da landing page

**Arquivos:** Todas as paginas internas

---

## Resumo de prioridade

| # | Melhoria | Impacto | Esforco |
|---|----------|---------|---------|
| 1 | Chat empty state + sugestoes clicaveis | Alto | Medio |
| 2 | Chat historico com busca e agrupamento | Alto | Medio |
| 3 | LibraryDetail status badges design tokens | Medio | Baixo |
| 4 | Cards com mais informacao util | Medio | Medio |
| 5 | Labels em formularios de dialogs | Medio | Baixo |
| 6 | Organization busca + avatares | Baixo | Baixo |
| 7 | Padronizar idioma para portugues | Baixo | Medio |

## Detalhes tecnicos

- **Chat suggestions**: Array estatico de strings renderizado como botoes no empty state, cada um chama `setInput(text)` + `handleSend()`
- **Agrupamento por data**: Funcao utilitaria que classifica chats em buckets (hoje/ontem/semana/anterior) usando `Date` comparisons
- **Design tokens**: Usar `hsl(var(--success))` / `hsl(var(--warning))` / `hsl(var(--destructive))` conforme ja existe no index.css
- **Labels**: Usar componente `<Label>` do shadcn ja importado no projeto

