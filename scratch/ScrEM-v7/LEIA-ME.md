# ScrEM — migração React + JavaScript

## Etapa 4: tela Assuntos como componente React

A tela Assuntos foi migrada para `src/components/SubjectsScreen.jsx`. Os cartões são renderizados pelo React e recebem do motor os dados dos assuntos, o progresso dos mapas e as estrelas. Ao selecionar um assunto, o componente chama `ScrEMAPI.selecionarAssunto(indice)`, mantendo a navegação e as regras no motor original.

As telas Início e Como jogar continuam migradas em seus componentes React. O motor legado não gera mais HTML para essas três telas; Mapas ainda permanece temporariamente no menu legado.

### Etapas anteriores: tela inicial e Como jogar

A tela inicial foi migrada para `src/components/HomeScreen.jsx`. Sua estrutura, botões e prévia do tabuleiro agora são renderizados pelo React, usando as classes e os estilos visuais que já existiam no projeto.

### O que foi preservado

- Texto, hierarquia visual, cores, cartões, botões e prévia 5×5 da tela inicial.
- Indicadores de mapas concluídos e estrelas, calculados pelo motor original.
- Botões Começar, Como jogar, Som e Tela cheia.
- Atalhos de teclado existentes.
- Persistência do progresso e das preferências no `localStorage`.
- O motor legado continua responsável pelas regras e pelas demais telas ainda não migradas.

### Integração React ↔ motor legado

`public/js/jogo-legado.js` expõe uma ponte temporária em `window.ScrEMAPI`. Ela oferece um snapshot do estado da navegação, dos assuntos e do progresso, uma inscrição para receber atualizações e ações de navegação, seleção de assunto, som e tela cheia. O React não altera diretamente as regras nem o objeto interno do jogo.

### Arquivos principais alterados

- `src/components/HomeScreen.jsx` — componente da tela inicial e prévia do tabuleiro.
- `src/App.jsx` — monta a tela inicial React junto do motor legado.
- `src/components/LegacyGame.jsx` — informa ao React quando o motor terminou de carregar.
- `src/styles/legacy.css` — reaproveita os estilos existentes e posiciona a tela React.
- `public/js/jogo-legado.js` — fornece os dados de progresso à interface React e deixa de gerar o HTML das telas já migradas.

## Arquivo de dados necessário

O `dados.js` original não está incluído neste pacote. Copie-o, sem alterações, para:

`public/js/dados.js`

Ele deve declarar `CONFIG`, `ASSUNTOS` e `MAPAS`. A ordem de carregamento é `dados.js` → `estado.js` → `jogo-legado.js`.

## Executar

Requer Node.js instalado.

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite (normalmente `http://localhost:5173`).

Para verificar a compilação de produção:

```bash
npm run build
```

## O que ainda não foi migrado

- Mapas continua renderizado pelo menu legado.
- O tabuleiro, o robô durante a missão e a tela de resultado continuam no Canvas.
- As regras, animações da partida e persistência continuam no motor original.

Não remova `public/js/jogo-legado.js` enquanto essas partes ainda dependerem dele.
