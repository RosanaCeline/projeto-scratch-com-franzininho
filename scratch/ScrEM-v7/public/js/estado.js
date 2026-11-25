/* =====================================================================
  ScrEM — estado central do jogo
  Este arquivo contém somente os dados mutáveis da partida e da navegação.
  As regras e a apresentação continuam no motor do jogo nesta primeira etapa.
  ===================================================================== */
(() => {
  'use strict';
  if (window.ScrEMEstado) {
    console.error('ScrEM: o estado já foi inicializado.');
    return;
  }
window.ScrEMEstado = {
    tela: 'inicio', som: true, progresso: {}, assunto: 0,
    mapa: null, L: null,               // L = layout sorteado da partida atual
    banco: [], missao: null, missaoK: 0, alvos: [], otimo: 0,
    acertos: 0, tentativasMapa: 0, tentativasMissao: 0, errosSeguidos: 0, streak: 0, maxSeq: 0,
    sequencia: [], pos: 0, visitas: [], custoExec: 0, sim: null, exec: null,
    modal: null, pendente: false, dicaMostrada: false, toast: null,
    humor: 'normal', tremor: 0, foco: null, hover: null, dirVis: 'baixo'
  };

})();
