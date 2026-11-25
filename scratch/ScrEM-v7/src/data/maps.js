export const MAPAS = [
  {
    id: 'tab23',
    assunto: 'mult',
    nome: 'Tabuada do 2 e do 3',
    tema: 'Multiplicar por 2 e por 3',
    nivel: 1,
    limite: 16,
    concluir: 5,
    inicio: 20,
    celulas: [
      '25', '11', '31', '4', '27',
      '3', '12', '', '18', '32',
      '6', '22', '', '14', '37',
      '15', '23', '2', '21', '8',
      '', '30', '36', '17', '24'
    ],
    obstaculos: [7, 12],
    missoes: [
      {
        texto: 'Leve o personagem até o resultado de 2 × 3.',
        alvos: ['6'],
        dica: 'some o 2 três vezes.'
      },
      {
        texto: 'Leve o personagem até o resultado de 3 × 4.',
        alvos: ['12'],
        dica: 'some o 3 quatro vezes.'
      },
      {
        texto: 'Leve o personagem até o resultado de 2 × 7.',
        alvos: ['14'],
        dica: 'some o 7 duas vezes.'
      },
      {
        texto: 'Leve o personagem até o resultado de 3 × 6.',
        alvos: ['18'],
        dica: 'some o 6 três vezes.'
      },
      {
        texto: 'Leve o personagem até o resultado de 3 × 9.',
        alvos: ['27'],
        dica: 'some 9 três vezes.'
      }
    ],
    fixo: true,
    terreno: { g: 2, y: 1 }
  },
  {
    id: 'tab45',
    assunto: 'mult',
    nome: 'Tabuada do 4 e do 5',
    tema: 'Multiplicar por 4 e por 5',
    nivel: 1,
    limite: 16,
    concluir: 3,
    inicio: 20,
    celulas: [
      '11', '38', '', '9', '21',
      '13', '', '7', '', '20',
      '8', '34', '30', '22', '32',
      '35', '', '36', '4', '19',
      '', '24', '3', '33', '2'
    ],
    obstaculos: [2, 6, 8, 16],
    missoes: [
      {
        texto: 'Leve o personagem até o resultado de 4 × 2.',
        alvos: ['8'],
        dica: 'some o 4 duas vezes.'
      },
      {
        texto: 'Leve o personagem até o resultado de 5 × 6.',
        alvos: ['30'],
        dica: 'some o 5 seis vezes.'
      },
      {
        texto: 'Leve o personagem até o resultado de 4 × 8.',
        alvos: ['32'],
        dica: 'some 8 quatro vezes.'
      }
    ],
    fixo: true,
    terreno: { g: 2, y: 2 }
  },
  {
    id: 'soma3',
    assunto: 'soma',
    nome: 'Somar e subtrair até 20',
    tema: 'Somar e subtrair até 20',
    nivel: 2,
    limite: 18,
    concluir: 2,
    inicio: 20,
    celulas: [
      '21', '', '5', '', '8',
      '35', '', '29', '11', '17',
      '16', '', '24', '', '39',
      '32', '18', '14', '', '2',
      '', '34', '3', '20', '40'
    ],
    obstaculos: [1, 3, 6, 11, 13, 18],
    missoes: [
      {
        texto: 'Leve o personagem até o resultado de 9 + 7.',
        alvos: ['16'],
        dica: 'some 9 com 7.'
      },
      {
        texto: 'Leve o personagem até o resultado de 20 − 3.',
        alvos: ['17'],
        dica: 'comece em 20 e recue 3.'
      }
    ],
    fixo: true,
    terreno: { v: 1, a: 1, y: 1, g: 2 }
  },
  {
    id: 'pot2',
    assunto: 'pot',
    nome: 'Potências de 2',
    tema: 'Potências de base 2',
    nivel: 1,
    limite: 20,
    concluir: 4,
    inicio: 20,
    celulas: [
      '32', '6', '5', '16', '',
      '9', '12', '', '4', '7',
      '10', '64', '11', '8', '48',
      '128', '3', '24', '2', '40',
      '', '6', '5', '1', '9'
    ],
    obstaculos: [4, 7],
    missoes: [
      {
        texto: 'Quanto é 2³?',
        alvos: ['8'],
        dica: 'Multiplique: 2 × 2 × 2.'
      },
      {
        texto: 'Quanto é 2⁴?',
        alvos: ['16'],
        dica: 'Some um 2 a mais: 8 × 2.'
      },
      {
        texto: 'Quanto é 2⁰?',
        alvos: ['1'],
        dica: 'Qualquer número diferente de zero elevado a zero dá 1.'
      },
      {
        texto: 'Passe pelo 2² e depois chegue a 2⁵.',
        alvos: ['4', '32'],
        dica: 'Primeiro o 2², depois o 2⁵.'
      },
      {
        texto: 'Quanto é 2⁶?',
        alvos: ['64'],
        dica: '2⁶ = 2³ × 2³.'
      }
    ],
    fixo: false,
    terreno: { g: 2, y: 1 }
  },
  {
    id: 'raiz',
    assunto: 'pot',
    nome: 'Raízes quadradas',
    tema: 'Raiz de quadrados perfeitos',
    nivel: 2,
    limite: 16,
    concluir: 4,
    inicio: 20,
    celulas: [
      '10', '', '9', '12', '4',
      '18', '25', '6', '13', '3',
      '5', '11', '7', '2', '20',
      '49', '', '', '14', '1',
      '', '24', '8', '81', '10'
    ],
    obstaculos: [1, 16, 17],
    missoes: [
      {
        texto: 'Quanto vale √49?',
        alvos: ['7'],
        dica: 'Qual número multiplicado por ele mesmo dá 49?'
      },
      {
        texto: 'Quanto vale √81?',
        alvos: ['9'],
        dica: '9 × 9 = ?'
      },
      {
        texto: 'Quanto vale √16?',
        alvos: ['4'],
        dica: '4 × 4 dá 16.'
      },
      {
        texto: 'Passe por √25 e depois chegue a √64.',
        alvos: ['5', '8'],
        dica: 'Primeiro a raiz de 25, depois a de 64.'
      },
      {
        texto: 'Quanto vale √36?',
        alvos: ['6'],
        dica: '6 × 6 = 36.'
      }
    ],
    fixo: false,
    terreno: { v: 1, a: 1, y: 2, g: 2 }
  },
  {
    id: 'porc',
    assunto: 'perc',
    nome: 'Porcentagem',
    tema: 'Calcular porcentagens de um número',
    nivel: 2,
    limite: 16,
    concluir: 4,
    inicio: 20,
    celulas: [
      '100', '70', '6', '4', '45',
      '', '18', '25', '20', '35',
      '9', '80', '8', '40', '50',
      '60', '12', '', '30', '15',
      '', '100', '70', '', '6'
    ],
    obstaculos: [5, 17, 23],
    missoes: [
      {
        texto: 'Quanto é 50% de 60?',
        alvos: ['30'],
        dica: '50% é a metade.'
      },
      {
        texto: 'Quanto é 25% de 80?',
        alvos: ['20'],
        dica: '25% é um quarto. Divida 80 por 4.'
      },
      {
        texto: 'Quanto é 10% de 350?',
        alvos: ['35'],
        dica: '10% é dividir por 10.'
      },
      {
        texto: 'Quanto é 15% de 120?',
        alvos: ['18'],
        dica: 'Calcule 10% e 5% de 120 e some.'
      },
      {
        texto: 'Passe por 10% de 350 e depois chegue a 25% de 80.',
        alvos: ['35', '20'],
        dica: 'Siga a ordem do texto.'
      }
    ],
    fixo: false,
    terreno: { v: 1, a: 1, y: 2, g: 2 }
  },
  {
    id: 'frac',
    assunto: 'perc',
    nome: 'Frações',
    tema: 'Somar e calcular frações',
    nivel: 2,
    limite: 16,
    concluir: 4,
    inicio: 20,
    celulas: [
      '1/5', '', '1/4', '20', '3/4',
      '5/4', '', '2', '5', '8',
      '7/4', '6', '15', '1/2', '10',
      '3/2', '4', '2/3', '1/5', '20',
      '', '5/4', '', '2', '5'
    ],
    obstaculos: [1, 6, 22],
    missoes: [
      {
        texto: 'Quanto é 1/2 + 1/4?',
        alvos: ['3/4'],
        dica: 'Transforme 1/2 em 2/4 e some.'
      },
      {
        texto: 'Quanto é 1/3 de 12?',
        alvos: ['4'],
        dica: 'Divida 12 em 3 partes iguais.'
      },
      {
        texto: 'Quanto é 2/5 de 25?',
        alvos: ['10'],
        dica: 'Divida 25 por 5 e multiplique por 2.'
      },
      {
        texto: 'Quanto é 1/2 × 1/2?',
        alvos: ['1/4'],
        dica: 'Multiplique numeradores e denominadores.'
      },
      {
        texto: 'Passe por 1/3 de 12 e depois chegue a 1/2 + 1/4.',
        alvos: ['4', '3/4'],
        dica: 'Primeiro o 1/3 de 12.'
      }
    ],
    fixo: false,
    terreno: { v: 1, a: 1, y: 2, g: 2 }
  },
  {
    id: 'afim',
    assunto: 'func',
    nome: 'Função afim',
    tema: 'Calcular f(x) = ax + b',
    nivel: 2,
    limite: 16,
    concluir: 4,
    inicio: 20,
    celulas: [
      '', '3', '2', '−5', '13',
      '8', '6', '0', '−6', '',
      '10', '11', '−1', '5', '−3',
      '−4', '4', '−2', '', '9',
      '', '3', '7', '2', '1'
    ],
    obstaculos: [0, 9, 18],
    missoes: [
      {
        texto: 'Com f(x) = 2x + 1, leve o personagem até f(3).',
        alvos: ['7'],
        dica: 'Substitua x por 3: 2 × 3 + 1.'
      },
      {
        texto: 'Com f(x) = 2x + 1, leve o personagem até f(−2).',
        alvos: ['−3'],
        dica: 'Cuidado com o sinal: 2 × (−2).'
      },
      {
        texto: 'Com f(x) = 3x − 2, leve o personagem até f(4).',
        alvos: ['10'],
        dica: 'Primeiro 3 × 4, depois subtraia 2.'
      },
      {
        texto: 'Com f(x) = −x + 4, leve o personagem até f(6).',
        alvos: ['−2'],
        dica: 'Some −6 com 4.'
      },
      {
        texto: 'Com f(x) = 3x − 2, passe por f(1) e depois chegue a f(−1).',
        alvos: ['1', '−5'],
        dica: 'Calcule f(1) primeiro.'
      }
    ],
    fixo: false,
    terreno: { v: 1, a: 1, y: 2, g: 2 }
  },
  {
    id: 'quad',
    assunto: 'func',
    nome: 'Função quadrática',
    tema: 'Valores de x² + bx + c',
    nivel: 3,
    limite: 18,
    concluir: 4,
    inicio: 20,
    celulas: [
      '', '', '16', '−1', '',
      '4', '−4', '0', '8', '−3',
      '', '10', '3', '', '1',
      '7', '11', '12', '14', '9',
      '', '2', '6', '−2', '5'
    ],
    obstaculos: [0, 1, 4, 10, 13],
    missoes: [
      {
        texto: 'Com f(x) = x² − 4, leve o personagem até f(3).',
        alvos: ['5'],
        dica: '3² = 9. Depois subtraia 4.'
      },
      {
        texto: 'Com f(x) = x² − 4, leve o personagem até f(0).',
        alvos: ['−4'],
        dica: 'Quanto é 0²?'
      },
      {
        texto: 'Com f(x) = x² − 4, leve o personagem até f(4).',
        alvos: ['12'],
        dica: '4² − 4.'
      },
      {
        texto: 'Com f(x) = x² + 2x, leve o personagem até f(2).',
        alvos: ['8'],
        dica: '2² + 2 × 2.'
      },
      {
        texto: 'Com f(x) = x² + 2x, passe por f(1) e depois chegue a f(−1).',
        alvos: ['3', '−1'],
        dica: 'Calcule f(1) primeiro.'
      }
    ],
    fixo: false,
    terreno: { v: 2, a: 2, y: 2, g: 2 }
  },
  {
    id: 'eq1',
    assunto: 'eq',
    nome: 'Equações do 1º grau',
    tema: 'Achar o valor de x',
    nivel: 2,
    limite: 16,
    concluir: 4,
    inicio: 20,
    celulas: [
      '11', '−7', '−1', '13', '7',
      '', '10', '14', '3', '2',
      '6', '4', '', '', '9',
      '−2', '12', '−5', '5', '8',
      '', '0', '11', '−1', '1'
    ],
    obstaculos: [5, 12, 13],
    missoes: [
      {
        texto: 'Resolva 3x − 4 = 11. Qual é x?',
        alvos: ['5'],
        dica: 'Some 4 aos dois lados e divida por 3.'
      },
      {
        texto: 'Resolva 2x + 7 = 15. Qual é x?',
        alvos: ['4'],
        dica: 'Passe o 7 para o outro lado com sinal trocado.'
      },
      {
        texto: 'Resolva x ÷ 2 + 3 = 10. Qual é x?',
        alvos: ['14'],
        dica: 'Tire 3 dos dois lados primeiro.'
      },
      {
        texto: 'Resolva 5x = −35. Qual é x?',
        alvos: ['−7'],
        dica: 'Divida −35 por 5.'
      },
      {
        texto: 'Resolva 6x − 6 = 0 e 4 − x = 9. Passe pelos dois valores de x, nessa ordem.',
        alvos: ['1', '−5'],
        dica: 'O primeiro valor é positivo.'
      }
    ],
    fixo: false,
    terreno: { v: 1, a: 1, y: 2, g: 2 }
  },
  {
    id: 'prog',
    assunto: 'eq',
    nome: 'Progressões',
    tema: 'Termos de PA e PG',
    nivel: 3,
    limite: 18,
    concluir: 4,
    inicio: 20,
    celulas: [
      '−1', '', '15', '27', '',
      '4', '', '1', '19', '8',
      '20', '', '25', '17', '14',
      '18', '26', '16', '−2', '12',
      '', '21', '23', '', '−1'
    ],
    obstaculos: [1, 4, 6, 11, 23],
    missoes: [
      {
        texto: 'PA: 2, 5, 8, ... Qual é o 6º termo?',
        alvos: ['17'],
        dica: 'A razão é 3. Some 3 cinco vezes a partir do 2.'
      },
      {
        texto: 'PA: 3, 7, 11, ... Qual é o 5º termo?',
        alvos: ['19'],
        dica: 'A razão é 4.'
      },
      {
        texto: 'PG: 1, 3, 9, ... Qual é o 4º termo?',
        alvos: ['27'],
        dica: 'A razão é 3: multiplique por 3.'
      },
      {
        texto: 'PA: 10, 7, 4, ... Qual é o 5º termo?',
        alvos: ['−2'],
        dica: 'A razão é −3.'
      },
      {
        texto: 'Passe pelo 5º termo da PA 3, 7, 11 e chegue ao 4º termo da PG 1, 3, 9.',
        alvos: ['19', '27'],
        dica: 'Primeiro o 19, depois o 27.'
      }
    ],
    fixo: false,
    terreno: { v: 2, a: 2, y: 2, g: 2 }
  },
  {
    id: 'pit',
    assunto: 'geo',
    nome: 'Pitágoras e áreas',
    tema: 'Hipotenusa e área de figuras',
    nivel: 2,
    limite: 16,
    concluir: 4,
    inicio: 20,
    celulas: [
      '49', '', '11', '9', '7',
      '12', '', '48', '36', '20',
      '13', '', '25', '40', '15',
      '45', '18', '14', '28', '24',
      '', '30', '11', '9', '10'
    ],
    obstaculos: [1, 6, 11],
    missoes: [
      {
        texto: 'Catetos 6 e 8. Qual é a hipotenusa?',
        alvos: ['10'],
        dica: 'Some 6² + 8² e tire a raiz.'
      },
      {
        texto: 'Catetos 5 e 12. Qual é a hipotenusa?',
        alvos: ['13'],
        dica: '5² + 12² = 25 + 144.'
      },
      {
        texto: 'Quadrado de lado 7. Qual é a área?',
        alvos: ['49'],
        dica: 'Área do quadrado é lado × lado.'
      },
      {
        texto: 'Retângulo 4 × 9. Qual é a área?',
        alvos: ['36'],
        dica: 'Área do retângulo = base × altura.'
      },
      {
        texto: 'Passe pela hipotenusa de 6 e 8 e depois chegue à área do retângulo 4 × 9.',
        alvos: ['10', '36'],
        dica: 'Primeiro o 10, depois o 36.'
      }
    ],
    fixo: false,
    terreno: { v: 1, a: 1, y: 2, g: 2 }
  },
  {
    id: 'trig',
    assunto: 'geo',
    nome: 'Trigonometria',
    tema: 'Seno e cosseno de ângulos notáveis',
    nivel: 3,
    limite: 18,
    concluir: 4,
    inicio: 20,
    celulas: [
      '√3/2', '√2/2', '', '1/3', '√2',
      '−1', '4', '3', '', '',
      '1/2', '√3', '', '0', '3/2',
      '1/4', '2', '√2/2', '1/3', '√2',
      '', '−1', '1', '4', ''
    ],
    obstaculos: [2, 8, 9, 12, 24],
    missoes: [
      {
        texto: 'Quanto é sen 30°?',
        alvos: ['1/2'],
        dica: 'Lembre a tabela de ângulos notáveis.'
      },
      {
        texto: 'Quanto é cos 0°?',
        alvos: ['1'],
        dica: 'No ângulo de 0°, o cosseno é o maior possível.'
      },
      {
        texto: 'Quanto é cos 90°?',
        alvos: ['0'],
        dica: 'No ângulo de 90°, o cosseno vale zero.'
      },
      {
        texto: 'Quanto é sen 60°?',
        alvos: ['√3/2'],
        dica: 'Seno de 60° é maior que o de 30°.'
      },
      {
        texto: 'Passe por cos 90° e depois chegue a sen 60°.',
        alvos: ['0', '√3/2'],
        dica: 'Primeiro o 0, depois o √3/2.'
      }
    ],
    fixo: false,
    terreno: { v: 2, a: 2, y: 2, g: 2 }
  }
];
