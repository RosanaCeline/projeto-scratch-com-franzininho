
const CHAVE_SAVE = 'screm-v6';

// Recupera o progresso e a configuração de som.
export function carregarProgresso() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_SAVE) || '{}'
    );

    return {
      progresso: dados.progresso || {},
      som: dados.som !== false
    };
  } catch {
    // Se o armazenamento estiver indisponível ou inválido,
    // o jogo continua funcionando sem os dados salvos.
    return {
      progresso: {},
      som: true
    };
  }
}

// Salva o progresso e a configuração de som.
export function salvarProgresso(progresso, som) {
  try {
    localStorage.setItem(
      CHAVE_SAVE,
      JSON.stringify({ progresso, som })
    );
  } catch {
    // Ignora erros de armazenamento.
  }
}

// Registra as estrelas obtidas em uma missão.
// Mantém sempre a maior pontuação já conquistada.
export function registrarEstrela(progresso, mapa, k, estrelas) {
  const progressoAtual = progresso[mapa.id] || {
    concluido: false,
    estrelas: [],
    tentativas: 0
  };

  const estrelasAtuais = [...(progressoAtual.estrelas || [])];

  estrelasAtuais[k] = Math.max(
    estrelasAtuais[k] || 0,
    estrelas
  );

  return {
    ...progresso,
    [mapa.id]: {
      ...progressoAtual,
      estrelas: estrelasAtuais
    }
  };
}
