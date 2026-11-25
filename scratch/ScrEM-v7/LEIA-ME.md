# ScrEM — migração React + JavaScript

## Etapa 6: tabuleiro e interface da partida em React

O tabuleiro e a interface usada durante a partida foram migrados para `src/components/GameScreen.jsx`. O React agora renderiza a grade, as casas coloridas e obstáculos, os rótulos, o personagem, a trilha de comandos, o painel de comandos, a legenda das cores, os controles, as mensagens e os modais de acerto/erro.

O Canvas deixa de desenhar a tela da partida (`tela === 'jogo'`). O motor legado continua ativo, mas fica responsável pelas regras, sorteio do tabuleiro, simulação do caminho, validação das respostas, execução temporizada, pontuação, progresso e persistência. A tela de resultado (`fim`) ainda permanece no Canvas nesta etapa.

### Integração React ↔ motor legado

`window.ScrEMAPI` agora também expõe os dados da missão e do tabuleiro em um snapshot, além de ações para adicionar/remover/limpar comandos, executar a sequência, mostrar dica, sair da partida e acionar os botões dos modais. O React não modifica diretamente o estado interno nem reimplementa as regras.

Os atalhos de teclado existentes continuam sendo tratados pelo motor: setas/WASD para montar o caminho, Enter para executar, Backspace para desfazer, Delete/C para limpar, H para dica, Escape para sair, M para som e F para tela cheia.

### Etapas anteriores

- Início: `src/components/HomeScreen.jsx`.
- Como jogar: `src/components/HowToPlayScreen.jsx`.
- Assuntos: `src/components/SubjectsScreen.jsx`.
- Mapas: `src/components/MapsScreen.jsx`.

### Arquivos principais alterados nesta etapa

- `src/components/GameScreen.jsx` — interface da partida e tabuleiro em React.
- `src/App.jsx` — monta o componente da partida.
- `src/styles/legacy.css` — estilos responsivos do tabuleiro e dos painéis.
- `public/js/jogo-legado.js` — snapshot da partida, ações públicas e desativação do desenho Canvas durante o jogo.
- `LEIA-ME.md` — documentação da migração.

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

- A tela de resultado (`fim`) e os efeitos visuais de confete continuam no Canvas.
- As regras, a simulação, a execução e a persistência continuam no motor original.
- O desenho antigo da tela de jogo ainda existe no arquivo legado, mas não é chamado enquanto a tela `jogo` é exibida pelo React.

Não remova `public/js/jogo-legado.js` enquanto essas partes ainda dependerem dele.
