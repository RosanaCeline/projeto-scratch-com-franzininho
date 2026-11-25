
import { N } from './constants.js';
import { analisarMissao } from './pathfinding.js';

const DIST_MIN = 5;

function embaralhar(array) {
  const resultado = [...array];

  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }

  return resultado;
}

function contar(valor) {
  return valor || 0;
}

function distancia(a, b) {
  return (
    Math.abs(Math.floor(a / N) - Math.floor(b / N)) +
    Math.abs((a % N) - (b % N))
  );
}

// Sorteia o início, obstáculos, respostas e terrenos do tabuleiro.
export function montarLayout(m, comCores, k) {
  const mis = m.missoes[k];

  const L = {
    inicio: 0,
    obst: new Array(N * N).fill(false),
    tipo: new Array(N * N).fill('n'),
    rot: new Array(N * N).fill(''),
    pos: {},
    par: new Array(N * N).fill(-1),
    alvos: [],
    otimo: [],
    analise: [],
    ok: false
  };

  const nObst = m.obstaculos.length;
  const TG = [...new Set(mis.alvos)];
  const todos = [...Array(N * N).keys()];

  L.inicio = todos[Math.floor(Math.random() * todos.length)];

  const cand = embaralhar(
    todos.filter(i => i !== L.inicio)
  );

  cand.slice(0, nObst).forEach(i => {
    L.obst[i] = true;
  });

  const livres = cand.slice(nObst);

  // Distribui as respostas em casas livres.
  const posAlvo = livres.slice(0, TG.length);

  TG.forEach((rot, j) => {
    const i = posAlvo[j];
    L.rot[i] = rot;
    L.pos[rot] = i;
  });

  // O resultado final precisa estar longe do início.
  const finais = [
    L.pos[mis.alvos[mis.alvos.length - 1]]
  ];

  const distOk = !finais.some(
    i => i === undefined || distancia(L.inicio, i) < DIST_MIN
  );

  // Distribui os demais rótulos do mapa.
  const resto = livres.slice(TG.length);

  const pool = embaralhar(
    m.celulas.filter(x => x && !TG.includes(x))
  );

  resto.forEach((i, j) => {
    if (pool[j] !== undefined) {
      L.rot[i] = pool[j];
      L.pos[pool[j]] = i;
    }
  });

  // Sorteia os terrenos especiais.
  if (comCores) {
    const emb = embaralhar(resto);
    let p = 0;

    ['v', 'a', 'y'].forEach(c => {
      for (
        let j = 0;
        j < contar(m.terreno[c]) && p < emb.length;
        j++
      ) {
        L.tipo[emb[p++]] = c;
      }
    });

    // Os terrenos verdes sempre aparecem em pares.
    const nv = contar(m.terreno.g) - (
      contar(m.terreno.g) % 2
    );

    for (let j = 0; j < nv && p + 1 < emb.length; j += 2) {
      const a = emb[p];
      const b = emb[p + 1];

      p += 2;

      L.tipo[a] = 'g';
      L.tipo[b] = 'g';
      L.par[a] = b;
      L.par[b] = a;
    }
  }

  // Converte os rótulos dos alvos em posições do tabuleiro.
  L.alvos = [
    mis.alvos.map(rot => L.pos[rot])
  ];

  if (!L.alvos.every(alvos =>
    alvos.every(i => i !== undefined)
  )) {
    return L;
  }

  // Analisa os caminhos possíveis da missão.
  L.analise = L.alvos.map(alvos =>
    analisarMissao(L, alvos, m.limite)
  );

  L.otimo = L.analise.map(a => a.otimo);

  // Verifica as condições necessárias para aceitar o layout.
  L.ok =
    distOk &&
    L.analise.every(a =>
      a.otimo <= m.limite &&
      a.ideais === 1 &&
      a.total >= 2
    );

  return L;
}

// Sorteia um tabuleiro até encontrar um que satisfaça as regras.
export function gerarLayout(m, k) {
  let melhor = null;

  // Primeira tentativa: com terrenos especiais.
  for (let t = 0; t < 600; t++) {
    const c = montarLayout(m, true, k);

    if (c.ok) return c;

    if (!melhor && c.alvos.length && c.analise.length) {
      melhor = c;
    }
  }

  // Reserva: tenta gerar um tabuleiro sem terrenos especiais.
  let reserva = null;

  for (let t = 0; t < 2000 && !reserva; t++) {
    const c = montarLayout(m, false, k);

    if (
      c.alvos.length &&
      c.otimo.length &&
      c.otimo.every(o => o < Infinity)
    ) {
      reserva = c;
    }
  }

  if (!reserva) {
    console.warn('Mapa sem layout possível:', m.id);
  }

  reserva = reserva || melhor;

  if (reserva && !reserva.ok) {
    console.warn('Mapa sem layout ideal único:', m.id);
  }

  if (reserva) {
    reserva.fallback = true;
  }

  return reserva;
}
