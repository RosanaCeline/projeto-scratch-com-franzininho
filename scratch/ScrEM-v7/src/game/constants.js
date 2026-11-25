import { CONFIG } from '../data/config.js';

export const N = CONFIG.tamanhoGrade;
export const MAX_CMD = CONFIG.maxComandos;
export const CUSTO_CHOQUE = CONFIG.custoChoque;
export const MARGEM = CONFIG.margemEstrelas;

export const DIRS = ['cima', 'baixo', 'esquerda', 'direita'];

export const DELTA = {
  cima: [0, -1],
  baixo: [0, 1],
  esquerda: [-1, 0],
  direita: [1, 0]
};

export const GLIFO = {
  cima: '↑',
  baixo: '↓',
  esquerda: '←',
  direita: '→'
};

export const TECLA_WASD = {
  w: 'ArrowUp',
  a: 'ArrowLeft',
  s: 'ArrowDown',
  d: 'ArrowRight',
  W: 'ArrowUp',
  A: 'ArrowLeft',
  S: 'ArrowDown',
  D: 'ArrowRight'
};

export const TECLA_SETA = {
  ArrowUp: 'cima',
  ArrowDown: 'baixo',
  ArrowLeft: 'esquerda',
  ArrowRight: 'direita'
};

export const TERRENO = {
  v: {
    nome: 'Vermelho',
    bg: '#ffdcdd',
    pixel: '#e5484d',
    regra: 'Perde o passo: fica parado.'
  },
  a: {
    nome: 'Azul',
    bg: '#d2ebff',
    pixel: '#4aa8ff',
    regra: 'Água: escorrega uma casa a mais.'
  },
  y: {
    nome: 'Amarelo',
    bg: '#fff1ad',
    pixel: '#e0a800',
    regra: `Choque: custa ${CUSTO_CHOQUE} passos extras.`
  },
  g: {
    nome: 'Verde',
    bg: '#caf6df',
    pixel: '#1f9d61',
    regra: 'Atalho: leva ao outro verde.'
  }
};

export const CORES = {
  navy: '#0d0d6b',
  navyEscuro: '#06063a',
  muted: '#6b6f9c',
  fundo: '#eef0f7',
  cartao: '#ffffff',
  linha: '#d9dce6',
  celula: '#f2f4fb',
  celulaVisit: '#fff1b0',
  obst: '#6b6f9c',
  obstBorda: '#4f5385',
  obstTijolo: '#8c91c6',
  amarelo: '#ffd23f',
  amareloForte: '#ffd23f',
  amareloSombra: '#e0a800',
  verde: '#1f9d61',
  vermelho: '#e5484d',
  azul: '#4aa8ff',
  rosa: '#ff6fa0'
};