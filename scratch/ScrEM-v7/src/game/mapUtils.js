
import { MAPAS } from '../data/maps.js';
import { ASSUNTOS } from '../data/subjects.js';
import { MARGEM } from './constants.js';

// Verifica se um mapa já foi concluído.
export function concluido(m, progresso) {
  return !!(
    progresso[m.id] &&
    progresso[m.id].concluido
  );
}

// Retorna os mapas pertencentes a determinado assunto.
export function mapasDoAssunto(a) {
  return MAPAS.filter(
    m => m.assunto === ASSUNTOS[a].id
  );
}

// Recupera o progresso de um mapa.
export function progressoDe(m, progresso) {
  return progresso[m.id] || {
    concluido: false,
    estrelas: [],
    tentativas: 0
  };
}

// Soma as estrelas conquistadas em todas as missões do mapa.
export function estrelasMapa(m, progresso) {
  return (progressoDe(m, progresso).estrelas || [])
    .reduce((s, e) => s + (e || 0), 0);
}

// Calcula o total máximo de estrelas disponíveis no mapa.
export function maxEstrelas(m) {
  return 3 * m.missoes.length;
}

// Calcula quantas estrelas uma missão recebe pelo custo.
export function estrelasDe(custo, otimo) {
  return custo <= otimo
    ? 3
    : custo <= otimo + MARGEM
      ? 2
      : 1;
}
