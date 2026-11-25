import { N, DELTA, CUSTO_CHOQUE } from './constants.js';

// Retorna a posição vizinha ou -1 se estiver fora da grade.
export function vizinho(indice, direcao) {
  const [dx, dy] = DELTA[direcao];

  const x = indice % N;
  const y = Math.floor(indice / N);

  const nx = x + dx;
  const ny = y + dy;

  if (nx < 0 || nx >= N || ny < 0 || ny >= N) {
    return -1;
  }

  return ny * N + nx;
}

// Aplica as regras de movimento de uma casa.
export function andar(L, celula, direcao) {
  const adjacente = vizinho(celula, direcao);

  if (adjacente < 0 || L.obst[adjacente]) {
    return null;
  }

  // Casa vermelha: perde o passo e permanece onde estava.
  if (L.tipo[adjacente] === 'v') {
    return {
      para: celula,
      custo: 1,
      ev: 'perdeu',
      seg: []
    };
  }

  let para = adjacente;
  let custo = 1;
  let ev = '';
  const seg = [];

  // Casa azul: tenta escorregar mais uma casa.
  if (L.tipo[para] === 'a') {
    const proxima = vizinho(para, direcao);

    if (
      proxima >= 0 &&
      !L.obst[proxima] &&
      L.tipo[proxima] !== 'v'
    ) {
      seg.push(proxima);
      para = proxima;
      ev = 'agua';
    } else {
      ev = 'agua_parada';
    }
  }

  // Casa amarela: acrescenta o custo do choque.
  if (L.tipo[para] === 'y') {
    custo += CUSTO_CHOQUE;
    ev = ev.startsWith('agua') ? 'agua_choque' : 'choque';
  }

  // Casa verde: teletransporta para a outra casa verde.
  if (L.tipo[para] === 'g' && L.par[para] >= 0) {
    seg.push(L.par[para]);
    para = L.par[para];

    ev = ev
      ? `${ev}_atalho`
      : 'atalho';
  }

  return {
    para,
    custo,
    ev,
    seg
  };
}

// Simula uma sequência completa de comandos.
export function simular(L, sequencia, alvos) {
  let pos = L.inicio;
  let k = 0;
  let custo = 0;
  let bloqueio = -1;

  const passos = [];

  for (let i = 0; i < sequencia.length; i++) {
    const direcao = sequencia[i];
    const resultado = andar(L, pos, direcao);

    if (!resultado) {
      bloqueio = i;

      passos.push({
        dir: direcao,
        de: pos,
        para: pos,
        custo: 0,
        ev: 'bloqueio',
        seg: []
      });

      break;
    }

    passos.push({
      dir: direcao,
      de: pos,
      ...resultado
    });

    pos = resultado.para;
    custo += resultado.custo;

    // Os alvos precisam ser alcançados na ordem correta.
    if (pos === alvos[k]) {
      k++;
    }
  }

  const sucesso =
    bloqueio === -1 &&
    (
      alvos.length === 1
        ? pos === alvos[0]
        : k === alvos.length
    );

  return {
    passos,
    pos,
    custo,
    bloqueio,
    sucesso
  };
}