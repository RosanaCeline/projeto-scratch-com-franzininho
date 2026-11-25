import { useEffect, useMemo, useRef, useState } from 'react';

import { ASSUNTOS } from '../data/subjects.js';
import { MAX_CMD, CUSTO_CHOQUE } from '../game/constants.js';
import { simular } from '../game/movement.js';

import useNavigationArduino from '../hooks/useNavigationArduino.js';

/* =========================================================
   Constantes visuais (iguais às do canvas legado)
========================================================= */

const NAVY = '#0d0d6b';
const VERMELHO = '#e5484d';
const VERDE = '#1f9d61';
const AZUL = '#4aa8ff';
const AZUL_TRILHA = '#2a7fd4';
const AMARELO_SOMBRA = '#e0a800';

const DIRECOES = {
  cima: '↑',
  baixo: '↓',
  esquerda: '←',
  direita: '→'
};

const TERRENOS = [
  { tipo: 'v', nome: 'Vermelho', regra: 'Perde o passo: fica parado.' },
  { tipo: 'a', nome: 'Azul', regra: 'Água: escorrega uma casa a mais.' },
  { tipo: 'y', nome: 'Amarelo', regra: `Choque: custa ${CUSTO_CHOQUE} passos extras.` },
  { tipo: 'g', nome: 'Verde', regra: 'Atalho: leva ao outro verde.' }
];

// Cada linha tem 10 colunas. o contorno, y corpo, w tela, e olhos,
// c bochecha, r antena, s sombra do corpo, g pernas.
const ROBO_FRENTE = [
  '....rr....', '....oo....', '..oooooo..', '.oyyyyyyo.', '.owwwwwwo.',
  '.owewwewo.', '.ocwoowco.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..'
];
const ROBO_COSTAS = [
  '....rr....', '....oo....', '..oooooo..', '.oyyyyyyo.', '.oyssssyo.',
  '.oyyyyyyo.', '.oyssssyo.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..'
];
const ROBO_LADO = [
  '...rr.....', '...oo.....', '..oooooo..', '.oyyyyyyo.', '.oyywwwwo.',
  '.oyywewwo.', '.oyyyyyyo.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..'
];

const CORES_ROBO = {
  o: NAVY,
  y: '#ffd23f',
  w: '#e8f6ff',
  e: NAVY,
  c: '#ff6fa0',
  r: VERMELHO,
  s: AMARELO_SOMBRA,
  g: '#6b6f9c'
};

/* =========================================================
   Robô pixelado (SVG: pixels nítidos em qualquer tamanho)
========================================================= */

function PixelRobot({ direction, humor, andando, className = '' }) {
  const espelhar = direction === 'esquerda';

  const sprite = direction === 'cima'
    ? ROBO_COSTAS
    : direction === 'direita' || direction === 'esquerda'
      ? ROBO_LADO
      : ROBO_FRENTE;

  const pixels = [];

  sprite.forEach((linha, r) => {
    [...linha].forEach((ch, c) => {
      if (ch === '.') return;

      pixels.push(
        <rect
          key={`${r}-${c}`}
          x={c}
          y={r}
          width="1"
          height="1"
          fill={CORES_ROBO[ch]}
        />
      );
    });
  });

  return (
    <svg
      className={`scr-game-robot-art ${andando ? 'walking' : ''} ${className}`}
      viewBox="0 0 10 11"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* sombra no chão */}
      <ellipse cx="5" cy="11.3" rx="3.4" ry="0.6" fill="rgba(13,13,107,0.18)" />

      <g transform={espelhar ? 'translate(10 0) scale(-1 1)' : undefined}>
        {pixels}
      </g>

      {/* lágrima quando está triste */}
      {humor === 'triste' && (
        <rect x="9" y="1" width="1" height="2" fill={AZUL} />
      )}
    </svg>
  );
}

/* =========================================================
   Geometria e cores da trilha
========================================================= */

// Mesma conta do canvas: espaço entre casas = 2% do lado do tabuleiro.
function geometriaGrade(n) {
  const gap = 2;
  const cel = (100 - gap * (n - 1)) / n;

  return {
    gap,
    cel,
    centro: indice => ({
      x: (indice % n) * (cel + gap) + cel / 2,
      y: Math.floor(indice / n) * (cel + gap) + cel / 2
    })
  };
}

// Os eventos vindos de movement.js são: perdeu, bloqueio, agua, agua_parada,
// choque, agua_choque, atalho (e combinações com _atalho).
const ehTeleporte = ev => Boolean(ev?.includes('atalho'));

