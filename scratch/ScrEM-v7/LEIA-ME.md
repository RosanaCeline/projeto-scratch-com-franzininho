# ScrEM — início da migração para React + JavaScript

Esta é a primeira etapa da migração para React + Vite. A aplicação já inicia por uma raiz React (`src/main.jsx` / `src/App.jsx`) e o jogo legado é montado dentro do componente `LegacyGame`.

## O que foi aproveitado

- O motor da Etapa 2 (`jogo.js`), preservado como `public/js/jogo-legado.js`.
- O estado separado da Etapa 1 (`estado.js`).
- Os estilos da Etapa 2, mantidos temporariamente em `src/styles/legacy.css`.
- As telas de navegação HTML/CSS da Etapa 2 continuam funcionando por meio do motor atual.

## Arquivo de dados necessário

O `dados.js` original não estava disponível como arquivo nesta sessão. Copie-o sem alterações para:

`public/js/dados.js`

Ele deve declarar `CONFIG`, `ASSUNTOS` e `MAPAS`, como no projeto original. O carregamento é sequencial: `dados.js` → `estado.js` → `jogo-legado.js`.

## Executar

Requer Node.js instalado.

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite (por padrão `http://localhost:5173`).

Para verificar a compilação de produção:

```bash
npm run build
```

## Estrutura

```text
src/
  App.jsx
  main.jsx
  components/
    LegacyGame.jsx
  styles/
    app.css
    legacy.css
public/
  js/
    dados.js                 # copiar do projeto original
    estado.js                # estado separado na Etapa 1
    jogo-legado.js            # motor da Etapa 2, temporário
```

## Limite desta etapa

React já controla a aplicação e o ciclo de carregamento do jogo, mas as telas de menu ainda são produzidas pelo código legado usando DOM. O Canvas continua responsável pela partida e pela tela de resultado. Isso é intencional: primeiro estabelecemos uma base React executável, depois migramos os menus para componentes React e, por último, o tabuleiro e a renderização da partida.

Não apague `jogo-legado.js` até a migração das regras e da partida estar concluída e validada.
