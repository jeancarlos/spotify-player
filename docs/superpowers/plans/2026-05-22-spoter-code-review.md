# Plano: Ajustes Pós-Code Review (Spoter)

**Data:** 2026-05-22
**Status:** Em Revisão

Este documento detalha os ajustes necessários identificados durante o code review das especificações de design e arquitetura do Spoter.

---

## 1. Arquitetura de Estado e Dados

### 1.1 Centralização da Extração de Cores
- **Problema:** A extração de cores via `color-thief-ts` está duplicada em `Home.tsx` e `ArtistDetail.tsx`. Isso causa redundância e pode levar a estados inconsistentes.
- **Ajuste:** Criar um observer (preferencialmente um componente `PaletteObserver` ou um hook `usePaletteSync`) que reaja a mudanças no `currentTrack` do `PlayerContext`. Sempre que o `currentTrack` mudar, ele deve extrair a paleta e despachar `SET_PALETTE`.
- **Arquivos:** `src/contexts/PlayerContext.tsx` (ou novo componente no `AppShell`), `src/pages/Home.tsx`, `src/pages/ArtistDetail.tsx`.

### 1.2 Globalização das Variáveis de Cor (CSS Vars)
- **Problema:** As cores da paleta estão sendo usadas apenas no `DynamicBackground.tsx`. As especificações pedem que o `AppShell` as aplique como variáveis CSS (`--color-primary`, `--color-secondary`).
- **Ajuste:** Atualizar o `AppShell.tsx` (ou um wrapper) para injetar as variáveis CSS no elemento root ou em um container pai, permitindo que componentes como o `FullscreenPlayer` as usem para sombras dinâmicas e glow effects via Tailwind.
- **Arquivos:** `src/components/layout/AppShell.tsx`.

---

## 2. Interface e Design System

### 2.1 Internacionalização (i18n)
- **Problema:** Algumas strings estão hardcoded em português em componentes e páginas cruciais.
- **Ajuste:** Mover as seguintes strings para os arquivos de locale e usar o hook `useTranslation`:
  - `ArtistDetail.tsx`: "followers", "Popularidade", "Top Tracks", "Álbuns", "Anterior", "Próxima".
  - `FullscreenPlayer.tsx`: "Tocando agora", "Buscando letra...", "Letra não encontrada", "Álbum:", "Lançamento:", "Popularidade:", "Duração:".
- **Arquivos:** `src/locales/pt-BR.json`, `src/locales/en-US.json`, `src/pages/ArtistDetail.tsx`, `src/components/layout/FullscreenPlayer.tsx`.

### 2.2 Sidebar: Profile Popup
- **Problema:** A especificação menciona que o hover no profile (na sidebar) deve mostrar um popup. Atualmente, apenas mostra o nome/avatar estaticamente quando expandida.
- **Ajuste:** Implementar o popup de perfil (usando Radix/Shadcn Popover ou Framer Motion) que surge ao passar o mouse sobre o avatar do usuário na Sidebar.
- **Arquivos:** `src/components/layout/Sidebar.tsx`.

### 2.3 Fullscreen Player: Queue/Playlist Lateral
- **Problema:** O wireframe `player-expanded` prevê um painel lateral deslizante para a fila de reprodução (queue). Atualmente, o player fullscreen foca apenas na letra e nos controles.
- **Ajuste:** Adicionar um botão de toggle para a fila de reprodução no `FullscreenPlayer` e implementar o painel lateral com a lista de faixas da queue.
- **Arquivos:** `src/components/layout/FullscreenPlayer.tsx`.

---

## 3. Melhorias Técnicas e UX

### 3.1 Tratamento de Erros e Loading
- **Problema:** Embora o Axios tenha interceptores para 401, falhas gerais de API (500, 404) não têm um tratamento visual consistente além dos logs.
- **Ajuste:** Garantir que todos os hooks de query do React Query tenham tratamento de erro que informe o usuário (toasts ou placeholders de erro).
- **Arquivos:** `src/hooks/queries/*`.

---

## 4. Bug Hunt & Estabilidade

### 4.1 Sync de Estado do Player (Crítico)
- **Bug:** O hook `useNowPlaying.ts` foi criado mas não é utilizado em nenhum lugar.
- **Impacto:** Se o usuário trocar de música ou pausar em outro dispositivo (celular/desktop), o Spoter não refletirá a mudança na UI.
- **Ajuste:** Criar um componente `PlayerSync` (ou integrar no `PlayerContext`) que use o hook `useNowPlaying` para manter o estado local sincronizado com a API do Spotify via polling.

### 4.2 Formatação de Duração (Lógico)
- **Bug:** `formatDuration.ts` não suporta durações maiores que 60 minutos (ex: podcasts).
- **Impacto:** Exibição incorreta de tempo para conteúdos longos.
- **Ajuste:** Atualizar a função para incluir horas se `minutes >= 60`.

### 4.3 Internacionalização (Hardcoded)
- **Bug:** Strings como "Todos" (filtros), "Anterior" e "Próxima" (paginação) estão em português direto no JSX em `Artists.tsx` e `ArtistDetail.tsx`.
- **Impacto:** Usuários em EN-US verão mix de idiomas.

### 4.4 Tratamento de Erros de Auth
- **Bug:** O `useEffect` que busca o perfil no `AuthProvider` não tem tratamento de `.catch()`.
- **Impacto:** Se o token expirar e o refresh falhar nessa chamada inicial, o app pode ficar travado em estado de carregamento ou "authenticated: true" sem perfil.

### 4.5 Inconsistência de Paginação
- **Bug:** `useArtistAlbums` usa página baseada em 1, enquanto a lógica manual de `ArtistDetail` para tracks usa página baseada em 0.
- **Ajuste:** Padronizar todos os hooks de query e UI para usar base 1 (mais comum em APIs REST de paginação).

---

## Próximos Passos (Prioridade Atualizada)

1. **Prioridade 1:** Centralizar a extração de cores e injetar CSS vars no `AppShell`.
2. **Prioridade 2:** Implementar o `PlayerSync` para garantir que o estado do player reflita a realidade da conta do Spotify.
3. **Prioridade 3:** Corrigir a lógica de `formatDuration` e padronizar a paginação.
4. **Prioridade 4:** Corrigir o i18n e adicionar tratamento de erro no `AuthProvider`.
5. **Prioridade 5:** Implementar o Profile Popup e a Queue lateral.
