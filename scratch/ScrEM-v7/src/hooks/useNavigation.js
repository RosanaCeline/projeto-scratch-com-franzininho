import { useCallback, useState } from 'react';

export default function useNavigation() {
  const [tela, setTela] = useState('inicio');

  // Navega para uma tela.
  const irPara = useCallback((proximaTela) => {
    setTela(proximaTela);
  }, []);

  // Retorna à tela anterior, respeitando a navegação original.
  const voltar = useCallback((modalAberto = false) => {
    if (modalAberto) return;

    setTela(atual => {
      if (atual === 'como' || atual === 'assuntos') {
        return 'inicio';
      }

      if (atual === 'mapas') {
        return 'assuntos';
      }

      if (atual === 'fim') {
        return 'mapas';
      }

      return atual;
    });
  }, []);

  // Sai da partida e retorna ao início.
  const sair = useCallback((limparSequencia) => {
    limparSequencia?.();
    setTela('inicio');
  }, []);

  return {
    tela,
    irPara,
    voltar,
    sair
  };
}