// Cor da linha da trilha sobre o tabuleiro.
function corTrilha(ev) {
  if (ev === 'bloqueio' || ev === 'perdeu') return VERMELHO;
  if (ehTeleporte(ev)) return VERDE;
  if (ev?.includes('agua')) return AZUL_TRILHA;
  return NAVY;
}

// Cor da bolinha de evento nos chips de comando.
function corChip(ev) {
  if (ev === 'bloqueio' || ev === 'perdeu') return VERMELHO;
  if (ev?.includes('agua')) return AZUL;
  if (ev?.includes('choque')) return AMARELO_SOMBRA;
  return VERDE;
}

// Texto que sobe da casa quando o passo tem um efeito (igual ao canvas).
// "perdeu" aparece na casa de onde o robô saiu; os demais, na casa de chegada.
function textoFlutuante(passo) {
  const ev = passo?.ev;

  if (!ev || ev === 'bloqueio') return null;

  if (ev === 'perdeu') {
    return { cel: passo.de, texto: 'Perdeu o passo!', cor: VERMELHO };
  }

  if (ehTeleporte(ev)) {
    return { cel: passo.para, texto: 'Teletransporte!', cor: VERDE };
  }

  if (ev === 'agua_parada') {
    return { cel: passo.para, texto: 'Água: parou aqui', cor: AZUL_TRILHA };
  }

  if (ev === 'agua') {
    return { cel: passo.para, texto: 'Escorregou!', cor: AZUL_TRILHA };
  }

  if (ev === 'choque' || ev === 'agua_choque') {
    return { cel: passo.para, texto: `+${CUSTO_CHOQUE} passos!`, cor: '#b07d00' };
  }

  return null;
}

/* =========================================================
   Tela do jogo
========================================================= */

