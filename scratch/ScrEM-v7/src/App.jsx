import { useMemo, useState, useCallback, useRef } from 'react';

import HomeScreen from './components/HomeScreen.jsx';
import HowToPlayScreen from './components/HowToPlayScreen.jsx';
import SubjectsScreen from './components/SubjectsScreen.jsx';
import MapsScreen from './components/MapsScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import FinishScreen from './components/FinishScreen.jsx';

import { ASSUNTOS } from './data/subjects.js';
import { MAPAS } from './data/maps.js';
import { CONFIG } from './data/config.js';

import useNavigation from './hooks/useNavigation.js';
import useProgress from './hooks/useProgress.js';
import useGame from './hooks/useGame.js';
import useNavigationArduino from './hooks/useNavigationArduino.js';

import { progressoDe, estrelasMapa } from './game/mapUtils.js';

const CORES_NIVEL = {
  1: '#1f9d61',
  2: '#c98a00',
  3: '#d6455b'
};

export default function App() {
  // Navegação
  const {
    tela,
    irPara,
    voltar
  } = useNavigation();

  const raizRef = useRef(null);
  useNavigationArduino(raizRef, tela !== 'jogo', tela);

  const [assuntoSelecionado, setAssuntoSelecionado] = useState(0);

  // Progresso e som
  const {
    progresso,
    som,
    resumo,
    alternarSom,
    salvarEstrelas,
    atualizarMapa
  } = useProgress();

  // Lógica da partida
  const game = useGame({
    progresso,
    salvarEstrelas,
    atualizarMapa,
    irPara
  });

  // Assunto atualmente selecionado
  const assuntoAtual = ASSUNTOS[assuntoSelecionado];

  // Estatísticas dos assuntos
  const assuntos = useMemo(() => {
    return ASSUNTOS.map(assunto => {
      const mapasDoAssunto = MAPAS.filter(
        mapa => mapa.assunto === assunto.id
      );

      const mapasConcluidos = mapasDoAssunto.filter(
        mapa => progresso[mapa.id]?.concluido
      ).length;

      const estrelas = mapasDoAssunto.reduce(
        (total, mapa) => total + estrelasMapa(mapa, progresso),
        0
      );

      const maxEstrelas = mapasDoAssunto.reduce(
        (total, mapa) => total + mapa.missoes.length * 3,
        0
      );

      return {
        ...assunto,
        mapasConcluidos,
        totalMapas: mapasDoAssunto.length,
        estrelas,
        maxEstrelas,
        percentual: mapasDoAssunto.length
          ? (mapasConcluidos / mapasDoAssunto.length) * 100
          : 0
      };
    });
  }, [progresso]);

  // Mapas do assunto selecionado
  const mapas = useMemo(() => {
    return MAPAS
      .filter(mapa => mapa.assunto === assuntoAtual?.id)
      .map(mapa => {
        const dados = progressoDe(mapa, progresso);

        return {
          ...mapa,
          corNivel: CORES_NIVEL[mapa.nivel] || '#6b6f9c',
          concluido: dados.concluido,
          estrelas: estrelasMapa(mapa, progresso),
          maxEstrelas: mapa.missoes.length * 3,
          totalMissoes: mapa.missoes.length,
          missoesNecessarias: mapa.concluir || mapa.missoes.length
        };
      });
  }, [assuntoAtual, progresso]);

  // Seleciona um assunto e abre seus mapas.
  const selecionarAssunto = useCallback(indice => {
    setAssuntoSelecionado(indice);
    irPara('mapas');
  }, [irPara]);

  // Abre a tela de tela cheia.
  const telaCheia = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Inicia o próximo mapa disponível.
  const iniciarProximoMapa = useCallback(() => {
    if (!game.resultado?.proximo) return;

    const proximo = game.resultado.proximo;
    const indiceAssunto = ASSUNTOS.findIndex(
      assunto => assunto.id === proximo.assunto
    );

    if (indiceAssunto >= 0) {
      setAssuntoSelecionado(indiceAssunto);
    }

    game.iniciarMapa(proximo.id);
  }, [game.resultado, game.iniciarMapa]);

  return (
    <div ref={raizRef} style={{ display: 'contents' }}>
      <HomeScreen
        active={tela === 'inicio'}
        tela={tela}
        progresso={resumo}
        som={som}
        onIrPara={irPara}
        onAlternarSom={alternarSom}
        onTelaCheia={telaCheia}
      />

      <HowToPlayScreen
        tela={tela}
        custoChoque={CONFIG.custoChoque}
        onVoltar={() => voltar()}
        onComecar={() => irPara('assuntos')}
      />

      <SubjectsScreen
        tela={tela}
        assuntos={assuntos}
        onSelecionarAssunto={selecionarAssunto}
        onVoltar={() => voltar()}
      />

      <MapsScreen
        tela={tela}
        assunto={assuntoAtual}
        mapas={mapas}
        onIniciarMapa={game.iniciarMapa}
        onVoltar={() => voltar()}
      />

      <GameScreen
        tela={tela}
        game={game}
        som={som}
        onAlternarSom={alternarSom}
        onTelaCheia={telaCheia}
      />

      <FinishScreen
        tela={tela}
        resultado={game.resultado}
        onJogarNovamente={game.jogarNovamente}
        onProximo={iniciarProximoMapa}
        onEscolherMapa={() => irPara('mapas')}
        onInicio={game.sair}
      />
    </div>
  );
}
