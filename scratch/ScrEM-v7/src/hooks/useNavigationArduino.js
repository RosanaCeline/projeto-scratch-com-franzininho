import { useEffect } from 'react';

const SETAS = {
  ArrowRight: 'direita',
  ArrowLeft: 'esquerda',
  ArrowDown: 'baixo',
  ArrowUp: 'cima'
};

/**
 * Navegação por teclado/Arduino: foca o primeiro botão ao abrir e move o foco
 * com as setas para o botão mais próximo naquela direção (mesma lógica do
 * moverFoco do canvas). Enter e Espaço ativam o botão focado (nativo).
 *
 * Use UMA vez no App, no elemento que envolve todas as telas.
 *
 * @param ref    ref do elemento que contém os botões
 * @param ativo  só liga quando as setas devem mover o foco (ex.: fora do jogo)
 * @param chave  valor que muda a cada tela (ex.: o nome da tela): refaz o foco inicial
 */
export default function useNavigationArduino(ref, ativo = true, chave = null) {
  useEffect(() => {
    const raiz = ref.current;

    if (!ativo || !raiz) return undefined;

    const listarBotoes = () =>
      [...raiz.querySelectorAll('button:not(:disabled)')];

    // foco inicial, como o canvas fazia com navs[0]
    listarBotoes()[0]?.focus({ preventScroll: true });

    function aoTeclar(evento) {
      const direcao = SETAS[evento.key];

      if (!direcao) return;

      const botoes = listarBotoes();

      if (!botoes.length) return;

      evento.preventDefault();

      const atual = botoes.find(b => b === document.activeElement);

      if (!atual) {
        botoes[0].focus({ preventScroll: true });
        return;
      }

      const a = atual.getBoundingClientRect();
      const cx = a.left + a.width / 2;
      const cy = a.top + a.height / 2;

      let melhor = null;
      let menorPontuacao = Infinity;

      for (const botao of botoes) {
        if (botao === atual) continue;

        const r = botao.getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx;
        const dy = r.top + r.height / 2 - cy;

        let valido;
        let principal;
        let lateral;

        if (direcao === 'direita') { valido = dx > 4; principal = dx; lateral = Math.abs(dy); }
        else if (direcao === 'esquerda') { valido = dx < -4; principal = -dx; lateral = Math.abs(dy); }
        else if (direcao === 'baixo') { valido = dy > 4; principal = dy; lateral = Math.abs(dx); }
        else { valido = dy < -4; principal = -dy; lateral = Math.abs(dx); }

        if (!valido) continue;

        const pontuacao = principal + lateral * 2.2;

        if (pontuacao < menorPontuacao) {
          menorPontuacao = pontuacao;
          melhor = botao;
        }
      }

      melhor?.focus({ preventScroll: true });
    }

    window.addEventListener('keydown', aoTeclar);

    return () => window.removeEventListener('keydown', aoTeclar);
  }, [ref, ativo, chave]);
}