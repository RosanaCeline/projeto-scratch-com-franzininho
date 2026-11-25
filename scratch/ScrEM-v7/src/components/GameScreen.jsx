import { useEffect, useMemo, useState } from 'react';

const DIRECOES = {
  cima: { simbolo: '↑', nome: 'Cima' },
  baixo: { simbolo: '↓', nome: 'Baixo' },
  esquerda: { simbolo: '←', nome: 'Esquerda' },
  direita: { simbolo: '→', nome: 'Direita' },
};

const TERRENOS = [
  { tipo: 'v', nome: 'Vermelho', regra: 'Perde o passo: fica parado.' },
  { tipo: 'a', nome: 'Azul', regra: 'Água: escorrega uma casa a mais.' },
  { tipo: 'y', nome: 'Amarelo', regra: 'Choque: custa passos extras.' },
  { tipo: 'g', nome: 'Verde', regra: 'Atalho: leva ao outro verde.' },
];

const ROBO = [
  '....rr....', '....oo....', '..oooooo..', '.oyyyyyyo.', '.owwwwwwo.',
  '.owewwewo.', '.ocwoowco.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..',
];
const CORES_ROBO = { o: '#0d0d6b', y: '#ffd23f', w: '#e8f6ff', e: '#0d0d6b', c: '#ff6fa0', r: '#e5484d', s: '#e0a800', g: '#6b6f9c' };

function PixelRobot({ direction, humor }) {
  const espelhar = direction === 'esquerda';
  const linhas = direction === 'cima'
    ? ['....rr....', '....oo....', '..oooooo..', '.oyyyyyyo.', '.oyssssyo.', '.oyyyyyyo.', '.oyssssyo.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..']
    : (direction === 'direita' || direction === 'esquerda')
      ? ['...rr.....', '...oo.....', '..oooooo..', '.oyyyyyyo.', '.oyywwwwo.', '.oyywewwo.', '.oyyyyyyo.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..']
      : ROBO;
  return (
    <span className={`scr-game-robot-art ${humor === 'triste' ? 'sad' : ''}`} aria-hidden="true">
      {linhas.flatMap((linha, r) => [...linha].map((pixel, c) => (
        <i key={`${r}-${c}`} style={{ '--pixel': pixel === '.' ? 'transparent' : CORES_ROBO[pixel], gridRow: r + 1, gridColumn: espelhar ? 10 - c : c + 1 }} />
      )))}
    </span>
  );
}

function caminhoSvg(partida) {
  const n = Math.sqrt(partida.celulas.length);
  const centro = (indice) => ({ x: ((indice % n) + 0.5) * 100 / n, y: (Math.floor(indice / n) + 0.5) * 100 / n });
  const pontos = [centro(partida.inicio)];
  partida.passos.forEach((passo) => {
    if (passo.ev !== 'bloqueio') pontos.push(centro(passo.para));
  });
  return pontos.map((p) => `${p.x},${p.y}`).join(' ');
}

function corEvento(evento) {
  if (evento === 'bloqueio' || evento === 'perdeu') return '#e5484d';
  if (evento?.includes('agua')) return '#2a7fd4';
  if (evento?.includes('choque')) return '#e0a800';
  return '#1f9d61';
}

