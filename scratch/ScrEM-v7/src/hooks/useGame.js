import { useCallback, useEffect, useState } from 'react';

import { CONFIG } from '../data/config.js';
import { MAPAS } from '../data/maps.js';

import { MAX_CMD } from '../game/constants.js';
import { gerarLayout } from '../game/layout.js';
import { simular } from '../game/movement.js';
import { estrelasDe } from '../game/mapUtils.js';

export default function useGame({
  progresso,
  salvarEstrelas,
  atualizarMapa,
  irPara
}) {
  const [mapa, setMapa] = useState(null);
  const [layout, setLayout] = useState(null);
  const [missao, setMissao] = useState(null);
  const [missaoK, setMissaoK] = useState(0);
  const [banco, setBanco] = useState([]);

  const [acertos, setAcertos] = useState(0);
  const [tentativasMapa, setTentativasMapa] = useState(0);
  const [tentativasMissao, setTentativasMissao] = useState(0);
  const [errosSeguidos, setErrosSeguidos] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxSeq, setMaxSeq] = useState(0);

  const [sequencia, setSequencia] = useState([]);
  const [pos, setPos] = useState(0);
  const [visitas, setVisitas] = useState([]);
  const [custoExec, setCustoExec] = useState(0);

  const [sim, setSim] = useState(null);
  const [exec, setExec] = useState(null);

  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendente, setPendente] = useState(false);
  const [dicaMostrada, setDicaMostrada] = useState(false);

  const [humor, setHumor] = useState('normal');
  const [dirVis, setDirVis] = useState('baixo');

  const [resultado, setResultado] = useState(null);

  // Embaralha uma lista sem modificar a original.
  const embaralhar = useCallback(array => {
    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
  }, []);

  // Limpa os dados temporários da missão.
  const limparPartida = useCallback(() => {
    setSequencia([]);
    setPos(0);
    setVisitas([]);
    setCustoExec(0);
    setSim(null);
    setExec(null);
    setModal(null);
    setToast(null);
    setPendente(false);
    setDicaMostrada(false);
    setHumor('normal');
    setDirVis('baixo');
  }, []);

  // Sorteia uma missão do banco.
  const sortearMissao = useCallback((mapaAtual, bancoAtual = []) => {
    if (!mapaAtual) return;

    let novoBanco = [...bancoAtual];

    if (novoBanco.length === 0) {
      novoBanco = embaralhar(
        mapaAtual.missoes.map((_, indice) => indice)
      );
    }

    const [indice, ...restantes] = novoBanco;
    const novaMissao = mapaAtual.missoes[indice];
    const novoLayout = gerarLayout(mapaAtual, indice);

    if (!novoLayout) {
      console.error('Não foi possível gerar o tabuleiro:', mapaAtual.id);
      setToast('Não foi possível gerar esta missão. Tente novamente.');
      return;
    }

    setBanco(restantes);
    setMissaoK(indice);
    setMissao(novaMissao);
    setLayout(novoLayout);

    limparPartida();

    setPos(novoLayout.inicio);
    setVisitas([novoLayout.inicio]);
  }, [embaralhar, limparPartida]);

  // Inicia um mapa.
  const iniciarMapa = useCallback(mapaId => {
    const novoMapa = MAPAS.find(item => item.id === mapaId);

    if (!novoMapa) return;

    setMapa(novoMapa);
    setAcertos(0);
    setTentativasMapa(0);
    setTentativasMissao(0);
    setErrosSeguidos(0);
    setStreak(0);
    setMaxSeq(0);
    setResultado(null);

    const novoBanco = embaralhar(
      novoMapa.missoes.map((_, indice) => indice)
    );

    sortearMissao(novoMapa, novoBanco);

    irPara('jogo');
  }, [embaralhar, irPara, sortearMissao]);

  // Verifica se o jogador pode editar os comandos.
  const ocupado = Boolean(exec || modal || pendente);

  const podeEditar =
    Boolean(mapa && layout) &&
    !ocupado;

  // Adiciona um comando à sequência.
  const adicionarMovimento = useCallback(direcao => {
    if (!podeEditar) return;

    if (sequencia.length >= MAX_CMD) {
      setToast(`Limite de ${MAX_CMD} comandos atingido.`);
      return;
    }

    setSequencia(atual => [...atual, direcao]);
  }, [podeEditar, sequencia.length]);

  // Remove o último comando.
  const apagarComando = useCallback(() => {
    if (!podeEditar) return;

    setSequencia(atual => atual.slice(0, -1));
  }, [podeEditar]);

  // Limpa todos os comandos.
  const limparComandos = useCallback(() => {
    if (!podeEditar) return;

    setSequencia([]);
  }, [podeEditar]);

  // Exibe uma dica.
  const mostrarDica = useCallback(() => {
    if (!missao || ocupado) return;

    setDicaMostrada(true);
    setModal({
      tipo: 'dica',
      texto: missao.dica
    });
  }, [missao, ocupado]);

  // Localiza o próximo mapa ainda não concluído.
  const obterProximoMapa = useCallback(() => {
    return MAPAS.find(item =>
      item.id !== mapa?.id &&
      !progresso[item.id]?.concluido
    ) || null;
  }, [mapa, progresso]);

  // Finaliza o mapa.
  const concluirMapa = useCallback((estrelasUltima = 0, indiceUltima = -1) => {
    if (!mapa) return;

    const progressoAtual = progresso[mapa.id] || {};
    const tentativasAnteriores = progressoAtual.tentativas || 0;

    const tentativasRegistradas =
        (progressoAtual.tentativas || 0) + tentativasMapa;

    atualizarMapa(mapa.id, {
      concluido: true,
      tentativas: tentativasRegistradas
    });

    const estrelas = [
    ...(progresso[mapa.id]?.estrelas || [])
    ];

    if (indiceUltima >= 0) {
    estrelas[indiceUltima] = Math.max(
        estrelas[indiceUltima] || 0,
        estrelasUltima
    );
    }

    const totalEstrelas = estrelas.reduce(
    (soma, valor) => soma + (valor || 0),
    0
    );

    const maxEstrelas = mapa.missoes.length * 3;

    setResultado({
      mapa,
      estrelas: totalEstrelas,
      maxEstrelas,
      tentativas: tentativasMapa,
      maiorSequencia: maxSeq,
      perfeito: totalEstrelas === maxEstrelas,
      proximo: obterProximoMapa(),
      todosConcluidos: MAPAS.every(item =>
        item.id === mapa.id || progresso[item.id]?.concluido
      )
    });

    setExec(null);
    setModal(null);
    setPendente(false);

    irPara('fim');
  }, [
    mapa,
    progresso,
    tentativasMapa,
    maxSeq,
    atualizarMapa,
    obterProximoMapa,
    irPara
  ]);

  // Registra um acerto.
  const acertar = useCallback(custo => {
    const estrelas = estrelasDe(custo, layout.otimo[0]);

    salvarEstrelas(mapa, missaoK, estrelas);

    const novosAcertos = acertos + 1;
    const novaStreak = streak + 1;

    setAcertos(novosAcertos);
    setStreak(novaStreak);
    setMaxSeq(atual => Math.max(atual, novaStreak));
    setErrosSeguidos(0);
    setHumor('feliz');

    const necessario = mapa.concluir || mapa.missoes.length;

    setPendente(true);

    if (novosAcertos >= necessario) {
      setTimeout(() => {
        concluirMapa(estrelas, missaoK);
        }, 700);
      return;
    }

    setTimeout(() => {
      setExec(null);
      setModal({
        tipo: 'sucesso',
        estrelas,
        custo,
        texto: 'Muito bem! Você encontrou o caminho correto.'
      });
      setPendente(false);
    }, 600);
  }, [
    layout,
    mapa,
    missaoK,
    acertos,
    streak,
    salvarEstrelas,
    concluirMapa
  ]);

  // Registra um erro.
  const errar = useCallback(tipo => {
    setErrosSeguidos(atual => atual + 1);
    setStreak(0);
    setHumor('triste');
    setPos(layout.inicio);
    setVisitas([layout.inicio]);
    setPendente(true);

    const mensagens = {
      bloqueio: 'O robô encontrou um obstáculo!',
      passos: 'O caminho ultrapassou o limite de passos.',
      outro: 'Ainda não chegamos ao resultado correto.'
    };

    setTimeout(() => {
      setExec(null);
      setModal({
        tipo: 'erro',
        erro: tipo,
        texto: mensagens[tipo] || mensagens.outro
      });
      setPendente(false);
    }, 600);
  }, [layout]);

  // Avalia o resultado da execução.
  const avaliar = useCallback(resultadoSimulacao => {
    if (resultadoSimulacao.bloqueio >= 0) {
      errar('bloqueio');
      return;
    }

    if (!resultadoSimulacao.sucesso) {
      errar('outro');
      return;
    }

    if (resultadoSimulacao.custo > mapa.limite) {
      errar('passos');
      return;
    }

    acertar(resultadoSimulacao.custo);
  }, [mapa, errar, acertar]);

  // Executa a sequência de comandos.
  const executar = useCallback(() => {
    if (!podeEditar) return;

    if (sequencia.length === 0) {
      setToast('Adicione comandos antes de executar.');
      return;
    }

    const resultadoSimulacao = simular(
      layout,
      sequencia,
      layout.alvos[0]
    );

    setTentativasMapa(atual => atual + 1);
    setTentativasMissao(atual => atual + 1);

    setSim(resultadoSimulacao);
    setPos(layout.inicio);
    setVisitas([layout.inicio]);
    setCustoExec(0);
    setExec({
      passos: resultadoSimulacao.passos,
      indice: 0,
      custo: 0
    });
  }, [podeEditar, sequencia, layout]);

  // Executa visualmente um comando por vez.
  useEffect(() => {
    if (!exec || pendente) return;

    if (exec.indice >= exec.passos.length) {
      const timer = setTimeout(() => {
        setExec(null);
        avaliar(sim);
      }, 550);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      const passo = exec.passos[exec.indice];

      setPos(passo.para);
      setDirVis(passo.dir);
      setCustoExec(atual => atual + passo.custo);

      setVisitas(atual => [
        ...atual,
        ...(passo.seg || []),
        passo.para
      ]);

      setExec(atual => ({
        ...atual,
        indice: atual.indice + 1,
        custo: atual.custo + passo.custo
      }));
    }, CONFIG.intervaloPassoMs);

    return () => clearTimeout(timer);
  }, [exec, pendente, sim, avaliar]);

  // Avança para a próxima missão.
  const proximaMissao = useCallback(() => {
    if (!mapa) return;

    setModal(null);
    setPendente(false);
    setTentativasMissao(0);

    sortearMissao(mapa, banco);
  }, [mapa, banco, sortearMissao]);

  // Reinicia o mapa atual.
  const jogarNovamente = useCallback(() => {
    if (!mapa) return;

    setAcertos(0);
    setTentativasMapa(0);
    setTentativasMissao(0);
    setErrosSeguidos(0);
    setStreak(0);
    setMaxSeq(0);
    setResultado(null);

    const novoBanco = embaralhar(
      mapa.missoes.map((_, indice) => indice)
    );

    sortearMissao(mapa, novoBanco);
    irPara('jogo');
  }, [mapa, embaralhar, sortearMissao, irPara]);

  // Encerra a partida e limpa os comandos.
  const sair = useCallback(() => {
    limparPartida();
    setMapa(null);
    setLayout(null);
    setMissao(null);
    setResultado(null);
    irPara('inicio');
  }, [limparPartida, irPara]);

  return {
    mapa,
    layout,
    missao,
    missaoK,
    alvos: layout?.alvos[0] || [],
    otimo: layout?.otimo[0] ?? 0,

    acertos,
    tentativasMapa,
    tentativasMissao,
    errosSeguidos,
    streak,
    maxSeq,

    sequencia,
    pos,
    visitas,
    custoExec,
    sim,
    exec,

    modal,
    toast,
    pendente,
    dicaMostrada,
    humor,
    dirVis,
    resultado,

    ocupado,
    podeEditar,

    iniciarMapa,
    adicionarMovimento,
    apagarComando,
    limparComandos,
    executar,
    mostrarDica,
    proximaMissao,
    jogarNovamente,
    sair,
    setModal
  };
}