export default function GameScreen({
  tela,
  game,
  som,
  onAlternarSom,
  onTelaCheia
}) {
  const partida = game;

  const modalRef = useRef(null);
  useNavigationArduino(modalRef, Boolean(partida?.modal), partida?.modal?.tipo);

  useEffect(() => {
    function handleKeyDown(event) {
      if (tela !== 'jogo' || !partida) return;

      // Não intercepta teclas enquanto o usuário digita em um campo.
      const elemento = event.target;

      if (
        elemento instanceof HTMLElement &&
        (
          elemento.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName)
        )
      ) {
        return;
      }

      const tecla = event.key.toLowerCase();

      const direcoes = {
        arrowup: 'cima',
        arrowdown: 'baixo',
        arrowleft: 'esquerda',
        arrowright: 'direita',
        w: 'cima',
        s: 'baixo',
        a: 'esquerda',
        d: 'direita'
      };

      if (direcoes[tecla]) {
        event.preventDefault();

        if (partida.podeEditar) {
          partida.adicionarMovimento(direcoes[tecla]);
        }

        return;
      }

      if (tecla === 'enter') {
        if (partida.modal) return; // deixa o Enter ativar o botão do modal

        event.preventDefault();

        if (partida.podeEditar) {
          partida.executar();
        }

        return;
      }

      if (tecla === 'backspace') {
        event.preventDefault();

        if (partida.podeEditar) {
          partida.apagarComando();
        }

        return;
      }

      if (tecla === 'delete') {
        event.preventDefault();

        if (partida.podeEditar) {
          partida.limparComandos();
        }

        return;
      }

      if (tecla === 'h' && partida.podeEditar) {
        partida.mostrarDica();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    tela,
    partida?.podeEditar,
    partida?.adicionarMovimento,
    partida?.executar,
    partida?.apagarComando,
    partida?.limparComandos,
    partida?.mostrarDica
  ]);

  const simulacao = useMemo(() => {
    if (!partida?.layout || !partida.sequencia.length) return null;

    return simular(
      partida.layout,
      partida.sequencia,
      partida.alvos
    );
  }, [partida?.layout, partida?.sequencia, partida?.alvos]);

  // ---------- textos flutuantes ----------
  // Cada vez que a execução avança um passo, sobe um texto na casa do efeito.
  const [flutuantes, setFlutuantes] = useState([]);
  const contadorFlutuante = useRef(0);
  const indiceExec = partida?.exec?.indice;

  useEffect(() => {
    if (!partida?.exec || !indiceExec) return;

    const info = textoFlutuante(partida.exec.passos?.[indiceExec - 1]);

    if (!info) return;

    const id = ++contadorFlutuante.current;

    setFlutuantes(lista => [...lista, { id, ...info }]);

    // some depois da animação (1100 ms, igual ao canvas)
    setTimeout(() => {
      setFlutuantes(lista => lista.filter(item => item.id !== id));
    }, 1100);
  }, [indiceExec]);

  const passos = partida?.exec
    ? partida.exec.passos
    : simulacao?.passos || [];

  if (tela !== 'jogo' || !partida?.mapa || !partida.layout) {
    return null;
  }

  const { mapa, layout } = partida;

  const n = Math.sqrt(layout.rot.length);
  const geo = geometriaGrade(n);
  const posicao = partida.pos;
  const comandosBloqueados = partida.ocupado;
  const indiceAtual = partida.exec
    ? partida.exec.indice - 1
    : -1;

  const custo = partida.exec
    ? partida.exec.custo
    : simulacao?.custo || 0;

  const bloqueio = simulacao?.bloqueio ?? -1;

  // No teletransporte o robô aparece no destino sem deslizar (como no canvas).
  const passoAtual = partida.exec ? passos[indiceAtual] : null;
  const teleportando = Boolean(passoAtual && ehTeleporte(passoAtual.ev));

  const assunto = ASSUNTOS.find(
    item => item.id === mapa.assunto
  );

  const totalMissoes = mapa.concluir || mapa.missoes.length;

  const modal = partida.modal;

  function fecharModal() {
    partida.setModal(null);
  }

  function acaoModal() {
    if (modal?.tipo === 'sucesso') {
      partida.proximaMissao();
      return;
    }

    fecharModal();
  }

  const celulas = layout.rot.map((rotulo, indice) => {
    const inicio = indice === layout.inicio;

    return {
      indice,
      rotulo,
      inicio,
      alvo: partida.alvos.includes(indice),
      visitada: !inicio && partida.visitas.includes(indice),
      tipo: layout.obst[indice] ? 'o' : layout.tipo[indice]
    };
  });

  const modalHumor = modal?.tipo === 'erro'
    ? 'triste'
    : modal?.tipo === 'sucesso'
      ? 'feliz'
      : 'normal';

  const modalTitulo = modal?.titulo || (
    modal?.tipo === 'erro'
      ? 'Não foi dessa vez'
      : modal?.tipo === 'dica'
        ? 'Dica'
        : 'Muito bem!'
  );

  const modalBotao = modal?.tipo === 'sucesso'
    ? 'Próxima missão'
    : modal?.tipo === 'erro'
      ? 'Tentar de novo'
      : 'Continuar';

  return (
    <main className="scr-game" aria-label="Partida ScrEM">
      <header className="scr-game-header">
        <button
          className="scr-button secondary"
          type="button"
          onClick={partida.sair}
        >
          Sair
        </button>

        <div className="scr-game-progress">
          <div className="scr-game-progress-text">
            <strong>
              Missão {Math.min(partida.acertos + 1, totalMissoes)} de {totalMissoes}
            </strong>

            <span>{mapa.nome}</span>
          </div>

          <div
            className="scr-game-dots"
            aria-label={`${partida.acertos} missões concluídas`}
          >
            {Array.from({ length: totalMissoes }, (_, i) => (
              <i key={i} className={i < partida.acertos ? 'done' : ''} />
            ))}
          </div>

          {partida.streak >= 2 && (
            <span className="scr-game-streak">
              Sequência ×{partida.streak}
            </span>
          )}
        </div>

        <div className="scr-game-header-actions">
          <button
            className="scr-button secondary"
            type="button"
            onClick={onAlternarSom}
          >
            {som ? 'Som ✓' : 'Som ✕'}
          </button>

          <button
            className="scr-button secondary"
            type="button"
            onClick={onTelaCheia}
          >
            Tela cheia
          </button>
        </div>
      </header>

      <section className="scr-game-mission">
        <div className="scr-game-mission-meta">
          <span style={{ background: assunto?.cor || NAVY }}>
            {assunto?.nome || 'Matemática'}
          </span>

          <small>Tentativas: {partida.tentativasMissao}</small>
        </div>

        <h1>{partida.missao?.texto}</h1>

        {partida.dicaMostrada && (
          <p className="scr-game-hint">
            Dica: {partida.missao?.dica}
          </p>
        )}

        {!partida.dicaMostrada &&
          partida.errosSeguidos >= 3 &&
          !partida.ocupado && (
            <button
              className="scr-button highlight"
              type="button"
              onClick={partida.mostrarDica}
            >
              Ver dica (H)
            </button>
          )}
      </section>

      <div className="scr-game-layout">
        <section className="scr-game-board-card" aria-label="Tabuleiro">
          <div
            className="scr-game-board"
            style={{
              '--grid-size': n,
              // Tamanho de uma casa (em cqw = % da largura do tabuleiro).
              // Fontes e bordas das casas são proporcionais a ele, como no canvas.
              '--cel': `${geo.cel}cqw`
            }}
          >
            <div className="scr-game-cells">
              {celulas.map(celula => (
                <div
                  key={celula.indice}
                  className={`scr-game-cell terrain-${celula.tipo} ${
                    celula.visitada ? 'visited' : ''
                  } ${celula.alvo ? 'target' : ''}`}
                  aria-label={`Casa ${celula.indice + 1}${
                    celula.inicio ? ', início' : ''
                  }${celula.rotulo ? `, ${celula.rotulo}` : ''}${
                    celula.tipo === 'o' ? ', obstáculo' : ''
                  }`}
                >
                  {celula.rotulo && (
                    <span
                      style={{
                        // rótulos longos encolhem para caber na casa
                        '--fit': Math.min(1, 3.9 / String(celula.rotulo).length)
                      }}
                    >
                      {celula.rotulo}
                    </span>
                  )}

                  {celula.inicio && <small>INÍCIO</small>}
                </div>
              ))}
            </div>

            {passos.length > 0 && (
              <svg
                className="scr-game-path"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {passos.map((passo, i) => {
                  const deIndice = passo.de ?? (i === 0 ? layout.inicio : passos[i - 1].para);
                  const paraIndice = passo.para ?? deIndice;

                  const origem = geo.centro(deIndice);
                  const destino = geo.centro(paraIndice);

                  const bloqueado = passo.ev === 'bloqueio';
                  const parado = paraIndice === deIndice;
                  const teleporte = ehTeleporte(passo.ev);
                  const cor = corTrilha(passo.ev);

                  if (bloqueado) {
                    return (
                      <circle
                        key={i}
                        cx={origem.x}
                        cy={origem.y}
                        r={geo.cel * 0.44}
                        fill="none"
                        stroke={VERMELHO}
                        strokeWidth={geo.cel * 0.07}
                      />
                    );
                  }

                  return (
                    <g key={i}>
                      {parado ? (
                        <circle
                          cx={destino.x}
                          cy={destino.y}
                          r={geo.cel * 0.42}
                          fill="none"
                          stroke={VERMELHO}
                          strokeWidth={geo.cel * 0.06}
                          opacity=".6"
                        />
                      ) : (
                        <>
                          <line
                            x1={origem.x}
                            y1={origem.y}
                            x2={destino.x}
                            y2={destino.y}
                            stroke={cor}
                            strokeWidth={geo.cel * 0.06}
                            strokeLinecap="round"
                            strokeDasharray={
                              teleporte
                                ? `${geo.cel * 0.09} ${geo.cel * 0.07}`
                                : undefined
                            }
                            opacity=".6"
                          />

                          {/* bolinha numerada no canto superior esquerdo da casa */}
                          <circle
                            cx={destino.x - geo.cel * 0.3}
                            cy={destino.y - geo.cel * 0.3}
                            r={geo.cel * 0.12}
                            fill={cor}
                          />

                          <text
                            x={destino.x - geo.cel * 0.3}
                            y={destino.y - geo.cel * 0.3}
                            fontSize={geo.cel * 0.15}
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {i + 1}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}

            {/* O robô ocupa exatamente uma casa e desliza entre elas. */}
            <div
              className={`scr-game-robot-position ${teleportando ? 'instant' : ''}`}
              style={{
                left: `${(posicao % n) * (geo.cel + geo.gap)}%`,
                top: `${Math.floor(posicao / n) * (geo.cel + geo.gap)}%`,
                width: `${geo.cel}%`,
                height: `${geo.cel}%`
              }}
            >
              <PixelRobot
                direction={partida.dirVis}
                humor={partida.humor}
                andando={Boolean(partida.exec)}
              />
            </div>

            {/* textos flutuantes: "Escorregou!", "+3 passos!", etc. */}
            {flutuantes.map(item => (
              <div
                key={item.id}
                className="scr-game-float"
                style={{
                  left: `${(item.cel % n) * (geo.cel + geo.gap)}%`,
                  top: `${Math.floor(item.cel / n) * (geo.cel + geo.gap)}%`,
                  width: `${geo.cel}%`,
                  height: `${geo.cel}%`
                }}
              >
                <span style={{ color: item.cor }}>{item.texto}</span>
              </div>
            ))}
          </div>

          <p className="scr-game-board-info">
            {!partida.sequencia.length
              ? 'Monte o caminho com as setas: a trilha aparece aqui.'
              : bloqueio >= 0
                ? `Atenção: o caminho bate num obstáculo no comando ${bloqueio + 1}.`
                : `Custo previsto: ${simulacao?.custo || 0} de ${mapa.limite} passos`}
          </p>
        </section>

        <aside className="scr-game-sidebar">
          <section className="scr-game-panel scr-game-commands">
            <div className="scr-game-panel-heading">
              <h2>Seu caminho</h2>

              <span>
                Comandos {partida.sequencia.length}/{MAX_CMD}
                {'  ·  '}
                Passos {custo}/{mapa.limite}
              </span>
            </div>

            {partida.sequencia.length === 0 ? (
              <p className="scr-game-empty-commands">
                Use as setas para montar o caminho.
              </p>
            ) : (
              <div className="scr-game-command-list">
                {partida.sequencia.map((direcao, i) => (
                  <span
                    key={`${direcao}-${i}`}
                    className={`${
                      i === indiceAtual ? 'current' : ''
                    } ${
                      partida.exec && i < indiceAtual ? 'executed' : ''
                    }`}
                  >
                    {DIRECOES[direcao]}

                    {passos[i]?.ev && (
                      <i style={{ background: corChip(passos[i].ev) }} />
                    )}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="scr-game-panel scr-game-legend">
            <h2>Cores do caminho</h2>

            <div className="scr-game-legend-grid">
              {TERRENOS.map(terreno => (
                <div className="scr-game-legend-item" key={terreno.tipo}>
                  <span className={`scr-game-legend-swatch terrain-${terreno.tipo}`} />

                  <div>
                    <strong>{terreno.nome}</strong>
                    <small>{terreno.regra}</small>
                  </div>
                </div>
              ))}
            </div>

            <p className="scr-game-obstacle-note">
              Cinza com tijolos: obstáculo, não pode passar.
            </p>
          </section>

          <section className="scr-game-panel scr-game-controls">
            <div className="scr-game-direction-pad">
              <button
                type="button"
                aria-label="Mover para cima"
                disabled={comandosBloqueados}
                onClick={() => partida.adicionarMovimento('cima')}
              >
                ↑
              </button>

              <button
                type="button"
                aria-label="Mover para esquerda"
                disabled={comandosBloqueados}
                onClick={() => partida.adicionarMovimento('esquerda')}
              >
                ←
              </button>

              <button
                type="button"
                aria-label="Mover para baixo"
                disabled={comandosBloqueados}
                onClick={() => partida.adicionarMovimento('baixo')}
              >
                ↓
              </button>

              <button
                type="button"
                aria-label="Mover para direita"
                disabled={comandosBloqueados}
                onClick={() => partida.adicionarMovimento('direita')}
              >
                →
              </button>
            </div>

            <div className="scr-game-action-buttons">
              <button
                className="scr-button highlight"
                type="button"
                disabled={comandosBloqueados || !partida.sequencia.length}
                onClick={partida.executar}
              >
                Executar (Enter)
              </button>

              <button
                className="scr-button secondary"
                type="button"
                disabled={comandosBloqueados || !partida.sequencia.length}
                onClick={partida.apagarComando}
              >
                Desfazer (⌫)
              </button>

              <button
                className="scr-button secondary"
                type="button"
                disabled={comandosBloqueados || !partida.sequencia.length}
                onClick={partida.limparComandos}
              >
                Limpar (Del)
              </button>
            </div>
          </section>
        </aside>
      </div>

      {partida.toast && (
        <div className="scr-game-toast" role="status">
          {partida.toast}
        </div>
      )}

      {modal && (
        <div className="scr-game-modal-backdrop">
          <section
            ref={modalRef}
            className="scr-game-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scr-game-modal-title"
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
              }
            }}
          >
            <PixelRobot
              direction="baixo"
              humor={modalHumor}
              andando={false}
              className="scr-game-modal-robot"
            />

            <h2 id="scr-game-modal-title">{modalTitulo}</h2>

            <p>{modal.texto}</p>

            {modal.tipo === 'sucesso' && (
              <p>
                {'★'.repeat(modal.estrelas || 0)}
                {'☆'.repeat(Math.max(0, 3 - (modal.estrelas || 0)))}
                {'  ·  '}
                {modal.custo} passos
              </p>
            )}

            <div className="scr-game-modal-actions">
              <button
                className="scr-button"
                type="button"
                onClick={acaoModal}
              >
                {modalBotao}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}