export default function GameScreen() {
  const [snapshot, setSnapshot] = useState(() => window.ScrEMAPI?.getSnapshot() ?? null);
  useEffect(() => {
    if (!window.ScrEMAPI) return undefined;
    return window.ScrEMAPI.subscribe(setSnapshot);
  }, []);

  const partida = snapshot?.partida;
  const pontos = useMemo(() => partida ? caminhoSvg(partida) : '', [partida]);
  if (snapshot?.tela !== 'jogo' || !partida) return null;

  const n = Math.sqrt(partida.celulas.length);
  const posicao = partida.posicao ?? partida.inicio;
  const comandosBloqueados = partida.ocupado;
  const indiceAtual = partida.exec ? partida.exec.indice - 1 : -1;
  const custo = partida.exec ? partida.exec.custo : partida.custoPrevisto;

  return (
    <main className="scr-game" aria-label="Partida ScrEM">
      <header className="scr-game-header">
        <button className="scr-button secondary" type="button" onClick={() => window.ScrEMAPI?.sair()}>Sair</button>
        <div className="scr-game-progress">
          <strong>Missão {Math.min(partida.acertos + 1, partida.mapa.concluir)} de {partida.mapa.concluir}</strong>
          <span>{partida.mapa.nome}</span>
          <div className="scr-game-dots" aria-label={`${partida.acertos} missões concluídas`}>
            {Array.from({ length: partida.mapa.concluir }, (_, i) => <i key={i} className={i < partida.acertos ? 'done' : ''} />)}
          </div>
        </div>
        {partida.streak >= 2 && <span className="scr-game-streak">Sequência ×{partida.streak}</span>}
        <div className="scr-game-header-actions">
          <button className="scr-button secondary" type="button" onClick={() => window.ScrEMAPI?.alternarSom()}>{snapshot.som ? 'Som ✓' : 'Som ✕'}</button>
          <button className="scr-button secondary" type="button" onClick={() => window.ScrEMAPI?.telaCheia()}>Tela cheia</button>
        </div>
      </header>

      <section className="scr-game-mission">
        <div className="scr-game-mission-meta">
          <span style={{ background: partida.assunto.cor }}>{partida.assunto.nome}</span>
          <small>Tentativas: {partida.tentativas}</small>
        </div>
        <h1>{partida.missao.texto}</h1>
        {partida.dicaMostrada && <p className="scr-game-hint">Dica: {partida.missao.dica}</p>}
        {!partida.dicaMostrada && partida.errosSeguidos >= partida.limiteErrosDica && !partida.ocupado && (
          <button className="scr-button ghost" type="button" onClick={() => window.ScrEMAPI?.mostrarDica()}>Ver dica (H)</button>
        )}
      </section>

      <div className="scr-game-layout">
        <section className="scr-game-board-card" aria-label="Tabuleiro">
          <div className="scr-game-board" style={{ '--grid-size': n }}>
            <div className="scr-game-cells">
              {partida.celulas.map((celula) => (
                <div
                  key={celula.indice}
                  className={`scr-game-cell terrain-${celula.tipo} ${celula.visitada ? 'visited' : ''} ${celula.alvo ? 'target' : ''}`}
                  aria-label={`Casa ${celula.indice + 1}${celula.inicio ? ', início' : ''}${celula.rotulo ? `, ${celula.rotulo}` : ''}${celula.tipo === 'o' ? ', obstáculo' : ''}`}
                >
                  {celula.rotulo && <span>{celula.rotulo}</span>}
                  {celula.inicio && <small>INÍCIO</small>}
                </div>
              ))}
            </div>
            {partida.passos.length > 0 && (
              <svg className="scr-game-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={pontos} />
                {partida.passos.map((passo, i) => {
                  const c = passo.ev === 'bloqueio' ? passo.de : passo.para;
                  const x = ((c % n) + 0.5) * 100 / n;
                  const y = (Math.floor(c / n) + 0.5) * 100 / n;
                  return <g key={i}><circle cx={x} cy={y} r="1.45" style={{ fill: corEvento(passo.ev) }} /><text x={x} y={y - 2} textAnchor="middle">{i + 1}</text></g>;
                })}
              </svg>
            )}
            <div
              className="scr-game-robot-position"
              style={{ gridColumn: (posicao % n) + 1, gridRow: Math.floor(posicao / n) + 1 }}
            >
              <PixelRobot direction={partida.direcao} humor={partida.humor} />
            </div>
          </div>
          <p className={`scr-game-board-info ${partida.bloqueio >= 0 ? 'warning' : ''}`}>
            {!partida.sequencia.length
              ? 'Monte o caminho com as setas: a trilha aparece aqui.'
              : partida.bloqueio >= 0
                ? `Atenção: o caminho bate num obstáculo no comando ${partida.bloqueio + 1}.`
                : `Custo previsto: ${partida.custoPrevisto} de ${partida.mapa.limite} passos`}
          </p>
        </section>

        <aside className="scr-game-sidebar">
          <section className="scr-game-panel scr-game-commands">
            <div className="scr-game-panel-heading">
              <h2>Seu caminho</h2>
              <span>Comandos {partida.sequencia.length}/{partida.maxComandos} · Passos {custo}/{partida.mapa.limite}</span>
            </div>
            {partida.sequencia.length === 0 ? (
              <p className="scr-game-empty-commands">Use as setas para montar o caminho.</p>
            ) : (
              <div className="scr-game-command-list">
                {partida.sequencia.map((direcao, i) => (
                  <span key={`${direcao}-${i}`} className={`${i === indiceAtual ? 'current' : ''} ${partida.exec && i < indiceAtual ? 'executed' : ''}`}>
                    {DIRECOES[direcao].simbolo}
                    {partida.passos[i]?.ev && <i style={{ background: corEvento(partida.passos[i].ev) }} />}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="scr-game-panel scr-game-legend">
            <h2>Cores do caminho</h2>
            <div className="scr-game-legend-grid">
              {TERRENOS.map((terreno) => <div className="scr-game-legend-item" key={terreno.tipo}>
                <span className={`scr-game-legend-swatch terrain-${terreno.tipo}`} />
                <div><strong>{terreno.nome}</strong><small>{terreno.regra.replace('passos extras', `${snapshot.custoChoque} passos extras`)}</small></div>
              </div>)}
            </div>
            <p className="scr-game-obstacle-note"><span className="scr-game-legend-swatch terrain-o" /> Cinza com tijolos: obstáculo, não pode passar.</p>
          </section>

          <section className="scr-game-panel scr-game-controls">
            <div className="scr-game-direction-pad">
              <button type="button" aria-label="Mover para cima" disabled={comandosBloqueados} onClick={() => window.ScrEMAPI?.adicionarMovimento('cima')}>↑</button>
              <button type="button" aria-label="Mover para esquerda" disabled={comandosBloqueados} onClick={() => window.ScrEMAPI?.adicionarMovimento('esquerda')}>←</button>
              <button type="button" aria-label="Mover para baixo" disabled={comandosBloqueados} onClick={() => window.ScrEMAPI?.adicionarMovimento('baixo')}>↓</button>
              <button type="button" aria-label="Mover para direita" disabled={comandosBloqueados} onClick={() => window.ScrEMAPI?.adicionarMovimento('direita')}>→</button>
            </div>
            <div className="scr-game-action-buttons">
              <button className="scr-button" type="button" disabled={comandosBloqueados || !partida.sequencia.length} onClick={() => window.ScrEMAPI?.executar()}>Executar (Enter)</button>
              <button className="scr-button secondary" type="button" disabled={comandosBloqueados || !partida.sequencia.length} onClick={() => window.ScrEMAPI?.apagarComando()}>Desfazer (⌫)</button>
              <button className="scr-button secondary" type="button" disabled={comandosBloqueados || !partida.sequencia.length} onClick={() => window.ScrEMAPI?.limparComandos()}>Limpar (Del)</button>
            </div>
          </section>
        </aside>
      </div>

      {partida.toast && <div className="scr-game-toast" role="status">{partida.toast}</div>}
      {partida.modal && <div className="scr-game-modal-backdrop">
        <section className="scr-game-modal" role="dialog" aria-modal="true" aria-labelledby="scr-game-modal-title">
          <div className={`scr-game-modal-mark ${partida.modal.tipo === 'erro' ? 'error' : ''}`}>{partida.modal.tipo === 'erro' ? '!' : '✓'}</div>
          <h2 id="scr-game-modal-title">{partida.modal.titulo}</h2>
          <p>{partida.modal.texto}</p>
          <div className="scr-game-modal-actions">
            {partida.modal.botoes.map((botao) => <button
              key={botao.id}
              className={`scr-button ${botao.estilo === 'primario' ? '' : 'secondary'}`}
              type="button"
              onClick={() => window.ScrEMAPI?.ativarBotaoModal(botao.id)}
            >{botao.rotulo}</button>)}
          </div>
        </section>
      </div>}
    </main>
  );
}
