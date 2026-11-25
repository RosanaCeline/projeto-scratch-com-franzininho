/* =====================================================================
  ScrEM v7 — motor do jogo (regras, sorteio de cores e desenho em canvas)
  Os dados do cenário (assuntos, mapas e missões) ficam no arquivo
  js/dados.js. Esta parte não precisa ser alterada.
  ===================================================================== */
(() => {
  'use strict';

  const N = CONFIG.tamanhoGrade;
  let LW = 1600, LH = 900;                      // tela lógica: acompanha a proporção da janela
  const ESCALA = CONFIG.escalaJogo || 0.9;         // deixa os elementos um pouco menores
  const MAX_CMD = CONFIG.maxComandos || 20;        // comandos por execução
  const CUSTO_CHOQUE = CONFIG.custoChoque || 3;    // passos extras ao pisar em amarelo
  const MARGEM = CONFIG.margemEstrelas || 2;       // passos acima do ótimo que ainda dão 2 estrelas
  const CHAVE_SAVE = 'screm-v6';
  const DIRS = ['cima', 'baixo', 'esquerda', 'direita'];
  const DELTA = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };
  const GLIFO = { cima: '↑', baixo: '↓', esquerda: '←', direita: '→' };
  const TECLA_WASD = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight', W: 'ArrowUp', A: 'ArrowLeft', S: 'ArrowDown', D: 'ArrowRight' };
  const TECLA_SETA = { ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esquerda', ArrowRight: 'direita' };
  const CORES_CONFETE = ['#ffd23f', '#0d0d6b', '#1f9d61', '#ff6fa0', '#4aa8ff', '#9b8cff'];

  const CORES = {
    navy: '#0d0d6b', navyEscuro: '#06063a', muted: '#6b6f9c', fundo: '#eef0f7',
    cartao: '#ffffff', linha: '#d9dce6', celula: '#f2f4fb', celulaVisit: '#fff1b0',
    obst: '#6b6f9c', obstBorda: '#4f5385', obstTijolo: '#8c91c6',
    amarelo: '#ffd23f', amareloForte: '#ffd23f', amareloSombra: '#e0a800',
    verde: '#1f9d61', vermelho: '#e5484d', azul: '#4aa8ff', rosa: '#ff6fa0'
  };
  // tipos de casa: n = normal, o = obstáculo, v/a/y/g = cores com regra
  const TERRENO = {
    v: { nome: 'Vermelho', fundo: '#ffdcdd', pixel: '#e5484d', regra: 'Perde o passo: fica parado.' },
    a: { nome: 'Azul', fundo: '#d2ebff', pixel: '#4aa8ff', regra: 'Água: escorrega uma casa a mais.' },
    y: { nome: 'Amarelo', fundo: '#fff1ad', pixel: '#e0a800', regra: `Choque: custa ${CUSTO_CHOQUE} passos extras.` },
    g: { nome: 'Verde', fundo: '#caf6df', pixel: '#1f9d61', regra: 'Atalho: leva ao outro verde.' }
  };
  const NIVEIS = {
    1: { nome: 'Básico', cor: '#1f9d61' },
    2: { nome: 'Intermediário', cor: '#c98a00' },
    3: { nome: 'Avançado', cor: '#d6455b' }
  };

  // ---------- preparação dos dados ----------
  const MAPA_POR_ID = {};
  MAPAS.forEach(m => {
    if (m.celulas.length !== N * N) console.error('Mapa com tamanho errado:', m.id);
    m.concluir = Math.min(m.concluir, m.missoes.length);
    m.limite = m.limite || 20;                      // orçamento de passos do mapa
    m.fixo = !!m.fixo;                              // true: obstáculos e rótulos não mudam
    m.terreno = m.terreno || {};
    m.missoesR = m.missoes.map((x, k) => ({ texto: x.texto, dica: x.dica, alvos: x.alvos, k }));
    m.missoesR.forEach(x => x.alvos.forEach(rot => {
      if (!m.celulas.includes(rot)) console.error('Resposta sem célula:', m.id, rot);
    }));
    MAPA_POR_ID[m.id] = m;
  });

  // ---------- estado ----------
  // O estado é inicializado separadamente por js/estado.js.
  const st = window.ScrEMEstado;
  if (!st) throw new Error('ScrEM: carregue js/estado.js antes de js/jogo.js.');

  // ---------- utilidades ----------
  const embaralhar = a => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const contar = n => n || 0;
  const vizinho = (i, dir) => {
    const r = Math.floor(i / N), c = i % N;
    const [dc, dr] = DELTA[dir];
    const nc = c + dc, nr = r + dr;
    if (nc < 0 || nc >= N || nr < 0 || nr >= N) return -1;
    return nr * N + nc;
  };
  const ocupado = () => !!(st.exec || st.modal || st.pendente);
  const podeEditar = () => st.tela === 'jogo' && !ocupado();
  const concluido = m => !!(st.progresso[m.id] && st.progresso[m.id].concluido);
  const mapasDoAssunto = a => MAPAS.filter(m => m.assunto === ASSUNTOS[a].id);
  const progressoDe = m => st.progresso[m.id] || { concluido: false, estrelas: [], tentativas: 0 };
  const estrelasMapa = m => (progressoDe(m).estrelas || []).reduce((s, e) => s + (e || 0), 0);
  const maxEstrelas = m => 3 * m.missoes.length;
  const estrelasDe = (custo, otimo) => custo <= otimo ? 3 : custo <= otimo + MARGEM ? 2 : 1;

  // ---------- progresso salvo ----------
  function carregar() {
    try {
      const d = JSON.parse(localStorage.getItem(CHAVE_SAVE) || '{}');
      st.progresso = d.progresso || {};
      st.som = d.som !== false;
    } catch (e) { /* sem armazenamento: segue sem salvar */ }
  }
  function salvar() {
    try {
      localStorage.setItem(CHAVE_SAVE, JSON.stringify({ progresso: st.progresso, som: st.som }));
    } catch (e) { /* ignora */ }
  }
  function registrarEstrela(m, k, e) {
    const p = st.progresso[m.id] || (st.progresso[m.id] = { concluido: false, estrelas: [], tentativas: 0 });
    p.estrelas = p.estrelas || [];
    p.estrelas[k] = Math.max(p.estrelas[k] || 0, e);
  }

  // ---------- regras do terreno ----------
  // Um passo a partir da casa 'cel' na direção 'dir'.
  // Retorna null se bate num obstáculo ou na borda (caminho bloqueado).
  function andar(L, cel, dir) {
    const n = vizinho(cel, dir);
    if (n < 0 || L.obst[n]) return null;
    if (L.tipo[n] === 'v') return { para: cel, custo: 1, ev: 'perdeu', seg: [] };
    const seg = [n];
    let para = n, custo = 1, ev = null;
    if (L.tipo[n] === 'a') {                        // água: escorrega mais uma casa
      const m2 = vizinho(n, dir);
      if (m2 >= 0 && !L.obst[m2] && L.tipo[m2] !== 'v') { seg.push(m2); para = m2; ev = 'agua'; }
      else ev = 'agua_parada';
    }
    if (L.tipo[para] === 'y') {                     // choque: passos extras
      custo += CUSTO_CHOQUE;
      ev = ev === 'agua' ? 'agua_choque' : 'choque';
    }
    if (L.tipo[para] === 'g' && L.par[para] >= 0) { // atalho: vai para o outro verde
      const p2 = L.par[para];
      seg.push(p2); para = p2;
      ev = ev ? ev + '_atalho' : 'atalho';
    }
    return { para, custo, ev, seg };
  }

  // Executa uma sequência inteira (sem animação). Usado na prévia e na checagem.
  function simular(L, seq, alvos) {
    const K = alvos.length;
    let pos = L.inicio, k = 0, custo = 0, bloqueio = -1;
    const passos = [];
    for (let i = 0; i < seq.length; i++) {
      const dir = seq[i];
      const r = andar(L, pos, dir);
      if (!r) {
        passos.push({ i, dir, de: pos, para: pos, seg: [], ev: 'bloqueio', custo: 0 });
        bloqueio = i;
        break;
      }
      passos.push({ i, dir, de: pos, para: r.para, seg: r.seg, ev: r.ev, custo: r.custo });
      pos = r.para;
      custo += r.custo;
      if (k < K && pos === alvos[k]) k++;
    }
    const chegou = K === 1 ? pos === alvos[0] : k === K;
    return { passos, pos, custo, bloqueio, sucesso: bloqueio < 0 && chegou };
  }

  // Menor custo em passos para cumprir a missão com até MAX_CMD comandos.
  // Programação dinâmica sobre (casa, alvos já cumpridos) — um BFS com custos.
  function melhorCusto(L, alvos) {
    const K = alvos.length, C = K + 1, S = N * N * C;
    let atual = new Array(S).fill(Infinity);
    atual[L.inicio * C] = 0;
    let melhor = Infinity;
    for (let c = 0; c <= MAX_CMD; c++) {
      for (let cel = 0; cel < N * N; cel++) {
        for (let k = 0; k <= K; k++) {
          const v = atual[cel * C + k];
          if (v === Infinity) continue;
          const fim = K === 1 ? cel === alvos[0] : k === K;
          if (fim && v < melhor) melhor = v;
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
            const k2 = k < K && r.para === alvos[k] ? k + 1 : k;
            const j = r.para * C + k2;
            const nv = v + r.custo;
            if (nv < prox[j]) prox[j] = nv;
          }
        }
      }
      atual = prox;
    }
    return melhor;
  }

  // Conta os caminhos (sequências de comandos) que cumprem a missão.
  // Retorna o custo ótimo, quantos caminhos têm esse custo (ideais) e quantos caminhos
  // existem dentro do orçamento de passos (total). Programação dinâmica por (casa, alvos, custo).
  function analisarMissao(L, alvos, budget) {
    const K = alvos.length, C = K + 1, B = budget + 1, CAP = 1e6;
    const idx = (cel, k, cst) => (cel * C + k) * B + cst;
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
            const fim = K === 1 ? cel === alvos[0] : k === K;
            if (fim) porCusto[cst] = Math.min(CAP, porCusto[cst] + v);
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
              const k2 = k < K && r.para === alvos[k] ? k + 1 : k;
              const j = idx(r.para, k2, nc);
              prox[j] = Math.min(CAP, prox[j] + v);
            }
          }
        }
      }
      atual = prox;
    }
    const otimo = porCusto.findIndex(x => x > 0);
    if (otimo < 0) return { otimo: Infinity, ideais: 0, total: 0 };
    return { otimo, ideais: porCusto[otimo], total: porCusto.reduce((s, x) => Math.min(CAP, s + x), 0) };
  }

  // ---------- sorteio do layout (início, obstáculos, rótulos e cores) ----------
  // Cada missão tem o seu tabuleiro: onde nasce o personagem, obstáculos, respostas e cores são sorteados.
  // Regras de aceite:
  //  · o resultado final está a pelo menos DIST_MIN casas (distância de Manhattan) do início;
  //  · existe ao menos 2 caminhos possíveis dentro do orçamento de passos;
  //  · existe exatamente 1 caminho ideal (custo mínimo).
  const DIST_MIN = 5;
  const dist = (a, b) => Math.abs(Math.floor(a / N) - Math.floor(b / N)) + Math.abs((a % N) - (b % N));

  function montarLayout(m, comCores, k) {
    const mis = m.missoesR[k];
    const L = {
      inicio: 0, obst: new Array(N * N).fill(false), tipo: new Array(N * N).fill('n'),
      rot: new Array(N * N).fill(''), pos: {}, par: new Array(N * N).fill(-1),
      alvos: [], otimo: [], analise: [], ok: false
    };
    const nObst = m.obstaculos.length;
    const TG = [...new Set(mis.alvos)];
    const todos = [...Array(N * N).keys()];
    L.inicio = todos[Math.floor(Math.random() * todos.length)];
    const cand = embaralhar(todos.filter(i => i !== L.inicio));
    cand.slice(0, nObst).forEach(i => { L.obst[i] = true; });
    const livres = cand.slice(nObst);
    // respostas: cada uma em casa livre
    const posAlvo = livres.slice(0, TG.length);
    TG.forEach((rot, j) => { const i = posAlvo[j]; L.rot[i] = rot; L.pos[rot] = i; });
    // resultado final de cada missão precisa estar longe do início
    const finais = [L.pos[mis.alvos[mis.alvos.length - 1]]];
    const distOk = !finais.some(i => i === undefined || dist(L.inicio, i) < DIST_MIN);
    const resto = livres.slice(TG.length);
    const pool = embaralhar(m.celulas.filter(x => x && !TG.includes(x)));
    resto.forEach((i, j) => {
      if (pool[j] !== undefined) { L.rot[i] = pool[j]; L.pos[pool[j]] = i; }
    });
    if (comCores) {
      const emb = embaralhar(resto);
      let p = 0;
      ['v', 'a', 'y'].forEach(c => {
        for (let j = 0; j < contar(m.terreno[c]) && p < emb.length; j++) L.tipo[emb[p++]] = c;
      });
      const nv = contar(m.terreno.g) - (contar(m.terreno.g) % 2);   // verdes vêm em pares
      for (let j = 0; j < nv && p + 1 < emb.length; j += 2) {
        const a = emb[p], b = emb[p + 1];
        p += 2;
        L.tipo[a] = 'g'; L.tipo[b] = 'g'; L.par[a] = b; L.par[b] = a;
      }
    }
    L.alvos = [mis.alvos.map(rot => L.pos[rot])];
    if (!L.alvos.every(al => al.every(i => i !== undefined))) return L;
    L.analise = L.alvos.map(al => analisarMissao(L, al, m.limite));
    L.otimo = L.analise.map(a => a.otimo);
    L.ok = distOk && L.analise.every(a => a.otimo <= m.limite && a.ideais === 1 && a.total >= 2);
    return L;
  }

  // Sorteia um tabuleiro novo para a missão k até satisfazer as regras dela.
  function gerarLayout(m, k) {
    let melhor = null;
    for (let t = 0; t < 600; t++) {
      const c = montarLayout(m, true, k);
      if (c.ok) return c;
      if (!melhor && c.alvos.length && c.analise.length) melhor = c;
    }
    // reserva: sem cores, mas com início e obstáculos sorteados
    let reserva = null;
    for (let t = 0; t < 2000 && !reserva; t++) {
      const c = montarLayout(m, false, k);
      if (c.alvos.length && c.otimo.length && c.otimo.every(o => o < Infinity)) reserva = c;
    }
    if (!reserva) console.warn('Mapa sem layout possível:', m.id);
    reserva = reserva || melhor;
    if (reserva && !reserva.ok) console.warn('Mapa sem layout ideal único:', m.id);
    if (reserva) reserva.fallback = true;
    return reserva;
  }

  // ---------- som (sintetizado, sem arquivos) ----------
  let AC = null;
  function liberarAudio() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
    }
    if (AC && AC.state === 'suspended') AC.resume();
  }
  function tom(f, dur, tipo, vol, atraso, fFim) {
    if (!st.som || !AC) return;
    const t = AC.currentTime + (atraso || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (fFim) o.frequency.exponentialRampToValueAtTime(fFim, t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function tocar(nome) {
    liberarAudio();
    switch (nome) {
      case 'clique': tom(700, 0.04, 'square', 0.04); break;
      case 'passo': tom(520, 0.07, 'sine', 0.12); break;
      case 'agua': tom(330, 0.2, 'sine', 0.14, 0, 200); break;
      case 'choque': tom(900, 0.08, 'sawtooth', 0.08, 0, 300); tom(600, 0.1, 'sawtooth', 0.08, 0.08, 200); break;
      case 'atalho': [660, 880, 1320].forEach((f, i) => tom(f, 0.12, 'triangle', 0.14, i * 0.07)); break;
      case 'perdeu': tom(200, 0.15, 'square', 0.07, 0, 120); break;
      case 'acerto': tom(523, 0.12, 'triangle', 0.18); tom(659, 0.12, 'triangle', 0.18, 0.12); tom(784, 0.2, 'triangle', 0.18, 0.24); break;
      case 'erro': tom(260, 0.22, 'sawtooth', 0.09, 0, 140); break;
      case 'bloqueio': tom(180, 0.25, 'square', 0.08, 0, 90); break;
      case 'vitoria': [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.24, 'triangle', 0.2, i * 0.15)); break;
    }
  }

  // ---------- tela e escala ----------
  const cv = document.getElementById('jogo');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, S = 1, OX = 0, OY = 0;
  function ajustarTela() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    // tela lógica acompanha a proporção da janela: paisagem = 900 de altura,
    // retrato = 1000 de largura. Assim o layout ocupa a tela toda, sem barras grandes.
    const A = W / H;
    if (A >= 1.2) { LH = 900; LW = Math.min(2400, Math.round(900 * A / 4) * 4); }
    else { LW = 1000; LH = Math.min(2400, Math.max(1900, Math.round(1000 / A / 4) * 4)); }
    S = Math.min(W / LW, H / LH) * ESCALA;
    OX = (W - LW * S) / 2;
    OY = (H - LH * S) / 2;
  }
  window.addEventListener('resize', ajustarTela);
  document.addEventListener('fullscreenchange', ajustarTela);
  ajustarTela();

  function telaCheia() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
  function alternarSom() {
    st.som = !st.som;
    salvar();
    if (st.som) tocar('clique');
  }

  // ---------- ponte temporária para os componentes React ----------
  // O motor continua dono das regras; React recebe apenas um snapshot e ações públicas.
  const ouvintesReact = new Set();
  function obterSnapshotReact() {
    return {
      tela: st.tela,
      som: st.som,
      mapasConcluidos: MAPAS.filter(concluido).length,
      totalMapas: MAPAS.length,
      estrelas: MAPAS.reduce((s, m) => s + estrelasMapa(m), 0),
      maxEstrelas: MAPAS.reduce((s, m) => s + maxEstrelas(m), 0)
    };
  }
  let assinaturaReact = '';
  function publicarSnapshotReact(forcar = false) {
    const snapshot = obterSnapshotReact();
    const assinatura = JSON.stringify(snapshot);
    if (!forcar && assinatura === assinaturaReact) return;
    assinaturaReact = assinatura;
    ouvintesReact.forEach(ouvinte => ouvinte(snapshot));
  }
  window.ScrEMAPI = {
    getSnapshot: obterSnapshotReact,
    subscribe(ouvinte) {
      ouvintesReact.add(ouvinte);
      ouvinte(obterSnapshotReact());
      return () => ouvintesReact.delete(ouvinte);
    },
    irPara,
    alternarSom,
    telaCheia
  };

  // ---------- primitivas ----------
  function rr(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  function preencher(x, y, w, h, r, cor) { rr(x, y, w, h, r); ctx.fillStyle = cor; ctx.fill(); }
  function contornar(x, y, w, h, r, cor, lw) { rr(x, y, w, h, r); ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.stroke(); }
  function cartao(x, y, w, h, r, opt) {
    const o = opt || {};
    preencher(x, y + 5, w, h, r, 'rgba(13,13,107,0.07)');
    preencher(x, y, w, h, r, o.cor || CORES.cartao);
    contornar(x + 1, y + 1, w - 2, h - 2, r, o.borda || CORES.linha, 2);
  }
  function fonte(tam, peso) { ctx.font = `${peso || 600} ${tam}px ${FONTE}`; }
  const FONTE = '"Segoe UI", "Helvetica Neue", Roboto, Arial, system-ui, sans-serif';
  function medir(s, tam, peso) { fonte(tam, peso); return ctx.measureText(s).width; }
  function escrever(s, x, y, o) {
    const op = o || {};
    const peso = op.peso || 600;
    let tam = op.tam || 32;
    fonte(tam, peso);
    if (op.max) {
      while (ctx.measureText(s).width > op.max && tam > 12) { tam -= 1; fonte(tam, peso); }
    }
    ctx.fillStyle = op.cor || CORES.navy;
    ctx.textAlign = op.alinha || 'left';
    ctx.textBaseline = op.base || 'middle';
    ctx.fillText(s, x, y);
  }
  function quebrar(s, maxW, tam, peso) {
    fonte(tam, peso || 500);
    const palavras = s.split(' ');
    const linhas = [];
    let atual = '';
    for (const p of palavras) {
      const teste = atual ? atual + ' ' + p : p;
      if (ctx.measureText(teste).width > maxW && atual) { linhas.push(atual); atual = p; }
      else atual = teste;
    }
    if (atual) linhas.push(atual);
    return linhas;
  }
  function escreverLinhas(linhas, x, y, lh, o) {
    linhas.forEach((l, i) => escrever(l, x, y + i * lh, o));
  }
  function fundoPontilhado() {
    const pad = document.createElement('canvas');
    pad.width = 40; pad.height = 40;
    const c2 = pad.getContext('2d');
    c2.fillStyle = 'rgba(13,13,107,0.06)';
    c2.fillRect(18, 18, 3, 3);
    ctx.fillStyle = ctx.createPattern(pad, 'repeat');
    ctx.fillRect(0, 0, LW, LH);
  }

  // ---------- botões e áreas clicáveis ----------
  let UI = [];
  function botao(id, rotulo, x, y, w, h, o) {
    const op = o || {};
    const est = op.estilo || 'primario';
    const dis = !!op.desativado;
    const hover = st.hover === id && !dis;
    let fundo = CORES.navy, sombra = CORES.navyEscuro, cor = '#ffffff', borda = null;
    if (est === 'destaque') { fundo = hover ? '#ffe066' : CORES.amareloForte; sombra = CORES.amareloSombra; cor = CORES.navy; }
    if (est === 'primario') { fundo = hover ? '#1c1c8a' : CORES.navy; }
    if (est === 'secundario') { fundo = hover ? '#f3f5ff' : '#ffffff'; sombra = null; cor = CORES.navy; borda = CORES.navy; }
    if (est === 'fantasma') { fundo = null; sombra = null; cor = CORES.navy; }
    if (dis) { fundo = '#e3e6f1'; sombra = '#d0d4e4'; cor = '#8f94b8'; borda = null; }
    const r = Math.min(22, h / 2);
    if (sombra && !dis) preencher(x, y + 5, w, h, r, sombra);
    if (dis && sombra) preencher(x, y + 4, w, h, r, sombra);
    if (fundo) preencher(x, y, w, h, r, fundo);
    if (borda) contornar(x + 1.5, y + 1.5, w - 3, h - 3, r, borda, 3);
    if (st.foco === id && !dis) contornar(x - 7, y - 7, w + 14, h + 14, r + 7, CORES.amareloForte, 4);
    escrever(rotulo, x + w / 2, y + h / 2, { tam: Math.min(30, h * 0.42), peso: 800, cor, alinha: 'center', max: w - 24 });
    if (!st.modal || op.modal) {
      UI.push({ id, x, y, w, h, fn: op.fn, dis, nav: op.nav !== false && !dis });
    }
  }
  function areaAtiva(px, py) {
    for (let i = UI.length - 1; i >= 0; i--) {
      const b = UI[i];
      if (!b.dis && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
    }
    return null;
  }
  function moverFoco(dirTecla) {
    const nav = UI.filter(b => b.nav);
    if (!nav.length) return;
    const atual = nav.find(b => b.id === st.foco) || nav[0];
    const cx = atual.x + atual.w / 2, cy = atual.y + atual.h / 2;
    const dir = { ArrowRight: 'direita', ArrowLeft: 'esquerda', ArrowDown: 'baixo', ArrowUp: 'cima' }[dirTecla];
    let melhor = null, pior = Infinity;
    for (const b of nav) {
      if (b === atual) continue;
      const dx = b.x + b.w / 2 - cx, dy = b.y + b.h / 2 - cy;
      let ok, principal, lateral;
      if (dir === 'direita') { ok = dx > 4; principal = dx; lateral = Math.abs(dy); }
      else if (dir === 'esquerda') { ok = dx < -4; principal = -dx; lateral = Math.abs(dy); }
      else if (dir === 'baixo') { ok = dy > 4; principal = dy; lateral = Math.abs(dx); }
      else { ok = dy < -4; principal = -dy; lateral = Math.abs(dx); }
      if (!ok) continue;
      const pontos = principal + lateral * 2.2;
      if (pontos < pior) { pior = pontos; melhor = b; }
    }
    if (melhor) st.foco = melhor.id;
    else if (!st.foco) st.foco = atual.id;
  }
  function ativarFoco() {
    const b = UI.find(x => x.id === st.foco && !x.dis && x.fn);
    if (b) b.fn();
  }

  // ---------- robô pixelado (sem gênero) ----------
  // Cada linha tem 10 colunas. Letras: o contorno, y corpo, w tela, e olhos,
  // c bochecha, r antena, s sombra do corpo, g pernas.
  const COR_ROBO = { o: CORES.navy, y: CORES.amarelo, w: '#e8f6ff', e: CORES.navy, c: CORES.rosa, r: CORES.vermelho, s: CORES.amareloSombra, g: CORES.muted };
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
  function desenharRobo(cx, cy, px, dir, humor, t, andando) {
    const sp = dir === 'cima' ? ROBO_COSTAS : (dir === 'esquerda' || dir === 'direita') ? ROBO_LADO : ROBO_FRENTE;
    const espelho = dir === 'esquerda';
    const ow = 10 * px, oh = 11 * px;
    const bob = andando ? Math.round(Math.sin(t / 110) * px * 0.5) * 1 : 0;
    const x0 = cx - ow / 2, y0 = cy - oh / 2 + bob;
    ctx.fillStyle = 'rgba(13,13,107,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + oh / 2 + px * 0.3, ow * 0.34, px * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 10; c++) {
        const ch = sp[r][espelho ? 9 - c : c];
        if (ch === '.') continue;
        ctx.fillStyle = COR_ROBO[ch];
        ctx.fillRect(Math.round(x0 + c * px), Math.round(y0 + r * px), Math.ceil(px), Math.ceil(px));
      }
    }
    if (humor === 'triste') {
      ctx.fillStyle = CORES.azul;
      ctx.fillRect(Math.round(x0 + 9 * px), Math.round(y0 + px), Math.ceil(px), Math.ceil(px * 2));
    }
  }

  // ---------- casas (obstáculo, normal e cores) ----------
  function desenharPadrao(tipo, x, y, cel) {
    const u = cel / 12;
    ctx.fillStyle = TERRENO[tipo].pixel;
    ctx.globalAlpha = 0.3;
    const q = (c, r) => ctx.fillRect(x + c * u, y + r * u, u, u);
    if (tipo === 'v') {                              // X vermelho
      for (let i = 1; i <= 10; i++) { q(i, i); q(11 - i, i); }
    } else if (tipo === 'a') {                       // ondas azuis
      [3, 8].forEach(r => { for (let c = 0; c < 12; c++) if ((c + (r === 8 ? 2 : 0)) % 4 < 2) q(c, r); });
    } else if (tipo === 'y') {                       // faíscas amarelas
      [[1, 1], [10, 1], [5, 4], [1, 10], [10, 10], [6, 8]].forEach(p => q(p[0], p[1]));
    } else if (tipo === 'g') {                       // anel de portal
      for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
        const d = Math.hypot(c - 5.5, r - 5.5);
        if (d >= 4.0 && d <= 4.9) q(c, r);
      }
    }
    ctx.globalAlpha = 1;
  }
  function desenharCasa(x, y, cel, tipo, rot, visitada) {
    const r = cel * 0.16;
    if (tipo === 'o') {                              // obstáculo: tijolos
      preencher(x, y, cel, cel, r, CORES.obst);
      ctx.save();
      rr(x, y, cel, cel, r); ctx.clip();
      const u = cel / 12;
      ctx.fillStyle = CORES.obstTijolo;
      for (let fil = 0; fil < 4; fil++) {
        const yy = y + fil * 3 * u + u * 0.6;
        const off = (fil % 2) * 3 * u;
        for (let xx = -6 * u + off; xx < cel; xx += 6 * u) {
          ctx.fillRect(x + xx + u * 0.6, yy, u * 4.6, u * 1.6);
        }
      }
      ctx.restore();
      contornar(x + 1, y + 1, cel - 2, cel - 2, r, CORES.obstBorda, 2);
      return;
    }
    const base = tipo === 'n' ? (visitada ? CORES.celulaVisit : CORES.celula) : TERRENO[tipo].fundo;
    preencher(x, y, cel, cel, r, base);
    if (tipo !== 'n') {
      ctx.save();
      rr(x, y, cel, cel, r); ctx.clip();
      desenharPadrao(tipo, x, y, cel);
      ctx.restore();
      contornar(x + 1, y + 1, cel - 2, cel - 2, r, TERRENO[tipo].pixel, 3);
    } else {
      contornar(x + 1, y + 1, cel - 2, cel - 2, r, visitada ? '#f2c94c' : CORES.linha, 2);
    }
    if (rot) escrever(rot, x + cel / 2, y + cel / 2 + 1, { tam: cel * 0.36, peso: 800, alinha: 'center', max: cel * 0.84 });
  }

  // ---------- navegação ----------
  function irPara(tela) {
    st.tela = tela;
    assinaturaMenu = '';
    st.exec = null;
    st.modal = null;
    st.pendente = false;
    AGENDA = [];
    st.foco = null;
    st.hover = null;
    st.toast = null;
  }
  function voltar() {
    if (st.modal) return;
    if (st.tela === 'como' || st.tela === 'assuntos') irPara('inicio');
    else if (st.tela === 'mapas') irPara('assuntos');
    else if (st.tela === 'fim') irPara('mapas');
  }
  function sair() {
    st.sequencia = [];
    tocar('clique');
    irPara('inicio');
  }

  // ---------- agenda (pequenos atrasos para a animação ser vista) ----------
  let AGENDA = [];
  function agendar(ms, fn) {
    st.pendente = true;
    AGENDA.push({ em: performance.now() + ms, fn });
  }
  function processarAgenda(t) {
    if (!AGENDA.length) return;
    const prontos = AGENDA.filter(a => t >= a.em);
    AGENDA = AGENDA.filter(a => t < a.em);
    prontos.forEach(a => a.fn());
  }

  // ---------- posição visual do personagem (fila de movimentos) ----------
  // Cada item da fila é um pedaço do caminho: andar até uma casa, ou teleportar.
  const VIS = { de: { c: 0, r: N - 1 }, para: { c: 0, r: N - 1 }, t0: 0, dur: 0, fila: [] };
  let FX = [];                                       // anéis de teleporte
  const celPos = i => ({ c: i % N, r: Math.floor(i / N) });
  function posVisual(t) {
    let guarda = 0;
    while (VIS.fila.length && t >= VIS.t0 + VIS.dur && guarda++ < 10) {
      const prox = VIS.fila.shift();
      VIS.de = VIS.para;
      VIS.para = prox.p;
      VIS.t0 = t;
      if (prox.tele) {
        VIS.de = prox.p;
        VIS.dur = 0;
        FX.push({ c: prox.p.c, r: prox.p.r, t0: t });
      } else {
        VIS.dur = prox.dur;
      }
    }
    if (VIS.dur <= 0 || t >= VIS.t0 + VIS.dur) return VIS.para;
    const p = (t - VIS.t0) / VIS.dur;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    return {
      c: VIS.de.c + (VIS.para.c - VIS.de.c) * e,
      r: VIS.de.r + (VIS.para.r - VIS.de.r) * e
    };
  }
  function irVisual(cel, dur) {
    const t = performance.now();
    const atual = posVisual(t);
    VIS.fila = [];
    VIS.de = atual;
    VIS.para = celPos(cel);
    VIS.t0 = t;
    VIS.dur = dur;
  }
  function teleportar(cel) {
    VIS.fila = [];
    VIS.de = VIS.para = celPos(cel);
    VIS.t0 = 0;
    VIS.dur = 0;
  }
  function enfileirar(seg, ev) {
    seg.forEach((cel, j) => {
      const tele = !!ev && ev.includes('atalho') && j === seg.length - 1 && j > 0;
      VIS.fila.push({ p: celPos(cel), dur: 200, tele });
    });
  }

  // ---------- textos flutuantes ----------
  let FLUT = [];
  function flutuar(cel, texto, cor) { FLUT.push({ cel, texto, cor, vida: 0, max: 1100 }); }

  // ---------- partida ----------
  function iniciarMapa(m) {
    st.mapa = m;
    st.acertos = 0;
    st.tentativasMapa = 0;
    st.streak = 0;
    st.maxSeq = 0;
    st.sequencia = [];
    st.visitas = [];
    st.exec = null;
    st.toast = null;
    FLUT = [];
    st.banco = embaralhar(m.missoesR.map(x => x.k));
    irPara('jogo');
    st.assunto = ASSUNTOS.findIndex(a => a.id === m.assunto);
    sortearMissao();
  }
  function sortearMissao() {
    if (!st.banco.length) st.banco = embaralhar(st.mapa.missoesR.map(x => x.k));
    const k = st.banco.pop();
    st.missaoK = k;
    st.missao = st.mapa.missoesR[k];
    st.L = gerarLayout(st.mapa, k);
    st.alvos = st.L.alvos[0];
    st.otimo = st.L.otimo[0];
    st.tentativasMissao = 0;
    st.errosSeguidos = 0;
    st.dicaMostrada = false;
    st.sequencia = [];
    st.exec = null;
    st.sim = null;
    st.pendente = false;
    st.humor = 'normal';
    voltarInicio(false);
  }
  function voltarInicio(instantaneo) {
    st.pos = st.L.inicio;
    st.visitas = [st.L.inicio];
    if (instantaneo) teleportar(st.pos);
    else irVisual(st.pos, 380);
  }
  function aviso(texto) { st.toast = { texto, ate: performance.now() + 2600 }; }
  function addMov(dir) {
    if (!podeEditar()) return;
    if (st.sequencia.length >= MAX_CMD) {
      aviso(`Limite de ${MAX_CMD} comandos atingido. Apague algum para mudar o caminho.`);
      tocar('erro');
      return;
    }
    st.sequencia.push(dir);
    tocar('clique');
  }
  function apagarUltimo() {
    if (!podeEditar() || !st.sequencia.length) return;
    st.sequencia.pop();
    tocar('clique');
  }
  function limparTudo() {
    if (!podeEditar() || !st.sequencia.length) return;
    st.sequencia = [];
    tocar('clique');
  }
  function executar() {
    if (!podeEditar()) return;
    if (!st.sequencia.length) {
      aviso('Monte o caminho com as setas antes de executar.');
      tocar('erro');
      return;
    }
    st.tentativasMapa++;
    st.tentativasMissao++;
    st.sim = simular(st.L, st.sequencia, st.alvos);
    st.visitas = [st.L.inicio];
    st.custoExec = 0;
    teleportar(st.L.inicio);
    st.pos = st.L.inicio;
    st.exec = { idx: 0, proximoEm: performance.now() + 450, fimEm: 0 };
    st.humor = 'normal';
    tocar('clique');
  }

  // Aplica um passo da execução: move o personagem (com a fila) e mostra o efeito da cor.
  function aplicarPasso(p) {
    st.dirVis = p.dir;
    if (p.ev === 'bloqueio') return;
    st.custoExec += p.custo;
    if (p.ev === 'perdeu') {
      st.tremor = 0.7;
      flutuar(p.de, 'Perdeu o passo!', CORES.vermelho);
      tocar('perdeu');
      return;
    }
    enfileirar(p.seg, p.ev);
    st.pos = p.para;
    st.visitas.push(p.para);
    switch (p.ev) {
      case 'agua':
        flutuar(p.para, 'Escorregou!', '#2a7fd4'); tocar('agua'); break;
      case 'agua_parada':
        flutuar(p.para, 'Água: parou aqui', '#2a7fd4'); tocar('agua'); break;
      case 'choque': case 'agua_choque':
        flutuar(p.para, `+${CUSTO_CHOQUE} passos!`, '#b07d00'); st.tremor = 0.5; tocar('choque'); break;
      case 'atalho': case 'agua_atalho': case 'agua_choque_atalho': case 'choque_atalho':
        flutuar(p.para, 'Teletransporte!', CORES.verde); tocar('atalho'); break;
      default: tocar('passo');
    }
  }
  function atualizarExecucao(t) {
    const e = st.exec;
    if (!e) return;
    if (e.fimEm) {
      if (t >= e.fimEm) { st.exec = null; avaliar(); }
      return;
    }
    if (t < e.proximoEm) return;
    const passos = st.sim.passos;
    if (e.idx >= passos.length) { e.fimEm = t + 550; return; }
    const p = passos[e.idx];
    e.idx++;
    aplicarPasso(p);
    if (p.ev === 'bloqueio') {
      e.fimEm = t + 800;
      st.tremor = 1;
      tocar('bloqueio');
      return;
    }
    e.proximoEm = t + CONFIG.intervaloPassoMs;
  }
  function avaliar() {
    const sim = st.sim;
    if (sim.bloqueio >= 0) return errar('bloqueio');
    if (!sim.sucesso) return errar('outra');
    if (sim.custo > st.mapa.limite) return errar('passos');
    acertar(sim.custo);
  }
  function acertar(custo) {
    const est = estrelasDe(custo, st.otimo);
    registrarEstrela(st.mapa, st.missaoK, est);
    st.acertos++;
    st.streak++;
    st.maxSeq = Math.max(st.maxSeq, st.streak);
    st.errosSeguidos = 0;
    st.humor = 'feliz';
    salvar();
    tocar('acerto');
    if (st.acertos >= st.mapa.concluir) {
      agendar(700, concluirMapa);
      return;
    }
    const frases = ['Isso aí!', 'Muito bem!', 'Certinho!', 'Mandou bem!', 'Arrasou!'];
    let texto = `${'★'.repeat(est)}${'☆'.repeat(3 - est)}  ·  ${custo} passos (melhor caminho: ${st.otimo})`;
    texto += `\nMissão ${st.acertos} de ${st.mapa.concluir} concluída.`;
    if (st.streak >= 3) texto += ` Sequência de ${st.streak} acertos!`;
    agendar(600, () => {
      if (st.tela !== 'jogo') return;
      abrirModal({
        tipo: 'acerto', titulo: frases[(st.acertos - 1) % frases.length], texto,
        botoes: [{ id: 'm-prox', rotulo: 'Próxima missão', estilo: 'primario', fn: () => { fecharModal(); sortearMissao(); } }]
      });
    });
  }
  function errar(tipo) {
    st.errosSeguidos++;
    st.streak = 0;
    st.humor = 'triste';
    tocar(tipo === 'bloqueio' ? 'bloqueio' : 'erro');
    st.pos = st.L.inicio;
    st.visitas = [st.L.inicio];
    irVisual(st.L.inicio, 420);
    let titulo, texto;
    if (tipo === 'bloqueio') {
      titulo = 'Caminho bloqueado!';
      texto = 'O personagem bateu num obstáculo ou saiu da grade. A tentativa conta como erro.';
    } else if (tipo === 'passos') {
      titulo = 'Passos demais!';
      texto = `Chegou ao alvo, mas gastou ${st.sim.custo} passos e o limite é ${st.mapa.limite}. Procure um caminho mais curto e evite as casas amarelas.`;
    } else {
      titulo = 'Não foi dessa vez';
      texto = 'O personagem chegou a outra casa. Confira a trilha: a sequência continua aí para você corrigir.';
    }
    if (st.errosSeguidos >= CONFIG.dicaAposErros && !st.dicaMostrada) texto += ' Já pode pedir uma dica.';
    agendar(600, () => {
      if (st.tela !== 'jogo') return;
      abrirModal({
        tipo: 'erro', titulo, texto,
        botoes: [{ id: 'm-tentar', rotulo: 'Tentar de novo', estilo: 'primario', fn: fecharModal }]
      });
    });
  }
  function mostrarDica() {
    if (!st.missao) return;
    st.dicaMostrada = true;
    tocar('clique');
  }
  function concluirMapa() {
    const p = progressoDe(st.mapa);
    st.progresso[st.mapa.id] = {
      concluido: true,
      estrelas: p.estrelas || [],
      tentativas: p.tentativas && p.tentativas > 0 ? Math.min(p.tentativas, st.tentativasMapa) : st.tentativasMapa
    };
    salvar();
    st.modal = null;
    st.exec = null;
    st.pendente = false;
    st.tela = 'fim';
    st.foco = null;
    confete(130);
    tocar('vitoria');
  }
  function proximoPendente() {
    return MAPAS.find(m => !concluido(m) && m !== st.mapa) || null;
  }

  // ---------- modal ----------
  function abrirModal(m) {
    st.pendente = false;
    st.modal = m;
    st.foco = m.botoes[0].id;
  }
  function fecharModal() {
    st.modal = null;
    st.foco = null;
    st.pendente = false;
  }

  // ---------- confete (ao concluir o mapa) ----------
  let CONF = [];
  function confete(n) {
    for (let i = 0; i < n; i++) {
      CONF.push({
        x: 800 + (Math.random() - 0.5) * 320, y: 300,
        vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 6,
        r: Math.random() * 6 + 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        cor: CORES_CONFETE[i % CORES_CONFETE.length], vida: 0, max: 1800 + Math.random() * 1200
      });
    }
  }
  function atualizarConfete(dt) {
    for (const p of CONF) { p.vida += dt; p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.rot += p.vr; }
    CONF = CONF.filter(p => p.vida < p.max && p.y < LH + 40);
  }
  function desenharConfete() {
    for (const p of CONF) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      ctx.restore();
    }
  }

  // ---------- grade ----------
  function geoGrade(gx, gy, lado) {
    const gap = lado * 0.02;
    const cel = (lado - gap * (N - 1)) / N;
    return {
      cel, gap,
      cx: c => gx + c * (cel + gap) + cel / 2,
      cy: r => gy + r * (cel + gap) + cel / 2,
      centro: i => ({ x: gx + (i % N) * (cel + gap) + cel / 2, y: gy + Math.floor(i / N) * (cel + gap) + cel / 2 })
    };
  }

  // Trilha: liga as casas por onde o personagem passa, com a numeração dos passos.
  function desenharTrilha(geo, sim) {
    if (!sim || !sim.passos.length) return;
    const cel = geo.cel;
    let atual = geo.centro(st.L.inicio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    sim.passos.forEach((p, j) => {
      if (p.ev === 'bloqueio') {
        const c = geo.centro(p.de);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = CORES.vermelho;
        ctx.lineWidth = Math.max(4, cel * 0.07);
        ctx.beginPath(); ctx.arc(c.x, c.y, cel * 0.44, 0, Math.PI * 2); ctx.stroke();
        return;
      }
      const b = geo.centro(p.para);
      const teleporte = !!p.ev && p.ev.includes('atalho');
      const cor = teleporte ? CORES.verde : (p.ev && p.ev.includes('agua')) ? '#2a7fd4' : CORES.navy;
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = p.para === p.de ? CORES.vermelho : cor;
      ctx.lineWidth = Math.max(3, cel * 0.06);
      if (teleporte) ctx.setLineDash([9, 7]);
      ctx.beginPath();
      if (p.para === p.de) ctx.arc(b.x, b.y, cel * 0.42, 0, Math.PI * 2);
      else { ctx.moveTo(atual.x, atual.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (p.para !== p.de) {
        const nx = b.x - cel * 0.3, ny = b.y - cel * 0.3;
        ctx.beginPath();
        ctx.fillStyle = cor;
        ctx.arc(nx, ny, cel * 0.12, 0, Math.PI * 2);
        ctx.fill();
        escrever(String(j + 1), nx, ny + 1, { tam: cel * 0.15, peso: 900, cor: '#fff', alinha: 'center' });
      }
      atual = b;
    });
  }

  // Desenha a grade inteira, a trilha, os anéis de teleporte, os textos e o robô.
  function desenharGrade(gx, gy, lado, t, sim) {
    const L = st.L;
    const geo = geoGrade(gx, gy, lado);
    const cel = geo.cel;
    for (let i = 0; i < N * N; i++) {
      const x = geo.cx(i % N) - cel / 2, y = geo.cy(Math.floor(i / N)) - cel / 2;
      const tipo = L.obst[i] ? 'o' : L.tipo[i];
      const visitada = i !== L.inicio && st.visitas.includes(i);
      desenharCasa(x, y, cel, tipo, L.rot[i], visitada);
      if (i === L.inicio) escrever('INÍCIO', x + cel / 2, y + cel * 0.82, { tam: cel * 0.13, peso: 800, cor: CORES.muted, alinha: 'center' });
    }
    desenharTrilha(geo, sim);
    FX = FX.filter(f => t - f.t0 < 450);
    FX.forEach(f => {
      const k = (t - f.t0) / 450;
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = CORES.verde;
      ctx.lineWidth = 6 * (1 - k) + 2;
      ctx.beginPath();
      ctx.arc(geo.cx(f.c), geo.cy(f.r), cel * (0.3 + k * 0.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    FLUT.forEach(f => {
      const c = geo.centro(f.cel);
      const k = f.vida / f.max;
      ctx.globalAlpha = 1 - k;
      escrever(f.texto, c.x, c.y - cel * 0.45 - k * cel * 0.5, { tam: cel * 0.17, peso: 900, cor: f.cor, alinha: 'center', max: cel * 2.2 });
      ctx.globalAlpha = 1;
    });
    const pos = posVisual(t);
    const px = cel / 12.4;
    desenharRobo(geo.cx(pos.c), geo.cy(pos.r), px, st.dirVis, st.humor, t, !!st.exec);
    return geo;
  }

  // ---------- espaçamento: múltiplos de 4 ----------
  const G = 4;
  const q4 = v => Math.round(v / G) * G;

  // ---------- tela de jogo (responsiva) ----------
  // Paisagem: grade à esquerda, painéis à direita. Retrato: tudo empilhado.
  function geometriaJogo() {
    const larga = LW >= 1200;
    const M = 40, GAP = 16;
    const topo = 264;
    const alturaPainel = 196, alturaLegenda = 184, alturaControles = 184;
    if (larga) {
      const dirW = 792, dirX = LW - M - dirW;
      const gridW = q4(dirX - M - 32);
      const gridH = q4(LH - topo - 20);
      const cmdY = topo, legY = cmdY + alturaPainel + GAP;
      const ctlY = legY + alturaLegenda + GAP;
      return {
        larga, grid: { x: M, y: topo, w: gridW, h: gridH },
        cmd: { x: dirX, y: cmdY, w: dirW, h: alturaPainel },
        leg: { x: dirX, y: legY, w: dirW, h: alturaLegenda },
        ctl: { x: dirX, y: ctlY, w: dirW, h: q4(LH - M - ctlY) }
      };
    }
    const larg = LW - 2 * M;
    const gridH = q4(larg);
    const cmdY = topo + gridH + GAP + 40;
    const legY = cmdY + alturaPainel + GAP, ctlY = legY + alturaLegenda + GAP;
    return {
      larga: false, grid: { x: M, y: topo, w: larg, h: gridH + 40 },
      cmd: { x: M, y: cmdY, w: larg, h: alturaPainel },
      leg: { x: M, y: legY, w: larg, h: alturaLegenda },
      ctl: { x: M, y: ctlY, w: larg, h: alturaControles }
    };
  }

  function telaJogo(t) {
    const m = st.mapa, mis = st.missao;
    const a = ASSUNTOS.find(x => x.id === m.assunto) || ASSUNTOS[0];
    const sim = st.exec ? st.sim : simular(st.L, st.sequencia, st.alvos);
    const g = geometriaJogo();
    const dir = LW - 40;                                          // borda direita

    // cabeçalho: Sair à esquerda; som e tela cheia à direita
    botao('jogo-sair', 'Sair', 40, 24, 160, 60, { estilo: 'secundario', fn: sair, nav: false });
    escrever(`Missão ${Math.min(st.acertos + 1, m.concluir)} de ${m.concluir}`, 228, 46, { tam: 32, peso: 900 });
    escrever(m.nome, 228, 76, { tam: 20, peso: 500, cor: CORES.muted });
    const cxIni = Math.min(540, dir - 348 - 32 - m.concluir * 32);
    for (let j = 0; j < m.concluir; j++) {
      const cx = cxIni + j * 32, cy = 56;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      if (j < st.acertos) { ctx.fillStyle = CORES.verde; ctx.fill(); }
      else { ctx.lineWidth = 3; ctx.strokeStyle = CORES.navy; ctx.stroke(); }
    }
    if (st.streak >= 2 && g.larga) {
      const txt = `Sequência ×${st.streak}`;
      const w = medir(txt, 20, 800) + 36;
      const sx = cxIni + m.concluir * 32 + 24;
      preencher(sx, 30, w, 52, 24, CORES.amarelo);
      escrever(txt, sx + w / 2, 56, { tam: 20, peso: 800, alinha: 'center' });
    }
    botao('jogo-som', st.som ? 'Som ✓' : 'Som ✕', dir - 348, 24, 120, 60, { estilo: 'secundario', fn: alternarSom, nav: false });
    botao('jogo-tela', 'Tela cheia', dir - 212, 24, 212, 60, { estilo: 'secundario', fn: telaCheia, nav: false });

    // cartão da missão
    cartao(40, 104, LW - 80, 140, 24);
    const wa = medir(a.nome, 20, 800) + 36;
    preencher(64, 124, wa, 36, 16, a.cor);
    escrever(a.nome, 64 + wa / 2, 142, { tam: 20, peso: 800, alinha: 'center' });
    escrever(`Tentativas: ${st.tentativasMissao}`, 64 + wa + 24, 142, { tam: 20, peso: 500, cor: CORES.muted });
    escrever(mis.texto, LW / 2, 176, { tam: 40, peso: 800, alinha: 'center', max: LW - 160 });
    if (st.dicaMostrada) {
      const txt = 'Dica: ' + mis.dica;
      const w = Math.min(LW - 160, medir(txt, 20, 700) + 40);
      preencher(LW / 2 - w / 2, 200, w, 36, 16, CORES.amareloSuave);
      escrever(txt, LW / 2, 218, { tam: 20, peso: 700, alinha: 'center', max: w - 24 });
    }
    if (st.errosSeguidos >= CONFIG.dicaAposErros && !st.dicaMostrada && !st.exec) {
      botao('jogo-dica', 'Ver dica (H)', dir - 200, 124, 200, 40, { estilo: 'destaque', fn: mostrarDica, nav: false });
    }

    // grade (quadrada, centrada no cartão)
    cartao(g.grid.x, g.grid.y, g.grid.w, g.grid.h, 24);
    const lado = q4(Math.min(g.grid.w, g.grid.h) - 80);
    const gx = q4(g.grid.x + (g.grid.w - lado) / 2) + (st.tremor > 0 ? Math.sin(t / 22) * st.tremor * 8 : 0);
    const gy = q4(g.grid.y + 20);
    desenharGrade(gx, gy, lado, t, sim);
    const info = !st.sequencia.length
      ? 'Monte o caminho com as setas: a trilha aparece aqui.'
      : sim.bloqueio >= 0
        ? `Atenção: o caminho bate num obstáculo no comando ${sim.bloqueio + 1}.`
        : `Custo previsto: ${sim.custo} de ${m.limite} passos`;
    escrever(info, g.grid.x + g.grid.w / 2, g.grid.y + g.grid.h - 20, { tam: 20, peso: 600, cor: CORES.muted, alinha: 'center', max: g.grid.w - 40 });

    // comandos montados (máximo 20: duas linhas de 10)
    const c = g.cmd, chip = 60, passo = 68;
    cartao(c.x, c.y, c.w, c.h, 24);
    escrever('Seu caminho', c.x + 28, c.y + 32, { tam: 26, peso: 900 });
    escrever(`Comandos ${st.sequencia.length}/${MAX_CMD}  ·  Passos ${st.exec ? st.custoExec : sim.custo}/${m.limite}`,
      c.x + c.w - 28, c.y + 32, { tam: 19, peso: 600, cor: CORES.muted, alinha: 'right' });
    if (!st.sequencia.length) {
      escrever('Use as setas para montar o caminho.', c.x + c.w / 2, c.y + 120, { tam: 22, peso: 500, cor: CORES.muted, alinha: 'center' });
    }
    st.sequencia.forEach((d, i) => {
      const row = Math.floor(i / 10), col = i % 10;
      const x = c.x + 28 + col * passo, y = c.y + 64 + row * passo;
      const atual = st.exec && i === st.exec.idx - 1;
      const feito = st.exec && i < st.exec.idx - 1;
      const fundo = atual ? CORES.amareloForte : feito ? '#dff3e9' : '#ffffff';
      preencher(x, y, chip, chip, 12, fundo);
      contornar(x + 1, y + 1, chip - 2, chip - 2, 12, atual ? CORES.navy : CORES.linha, atual ? 3 : 2);
      escrever(GLIFO[d], x + chip / 2, y + chip / 2 + 1, { tam: 32, peso: 900, alinha: 'center' });
      const pi = sim.passos[i];
      if (pi && pi.ev) {
        const cor = pi.ev === 'bloqueio' || pi.ev === 'perdeu' ? CORES.vermelho : pi.ev.includes('agua') ? CORES.azul
          : pi.ev.includes('choque') ? CORES.amareloSombra : CORES.verde;
        ctx.beginPath(); ctx.fillStyle = cor; ctx.arc(x + chip - 8, y + 8, 6, 0, Math.PI * 2); ctx.fill();
      }
    });

    // legenda das cores (sempre visível: reduz a carga de memória)
    const l = g.leg;
    cartao(l.x, l.y, l.w, l.h, 24);
    escrever('Cores do caminho', l.x + 28, l.y + 28, { tam: 22, peso: 900 });
    const colW = Math.floor((l.w - 56) / 2);
    ['v', 'a', 'y', 'g'].forEach((tp, i) => {
      const x = l.x + 28 + (i % 2) * colW, y = l.y + 52 + Math.floor(i / 2) * 48;
      desenharCasa(x, y, 40, tp, '', false);
      escrever(TERRENO[tp].nome, x + 56, y + 12, { tam: 20, peso: 900 });
      escrever(TERRENO[tp].regra, x + 56, y + 32, { tam: 16, peso: 500, cor: CORES.muted, max: colW - 64 });
    });
    escrever('Cinza com tijolos: obstáculo, não pode passar.', l.x + 28, l.y + l.h - 20, { tam: 16, peso: 500, cor: CORES.muted, max: l.w - 56 });

    // controles: setas (WASD também), executar e desfazer
    const k = g.ctl;
    cartao(k.x, k.y, k.w, k.h, 24);
    const dis = ocupado();
    const bs = 56, pg = 64, px0 = k.x + 28, py0 = k.y + 24;
    botao('dir-cima', GLIFO.cima, px0 + pg, py0, bs, bs, { estilo: 'secundario', fn: () => addMov('cima'), nav: false, desativado: dis });
    botao('dir-esq', GLIFO.esquerda, px0, py0 + pg, bs, bs, { estilo: 'secundario', fn: () => addMov('esquerda'), nav: false, desativado: dis });
    botao('dir-baixo', GLIFO.baixo, px0 + pg, py0 + pg, bs, bs, { estilo: 'secundario', fn: () => addMov('baixo'), nav: false, desativado: dis });
    botao('dir-dir', GLIFO.direita, px0 + pg * 2, py0 + pg, bs, bs, { estilo: 'secundario', fn: () => addMov('direita'), nav: false, desativado: dis });
    const xe = k.x + 28 + 3 * pg + 16, we = k.x + k.w - 28 - xe;
    botao('jogo-exec', 'Executar (Enter)', xe, k.y + 24, we, 96, { estilo: 'destaque', fn: executar, nav: false, desativado: dis || !st.sequencia.length });
    const wb = Math.floor((we - 16) / 2);
    botao('jogo-apagar', 'Desfazer (⌫)', xe, k.y + 136, wb, 44, { estilo: 'secundario', fn: apagarUltimo, nav: false, desativado: dis || !st.sequencia.length });
    botao('jogo-limpar', 'Limpar (Del)', xe + wb + 16, k.y + 136, wb, 44, { estilo: 'secundario', fn: limparTudo, nav: false, desativado: dis || !st.sequencia.length });
  }
  // ---------- menus em HTML (Etapa 2) ----------
  const menuHTML = document.getElementById('menu-html');
  let assinaturaMenu = '';
  const escapeHTML = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const telaDeMenu = () => ['inicio', 'como', 'assuntos', 'mapas'].includes(st.tela);

  function progressoMenu() {
    return MAPAS.map(m => {
      const p = progressoDe(m);
      return `${m.id}:${p.concluido ? 1 : 0}:${(p.estrelas || []).join('')}`;
    }).join('|');
  }

  function previewMenu() {
    const obst = new Set([6, 7, 12, 17, 18]);
    const tipos = { 3: 'vermelho', 11: 'azul', 14: 'amarelo', 4: 'verde', 24: 'verde' };
    const casas = Array.from({ length: N * N }, (_, i) => {
      const tipo = obst.has(i) ? 'obstaculo' : (tipos[i] || 'normal');
      const rotulo = i === 9 ? '9' : '';
      return `<span class="scr-preview-cell ${tipo}">${rotulo}</span>`;
    }).join('');
    const robo = [
      '....rr....', '....oo....', '..oooooo..', '.oyyyyyyo.', '.owwwwwwo.',
      '.owewwewo.', '.ocwoowco.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..'
    ];
    const cores = { o: '#0d0d6b', y: '#ffd23f', w: '#e8f6ff', e: '#0d0d6b', c: '#ff6fa0', r: '#e5484d', s: '#e0a800', g: '#6b6f9c' };
    const pixels = robo.map(linha => [...linha].map(ch => `<i${ch === '.' ? '' : ` style="--pixel:${cores[ch]}"`}></i>`).join('')).join('');
    return `<div class="scr-preview-card" aria-label="Prévia do tabuleiro">
      <div class="scr-preview-grid">${casas}</div>
      <div class="scr-preview-robot" aria-hidden="true"><span>${pixels}</span></div>
    </div>`;
  }

  function botaoMenu(rotulo, acao, classe = 'primary') {
    return `<button class="scr-button ${classe}" type="button" data-action="${acao}">${escapeHTML(rotulo)}</button>`;
  }

  function telaInicioHTML() {
    const feitos = MAPAS.filter(concluido).length;
    const est = MAPAS.reduce((s, m) => s + estrelasMapa(m), 0);
    const maxE = MAPAS.reduce((s, m) => s + maxEstrelas(m), 0);
    return `<section class="scr-page scr-home">
      <div class="scr-home-copy">
        <span class="scr-kicker">Pensamento computacional</span>
        <h1>ScrEM</h1>
        <p class="scr-lead">Programe o caminho do personagem, escolha as cores certas e resolva a missão de matemática.</p>
        <p class="scr-progress">Mapas concluídos: <strong>${feitos} de ${MAPAS.length}</strong><span>·</span> Estrelas: <strong>${est} de ${maxE}</strong></p>
        <div class="scr-actions">${botaoMenu('Começar', 'inicio-comecar')}${botaoMenu('Como jogar', 'inicio-como', 'secondary')}</div>
        <p class="scr-shortcuts">Setas ou WASD: montar · Enter: executar · Backspace: desfazer · H: dica · F: tela cheia · M: som</p>
      </div>
      <div class="scr-home-art">${previewMenu()}</div>
      <div class="scr-top-actions">${botaoMenu(st.som ? 'Som: ligado' : 'Som: desligado', 'som', 'ghost')}${botaoMenu('Tela cheia', 'fullscreen', 'ghost')}</div>
    </section>`;
  }

  function telaComoHTML() {
    const passos = [
      ['Leia a missão', 'Ela diz qual casa com número o personagem precisa alcançar.'],
      ['Monte o caminho', 'Use as setas ou WASD. Cada tecla é um passo para a casa ao lado.'],
      ['Respeite as cores', `Vermelho perde o passo; azul escorrega; amarelo custa ${CUSTO_CHOQUE} passos; verde leva ao outro verde.`],
      ['Ganhe estrelas', 'Quanto menos passos, mais estrelas. ★★★ é o melhor caminho possível.']
    ];
    return `<section class="scr-page">
      <header class="scr-page-heading"><h1>Como jogar</h1></header>
      <div class="scr-how-grid">${passos.map((p, i) => `<article class="scr-card scr-how-card"><span class="scr-step">${i + 1}</span><h2>${escapeHTML(p[0])}</h2><p>${escapeHTML(p[1])}</p></article>`).join('')}</div>
      <aside class="scr-keyboard-card"><h2>Teclado</h2><p>Setas ou WASD: montar · Enter: executar · Backspace: desfazer · Delete: limpar · H: dica · Esc: sair</p></aside>
      <footer class="scr-page-actions">${botaoMenu('Voltar', 'como-voltar', 'secondary')}${botaoMenu('Começar', 'como-comecar')}</footer>
    </section>`;
  }

  function telaAssuntosHTML() {
    const cards = ASSUNTOS.map((a, i) => {
      const ms = mapasDoAssunto(i);
      const feitos = ms.filter(concluido).length;
      const est = ms.reduce((s, m) => s + estrelasMapa(m), 0);
      const maxE = ms.reduce((s, m) => s + maxEstrelas(m), 0);
      const frac = ms.length ? feitos / ms.length * 100 : 0;
      return `<button class="scr-card scr-subject-card" type="button" data-action="assunto" data-index="${i}" style="--subject-color:${escapeHTML(a.cor)}">
        <span class="scr-subject-icon">${escapeHTML(a.icone)}</span><h2>${escapeHTML(a.nome)}</h2>
        <span class="scr-progress-track"><span style="width:${frac}%"></span></span>
        <p>${feitos} de ${ms.length} mapas concluídos</p><strong>★ ${est} de ${maxE}${feitos === ms.length && ms.length ? ' · completo' : ''}</strong>
      </button>`;
    }).join('');
    return `<section class="scr-page"><header class="scr-page-heading"><h1>Escolha um assunto</h1><p>Matemática · Ensino Médio</p></header>
      <div class="scr-subject-grid">${cards}</div>
      <footer class="scr-page-actions">${botaoMenu('Início', 'assuntos-voltar', 'secondary')}</footer></section>`;
  }

  function telaMapasHTML() {
    const a = ASSUNTOS[st.assunto];
    const ms = mapasDoAssunto(st.assunto);
    const cards = ms.map(m => {
      const nv = NIVEIS[m.nivel] || NIVEIS[1];
      const status = concluido(m) ? '<span class="scr-completed">✓ Concluído</span>' : '';
      return `<button class="scr-card scr-map-card" type="button" data-action="mapa" data-map-id="${escapeHTML(m.id)}" style="--subject-color:${escapeHTML(a.cor)}">
        <span class="scr-map-badges"><span class="scr-level" style="--level-color:${escapeHTML(nv.cor)}">${escapeHTML(nv.nome)}</span>${!m.fixo ? '<span class="scr-random">Cores sorteadas</span>' : ''}${status}</span>
        <h2>${escapeHTML(m.nome)}</h2><p>${escapeHTML(m.tema)}</p>
        <span class="scr-map-meta">Acerte ${m.concluir} de ${m.missoes.length} missões · até ${m.limite} passos</span>
        <strong class="scr-map-stars">★ ${estrelasMapa(m)} de ${maxEstrelas(m)}</strong>
      </button>`;
    }).join('');
    return `<section class="scr-page"><header class="scr-page-heading scr-map-heading" style="--subject-color:${escapeHTML(a.cor)}"><h1>${escapeHTML(a.nome)}</h1><p>${escapeHTML(a.mapas_desc)}</p></header>
      ${ms.length ? `<div class="scr-map-grid">${cards}</div>` : '<p class="scr-empty">Em breve, mais mapas neste assunto.</p>'}
      <footer class="scr-page-actions">${botaoMenu('Assuntos', 'mapas-voltar', 'secondary')}</footer></section>`;
  }

  function renderizarMenuHTML() {
    if (!menuHTML || !telaDeMenu() || st.tela === 'inicio') return;
    const assinatura = `${st.tela}|${st.assunto}|${st.som}|${progressoMenu()}`;
    if (assinatura === assinaturaMenu) return;
    assinaturaMenu = assinatura;
    const telas = {
      inicio: telaInicioHTML,
      como: telaComoHTML,
      assuntos: telaAssuntosHTML,
      mapas: telaMapasHTML
    };
    menuHTML.innerHTML = telas[st.tela]();
  }

  if (menuHTML) {
    menuHTML.addEventListener('click', e => {
      const alvo = e.target.closest('[data-action]');
      if (!alvo) return;
      liberarAudio();
      const acao = alvo.dataset.action;
      if (acao === 'inicio-comecar' || acao === 'como-comecar') irPara('assuntos');
      else if (acao === 'inicio-como') irPara('como');
      else if (acao === 'como-voltar') irPara('inicio');
      else if (acao === 'assuntos-voltar') irPara('inicio');
      else if (acao === 'mapas-voltar') irPara('assuntos');
      else if (acao === 'som') alternarSom();
      else if (acao === 'fullscreen') telaCheia();
      else if (acao === 'assunto') { st.assunto = Number(alvo.dataset.index); irPara('mapas'); }
      else if (acao === 'mapa') {
        const mapa = MAPA_POR_ID[alvo.dataset.mapId];
        if (mapa) iniciarMapa(mapa);
      }
      assinaturaMenu = '';
      renderizarMenuHTML();
    });
  }

  // ---------- telas de menu (responsivas, espaçamento de 4 em 4) ----------
  const larguraPainel = () => LW >= 1200;

  function telaInicio(t) {
    const wide = larguraPainel();
    const pl = wide ? 580 : q4(Math.min(840, LW - 160));
    const px = wide ? q4(LW - 40 - pl) : q4((LW - pl) / 2);
    const py = wide ? 152 : 120;
    const dy = wide ? 0 : (py + pl + 60) - 340;     // texto e botões descem quando a tela é estreita
    const tx = wide ? 110 : q4(LW / 2);
    const alinha = wide ? 'left' : 'center';
    const etiqueta = 'Pensamento computacional';
    const w = medir(etiqueta, 24, 700) + 56;
    preencher(wide ? 110 : (LW - w) / 2, 180 + dy, w, 52, 24, CORES.amareloForte);
    escrever(etiqueta, wide ? 138 : LW / 2, 206 + dy, { tam: 24, peso: 700, alinha: wide ? 'left' : 'center' });
    escrever('ScrEM', tx, 340 + dy, { tam: wide ? 180 : 140, peso: 900, alinha });
    const linhas = quebrar('Programe o caminho do personagem, escolha as cores certas e resolva a missão de matemática.', wide ? 760 : LW - 160, 32, 500);
    escreverLinhas(linhas, tx, 462 + dy, 44, { tam: 32, peso: 500, cor: CORES.muted, alinha });
    const feitos = MAPAS.filter(concluido).length;
    const est = MAPAS.reduce((s, m) => s + estrelasMapa(m), 0);
    const maxE = MAPAS.reduce((s, m) => s + maxEstrelas(m), 0);
    escrever(`Mapas concluídos: ${feitos} de ${MAPAS.length}   ·   Estrelas: ${est} de ${maxE}`, tx, 580 + dy,
      { tam: 26, peso: 800, alinha });
    const by = 640 + dy;
    if (wide) {
      botao('inicio-comecar', 'Começar', 110, by, 320, 100, { estilo: 'primario', fn: () => irPara('assuntos') });
      botao('inicio-como', 'Como jogar', 460, by, 300, 100, { estilo: 'secundario', fn: () => irPara('como') });
    } else {
      botao('inicio-comecar', 'Começar', (LW - 320) / 2, by, 320, 100, { estilo: 'primario', fn: () => irPara('assuntos') });
      botao('inicio-como', 'Como jogar', (LW - 300) / 2, by + 124, 300, 100, { estilo: 'secundario', fn: () => irPara('como') });
    }
    escrever('Setas ou WASD: montar · Enter: executar · Backspace: desfazer · H: dica · F: tela cheia · M: som',
      tx, by + (wide ? 220 : 264), { tam: 20, peso: 500, cor: CORES.muted, alinha, max: LW - 80 });

    // pré-visualização: casas coloridas e o robô
    cartao(px, py, pl, pl, 36);
    const lado = q4(pl - 96), gx = q4(px + (pl - lado) / 2), gy = q4(py + (pl - lado) / 2);
    const geo = geoGrade(gx, gy, lado);
    const obst = [6, 7, 12, 17, 18];
    const tipos = { 3: 'v', 11: 'a', 14: 'y', 4: 'g', 24: 'g' };
    for (let i = 0; i < N * N; i++) {
      const x = geo.cx(i % N) - geo.cel / 2, y = geo.cy(Math.floor(i / N)) - geo.cel / 2;
      const tipo = obst.includes(i) ? 'o' : (tipos[i] || 'n');
      desenharCasa(x, y, geo.cel, tipo, i === 9 ? '9' : '', false);
    }
    desenharRobo(geo.cx(0), geo.cy(4) + Math.sin(t / 420) * 4, geo.cel / 12.4, 'direita', 'feliz', t, false);

    botao('inicio-som', st.som ? 'Som: ligado' : 'Som: desligado', LW - 40 - 440, 36, 220, 56, { estilo: 'fantasma', fn: alternarSom });
    botao('inicio-tela', 'Tela cheia', LW - 40 - 208, 36, 208, 56, { estilo: 'fantasma', fn: telaCheia });
  }

  function telaComo() {
    const wide = larguraPainel();
    escrever('Como jogar', 40, 140, { tam: 60, peso: 900 });
    const passos = [
      ['Leia a missão', 'Ela diz qual casa com número o personagem precisa alcançar.'],
      ['Monte o caminho', 'Use as setas ou WASD. Cada tecla é um passo para a casa ao lado.'],
      ['Respeite as cores', `Vermelho perde o passo; azul escorrega; amarelo custa ${CUSTO_CHOQUE} passos; verde leva ao outro verde.`],
      ['Ganhe estrelas', 'Quanto menos passos, mais estrelas. ★★★ é o melhor caminho possível.']
    ];
    const porLinha = wide ? 4 : 2;
    const cw = q4((LW - 80 - (porLinha - 1) * 24) / porLinha);
    passos.forEach((p, i) => {
      const x = 40 + (i % porLinha) * (cw + 24), y = 220 + Math.floor(i / porLinha) * 300;
      cartao(x, y, cw, 276, 28);
      preencher(x + 28, y + 28, 56, 56, 28, CORES.navy);
      escrever(String(i + 1), x + 56, y + 56, { tam: 30, peso: 900, cor: '#fff', alinha: 'center' });
      escrever(p[0], x + 28, y + 116, { tam: 28, peso: 800, max: cw - 56 });
      escreverLinhas(quebrar(p[1], cw - 56, 22, 500), x + 28, y + 160, 30, { tam: 22, peso: 500, cor: CORES.muted });
    });
    const yT = 220 + Math.ceil(passos.length / porLinha) * 300 + 8;
    cartao(40, yT, LW - 80, 108, 24);
    escrever('Teclado', 68, yT + 36, { tam: 24, peso: 800 });
    escrever('Setas ou WASD: montar  ·  Enter: executar  ·  Backspace: desfazer  ·  Delete: limpar  ·  H: dica  ·  Esc: sair',
      68, yT + 80, { tam: 20, peso: 500, cor: CORES.muted, max: LW - 136 });
    const yB = yT + 136;
    botao('como-voltar', 'Voltar', 40, yB, 280, 88, { estilo: 'secundario', fn: () => irPara('inicio') });
    botao('como-comecar', 'Começar', LW - 40 - 280, yB, 280, 88, { estilo: 'primario', fn: () => irPara('assuntos') });
  }

  function telaAssuntos() {
    const wide = larguraPainel();
    const porLinha = wide ? 4 : 2;
    escrever('Escolha um assunto', 40, 150, { tam: 56, peso: 900 });
    escrever('Matemática · Ensino Médio', 40, 206, { tam: 24, peso: 500, cor: CORES.muted });
    const cw = q4((LW - 80 - (porLinha - 1) * 28) / porLinha), ch = 276, gap = 28;
    ASSUNTOS.forEach((a, i) => {
      const lin = Math.floor(i / porLinha);
      const nNaLinha = Math.min(porLinha, ASSUNTOS.length - lin * porLinha);
      const idx = i % porLinha;
      const larg = nNaLinha * cw + (nNaLinha - 1) * gap;
      const x = q4((LW - larg) / 2 + idx * (cw + gap));
      const y = 256 + lin * (ch + 28);
      const ms = mapasDoAssunto(i);
      const feitos = ms.filter(concluido).length;
      const est = ms.reduce((s, m) => s + estrelasMapa(m), 0);
      const maxE = ms.reduce((s, m) => s + maxEstrelas(m), 0);
      cartao(x, y, cw, ch, 28);
      preencher(x, y, cw, 12, 6, a.cor);
      preencher(x + 28, y + 40, 68, 68, 34, a.cor);
      escrever(a.icone, x + 62, y + 76, { tam: a.icone.length > 2 ? 24 : 34, peso: 900, alinha: 'center', max: 56 });
      escreverLinhas(quebrar(a.nome, cw - 56, 28, 800), x + 28, y + 140, 34, { tam: 28, peso: 800 });
      preencher(x + 28, y + 200, cw - 56, 12, 6, '#e6e9f5');
      const frac = ms.length ? feitos / ms.length : 0;
      if (frac > 0) preencher(x + 28, y + 200, Math.max(12, (cw - 56) * frac), 12, 6, a.cor);
      escrever(`${feitos} de ${ms.length} mapas concluídos`, x + 28, y + 224, { tam: 19, peso: 500, cor: CORES.muted });
      escrever(`★ ${est} de ${maxE}${feitos === ms.length && ms.length ? '   ✓ completo' : ''}`, x + 28, y + 244,
        { tam: 19, peso: 800, cor: CORES.navy, max: cw - 48 });
      UI.push({ id: 'assunto-' + i, x, y, w: cw, h: ch, fn: () => { st.assunto = i; irPara('mapas'); }, dis: false, nav: true });
    });
    botao('assuntos-voltar', 'Início', 40, 40, 200, 60, { estilo: 'secundario', fn: () => irPara('inicio') });
  }

  function telaMapas() {
    const wide = larguraPainel();
    const a = ASSUNTOS[st.assunto];
    preencher(40, 120, 20, 88, 10, a.cor);
    escrever(a.nome, 80, 150, { tam: 52, peso: 900 });
    escrever(a.mapas_desc, 82, 208, { tam: 24, peso: 500, cor: CORES.muted });
    const ms = mapasDoAssunto(st.assunto);
    const porLinha = wide ? 2 : 1, gap = 32;
    const cw = q4(wide ? (LW - 80 - gap) / 2 : LW - 80), ch = 228;
    ms.forEach((m, i) => {
      const col = i % porLinha, lin = Math.floor(i / porLinha);
      const x = 40 + col * (cw + gap), y = 256 + lin * (ch + 28);
      cartao(x, y, cw, ch, 28);
      preencher(x + 16, y + 28, 10, ch - 56, 5, a.cor);
      const nv = NIVEIS[m.nivel] || NIVEIS[1];
      const wn = medir(nv.nome, 20, 800) + 32;
      preencher(x + 44, y + 28, wn, 36, 18, nv.cor);
      escrever(nv.nome, x + 44 + wn / 2, y + 46, { tam: 20, peso: 800, cor: '#fff', alinha: 'center' });
      if (!m.fixo) {
        const wr = medir('Cores sorteadas', 18, 800) + 28;
        preencher(x + 60 + wn, y + 28, wr, 36, 18, '#ffe9a8');
        escrever('Cores sorteadas', x + 60 + wn + wr / 2, y + 46, { tam: 18, peso: 800, alinha: 'center' });
      }
      if (concluido(m)) {
        preencher(x + cw - 200, y + 28, 164, 40, 20, CORES.verde);
        escrever('✓ Concluído', x + cw - 118, y + 48, { tam: 20, peso: 800, cor: '#fff', alinha: 'center' });
      }
      escrever(m.nome, x + 44, y + 108, { tam: 38, peso: 900, max: cw - 88 });
      escrever(m.tema, x + 44, y + 150, { tam: 24, peso: 500, cor: CORES.muted, max: cw - 88 });
      escrever(`Acerte ${m.concluir} de ${m.missoes.length} missões · até ${m.limite} passos`, x + 44, y + 188,
        { tam: 19, peso: 500, cor: CORES.muted, max: cw - 88 });
      escrever(`★ ${estrelasMapa(m)} de ${maxEstrelas(m)}`, x + cw - 44, y + 188, { tam: 20, peso: 900, cor: CORES.navy, alinha: 'right' });
      UI.push({ id: 'mapa-' + m.id, x, y, w: cw, h: ch, fn: () => iniciarMapa(m), dis: false, nav: true });
    });
    if (!ms.length) escrever('Em breve, mais mapas neste assunto.', 40, 360, { tam: 28, peso: 600, cor: CORES.muted });
    botao('mapas-voltar', 'Assuntos', 40, 40, 220, 60, { estilo: 'secundario', fn: () => irPara('assuntos') });
  }

  function telaFim() {
    const wide = larguraPainel();
    const m = st.mapa;
    const est = estrelasMapa(m), maxE = maxEstrelas(m);
    const perfeito = (progressoDe(m).estrelas || []).slice(0, m.missoes.length).filter(e => e === 3).length >= m.concluir;
    escrever('Mapa concluído!', LW / 2, 170, { tam: wide ? 88 : 64, peso: 900, alinha: 'center' });
    escrever(m.nome, LW / 2, 246, { tam: 36, peso: 600, cor: CORES.muted, alinha: 'center' });
    const cards = [
      ['Estrelas no mapa', `★ ${est} de ${maxE}`],
      ['Tentativas', String(st.tentativasMapa)],
      ['Maior sequência', String(st.maxSeq)]
    ];
    const cw = wide ? 370 : q4((LW - 80 - 48) / 3);
    const x0 = q4((LW - (3 * cw + 2 * 24)) / 2);
    cards.forEach((c, i) => {
      const x = x0 + i * (cw + 24), y = 300;
      cartao(x, y, cw, 200, 28);
      escrever(c[0], x + cw / 2, y + 56, { tam: 22, peso: 600, cor: CORES.muted, alinha: 'center', max: cw - 24 });
      escrever(c[1], x + cw / 2, y + 124, { tam: wide ? 60 : 44, peso: 900, alinha: 'center', max: cw - 24 });
    });
    const msg = perfeito ? '★★★ Caminho perfeito! Você achou os melhores caminhos.'
      : 'Ótimo trabalho! Tente os caminhos mais curtos para ganhar mais estrelas.';
    escrever(msg, LW / 2, 576, { tam: 28, peso: 700, alinha: 'center', cor: CORES.navy, max: LW - 80 });
    const prox = proximoPendente();
    const todos = MAPAS.every(concluido);
    const rotulo = prox ? 'Próximo pendente' : (todos ? 'Tudo concluído!' : 'Sem pendências');
    const acoes = [
      ['fim-jogar', 'Jogar de novo', { estilo: 'primario', fn: () => iniciarMapa(m) }],
      ['fim-prox', rotulo, { estilo: 'destaque', fn: prox ? () => iniciarMapa(prox) : null, desativado: !prox }],
      ['fim-mapas', 'Escolher mapa', { estilo: 'secundario', fn: () => { st.assunto = ASSUNTOS.findIndex(a => a.id === m.assunto); irPara('mapas'); } }],
      ['fim-inicio', 'Tela inicial', { estilo: 'secundario', fn: () => irPara('inicio') }]
    ];
    const bw = wide ? 280 : q4((LW - 80 - 24) / 2), bh = 88;
    acoes.forEach(([id, rot, op], i) => {
      if (wide) botao(id, rot, q4((LW - (4 * bw + 3 * 24)) / 2) + i * (bw + 24), 672, bw, bh, op);
      else botao(id, rot, 40 + (i % 2) * (bw + 24), 672 + Math.floor(i / 2) * (bh + 24), bw, bh, op);
    });
  }


  // ---------- modal ----------
  function desenharModal() {
    const md = st.modal;
    ctx.fillStyle = 'rgba(13,13,107,0.38)';
    ctx.fillRect(0, 0, LW, LH);
    const cw = 840, ch = 480, x = (LW - cw) / 2, y = (LH - ch) / 2;
    preencher(x, y + 12, cw, ch, 40, 'rgba(6,6,58,0.35)');
    preencher(x, y, cw, ch, 40, CORES.cartao);
    const humor = md.tipo === 'acerto' ? 'feliz' : md.tipo === 'erro' ? 'triste' : 'normal';
    desenharRobo(800, y + 96, 5, 'baixo', humor, performance.now(), false);
    escrever(md.titulo, 800, y + 200, { tam: 46, peso: 900, alinha: 'center', max: cw - 80 });
    let linhaY = y + 250;
    md.texto.split('\n').forEach(par => {
      escreverLinhas(quebrar(par, 700, 26, 500), 800, linhaY, 38, { tam: 26, peso: 500, cor: CORES.muted, alinha: 'center' });
      linhaY += quebrar(par, 700, 26, 500).length * 38;
    });
    const n = md.botoes.length;
    const bw = 340, bg = 30, total = n * bw + (n - 1) * bg, x0 = (LW - total) / 2;
    md.botoes.forEach((b, i) => {
      botao(b.id, b.rotulo, x0 + i * (bw + bg), y + ch - 104, bw, 84, { estilo: b.estilo, fn: b.fn, modal: true });
    });
  }

  // ---------- laço principal ----------
  function atualizar(t, dt) {
    processarAgenda(t);
    if (st.tela === 'jogo') atualizarExecucao(t);
    if (st.tremor > 0) st.tremor = Math.max(0, st.tremor - dt / 500);
    if (st.toast && t > st.toast.ate) st.toast = null;
    FLUT.forEach(f => { f.vida += dt; });
    FLUT = FLUT.filter(f => f.vida < f.max);
    atualizarConfete(dt);
  }

  function desenhar(t) {
    UI = [];
    if (telaDeMenu()) {
      cv.style.display = 'none';
      // A tela inicial agora é renderizada pelo React. As demais telas
      // continuam temporariamente no menu legado até suas migrações.
      if (menuHTML) menuHTML.hidden = st.tela === 'inicio';
      renderizarMenuHTML();
      return;
    }
    if (menuHTML) menuHTML.hidden = true;
    cv.style.display = 'block';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = CORES.fundo;
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(DPR * S, 0, 0, DPR * S, OX * DPR, OY * DPR);
    fundoPontilhado();
    switch (st.tela) {
      case 'inicio': telaInicio(t); break;
      case 'como': telaComo(); break;
      case 'assuntos': telaAssuntos(); break;
      case 'mapas': telaMapas(); break;
      case 'jogo': telaJogo(t); break;
      case 'fim': telaFim(); break;
    }
    if (st.toast && performance.now() < st.toast.ate && st.tela === 'jogo') {
      const w = Math.min(1000, medir(st.toast.texto, 22, 700) + 56);
      preencher(800 - w / 2, 250, w, 38, 19, '#fff');
      contornar(800 - w / 2 + 1, 251, w - 2, 36, 19, CORES.navy, 2);
      escrever(st.toast.texto, 800, 269, { tam: 22, peso: 700, alinha: 'center', max: w - 30 });
    }
    if (st.modal) desenharModal();
    desenharConfete();
    const navs = UI.filter(b => b.nav);
    if (navs.length && !navs.some(b => b.id === st.foco)) st.foco = navs[0].id;
    if (st.modal) st.foco = st.modal.botoes.some(b => b.id === st.foco) ? st.foco : st.modal.botoes[0].id;
    if (st.tela === 'jogo' && !st.modal) st.foco = null;
  }

  let ultimo = performance.now();
  function laco() {
    const agora = performance.now();
    const dt = Math.min(64, agora - ultimo);
    ultimo = agora;
    atualizar(agora, dt);
    publicarSnapshotReact();
    desenhar(agora);
    requestAnimationFrame(laco);
  }

  // ---------- entrada: mouse / toque ----------
  function paraLogico(e) {
    return { x: (e.clientX - OX) / S, y: (e.clientY - OY) / S };
  }
  cv.addEventListener('pointerdown', e => {
    liberarAudio();
    const p = paraLogico(e);
    const b = areaAtiva(p.x, p.y);
    if (b && b.fn) { st.foco = b.id; b.fn(); }
  });
  cv.addEventListener('pointermove', e => {
    const p = paraLogico(e);
    const b = areaAtiva(p.x, p.y);
    st.hover = b ? b.id : null;
    cv.classList.toggle('is-clickable', Boolean(b));
  });

  // ---------- entrada: teclado ----------
  window.addEventListener('keydown', e => {
    liberarAudio();
    const k = e.key;
    if (k === 'f' || k === 'F') { telaCheia(); return; }
    if (k === 'm' || k === 'M') { alternarSom(); return; }
    if (st.modal) {
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        const b = st.modal.botoes.find(x => x.id === st.foco) || st.modal.botoes[0];
        b.fn();
      } else if (k === 'Escape') {
        e.preventDefault();
        st.modal.botoes[st.modal.botoes.length - 1].fn();
      } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        const ids = st.modal.botoes.map(b => b.id);
        const i = Math.max(0, ids.indexOf(st.foco));
        const j = (i + (k === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
        st.foco = ids[j];
      }
      return;
    }
    if (st.tela === 'jogo') {
      const seta = TECLA_SETA[k] ? k : TECLA_WASD[k];
      if (seta) { e.preventDefault(); addMov(TECLA_SETA[seta]); return; }
      if (k === 'h' || k === 'H') { e.preventDefault(); if (st.errosSeguidos >= CONFIG.dicaAposErros && !st.exec) mostrarDica(); return; }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); executar(); return; }
      if (k === 'Backspace') { e.preventDefault(); apagarUltimo(); return; }
      if (k === 'Delete' || k === 'c' || k === 'C') { e.preventDefault(); limparTudo(); return; }
      if (k === 'Escape') { e.preventDefault(); sair(); return; }
      return;
    }
    if (telaDeMenu()) {
      if (k === 'Escape' || k === 'Backspace') { e.preventDefault(); voltar(); return; }
      if (k.startsWith('Arrow')) {
        const seletorBotoes = st.tela === 'inicio'
          ? '.scr-react-menu button:not(:disabled)'
          : '#menu-html button:not(:disabled)';
        const botoes = [...document.querySelectorAll(seletorBotoes)];
        if (botoes.length) {
          e.preventDefault();
          const atual = botoes.indexOf(document.activeElement);
          const proximo = k === 'ArrowRight' || k === 'ArrowDown' ? atual + 1 : atual - 1;
          botoes[(proximo + botoes.length) % botoes.length].focus();
        }
        return;
      }
      // Enter e Espaço ficam com o comportamento nativo dos botões HTML.
      return;
    }
    const seta = TECLA_SETA[k] ? k : TECLA_WASD[k];
    if (seta) { e.preventDefault(); moverFoco(seta); return; }
    if (k === 'Enter' || k === ' ') { e.preventDefault(); ativarFoco(); return; }
    if (k === 'Escape' || k === 'Backspace') { e.preventDefault(); voltar(); return; }
  });

  // ---------- inicialização ----------
  carregar();
  irPara('inicio');
  teleportar(MAPAS[0].inicio);
  requestAnimationFrame(laco);
})();
