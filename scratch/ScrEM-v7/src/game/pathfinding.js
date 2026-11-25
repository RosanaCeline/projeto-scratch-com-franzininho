
import { N, MAX_CMD, DIRS } from './constants.js';
import { andar } from './movement.js';

// Menor custo em passos para cumprir a missão com até MAX_CMD comandos.
// Programação dinâmica sobre (casa, alvos já cumpridos).
export function melhorCusto(L, alvos) {
  const K = alvos.length;
  const C = K + 1;
  const S = N * N * C;

  let atual = new Array(S).fill(Infinity);
  atual[L.inicio * C] = 0;

  let melhor = Infinity;

  for (let c = 0; c <= MAX_CMD; c++) {
    for (let cel = 0; cel < N * N; cel++) {
      for (let k = 0; k <= K; k++) {
        const v = atual[cel * C + k];

        if (v === Infinity) continue;

        const fim = K === 1
          ? cel === alvos[0]
          : k === K;

        if (fim && v < melhor) {
          melhor = v;
        }
      }
    }

    if (c === MAX_CMD) break;

    const prox = new Array(S).fill(Infinity);

    for (let cel = 0; cel < N * N; cel++) {
      for (let k = 0; k <= K; k++) {
        const v = atual[cel * C + k];

        if (v === Infinity) continue;

        for (const dir of DIRS) {
          const r = andar(L, cel, dir);

          if (!r) continue;

          const k2 = k < K && r.para === alvos[k]
            ? k + 1
            : k;

          const j = r.para * C + k2;
          const nv = v + r.custo;

          if (nv < prox[j]) {
            prox[j] = nv;
          }
        }
      }
    }

    atual = prox;
  }

  return melhor;
}

// Conta os caminhos que cumprem a missão.
// Retorna o custo ótimo, a quantidade de caminhos ideais
// e a quantidade total de caminhos dentro do orçamento.
export function analisarMissao(L, alvos, budget) {
  const K = alvos.length;
  const C = K + 1;
  const B = budget + 1;
  const CAP = 1e6;

  const idx = (cel, k, cst) =>
    (cel * C + k) * B + cst;

  const SZ = N * N * C * B;

  let atual = new Float64Array(SZ);
  atual[idx(L.inicio, 0, 0)] = 1;

  const porCusto = new Float64Array(B);

  for (let c = 0; c <= MAX_CMD; c++) {
    for (let cel = 0; cel < N * N; cel++) {
      for (let k = 0; k <= K; k++) {
        for (let cst = 0; cst < B; cst++) {
          const v = atual[idx(cel, k, cst)];

          if (!v) continue;

          const fim = K === 1
            ? cel === alvos[0]
            : k === K;

          if (fim) {
            porCusto[cst] = Math.min(
              CAP,
              porCusto[cst] + v
            );
          }
        }
      }
    }

    if (c === MAX_CMD) break;

    const prox = new Float64Array(SZ);

    for (let cel = 0; cel < N * N; cel++) {
      for (let k = 0; k <= K; k++) {
        for (let cst = 0; cst < B; cst++) {
          const v = atual[idx(cel, k, cst)];

          if (!v) continue;

          for (const dir of DIRS) {
            const r = andar(L, cel, dir);

            if (!r) continue;

            const nc = cst + r.custo;

            if (nc > budget) continue;

            const k2 = k < K && r.para === alvos[k]
              ? k + 1
              : k;

            const j = idx(r.para, k2, nc);

            prox[j] = Math.min(CAP, prox[j] + v);
          }
        }
      }
    }

    atual = prox;
  }

  const otimo = porCusto.findIndex(x => x > 0);

  if (otimo < 0) {
    return {
      otimo: Infinity,
      ideais: 0,
      total: 0
    };
  }

  return {
    otimo,
    ideais: porCusto[otimo],
    total: porCusto.reduce(
      (s, x) => Math.min(CAP, s + x),
      0
    )
  };
}
