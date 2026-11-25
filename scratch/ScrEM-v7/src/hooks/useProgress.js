import { useCallback, useEffect, useMemo, useState } from 'react';

import { MAPAS } from '../data/maps.js';
import {
  carregarProgresso,
  salvarProgresso,
  registrarEstrela
} from '../services/storage.js';

export default function useProgress() {
  const [dados, setDados] = useState(() => carregarProgresso());

  const { progresso, som } = dados;

  // Salva o progresso e a configuração de som sempre que mudarem.
  useEffect(() => {
    salvarProgresso(progresso, som);
  }, [progresso, som]);

  // Alterna o som do jogo.
  const alternarSom = useCallback(() => {
    setDados(atual => ({
      ...atual,
      som: !atual.som
    }));
  }, []);

  // Registra a quantidade de estrelas conquistadas em uma missão.
  const salvarEstrelas = useCallback((mapa, indiceMissao, estrelas) => {
    setDados(atual => ({
      ...atual,
      progresso: registrarEstrela(
        atual.progresso,
        mapa,
        indiceMissao,
        estrelas
      )
    }));
  }, []);

  // Atualiza os dados de progresso de um mapa.
  const atualizarMapa = useCallback((mapaId, atualizacao) => {
    setDados(atual => ({
      ...atual,
      progresso: {
        ...atual.progresso,
        [mapaId]: {
          concluido: false,
          estrelas: [],
          tentativas: 0,
          ...atual.progresso[mapaId],
          ...atualizacao
        }
      }
    }));
  }, []);

  // Estatísticas gerais do jogador.
  const resumo = useMemo(() => {
    const mapasConcluidos = MAPAS.filter(
      mapa => progresso[mapa.id]?.concluido
    ).length;

    const estrelas = MAPAS.reduce((total, mapa) => {
      const estrelasMapa = progresso[mapa.id]?.estrelas || [];
      return total + estrelasMapa.reduce((soma, valor) => soma + (valor || 0), 0);
    }, 0);

    return {
      mapasConcluidos,
      totalMapas: MAPAS.length,
      estrelas,
      maxEstrelas: MAPAS.reduce(
        (total, mapa) => total + mapa.missoes.length * 3,
        0
      )
    };
  }, [progresso]);

  return {
    progresso,
    som,
    resumo,
    alternarSom,
    salvarEstrelas,
    atualizarMapa
  };
}
