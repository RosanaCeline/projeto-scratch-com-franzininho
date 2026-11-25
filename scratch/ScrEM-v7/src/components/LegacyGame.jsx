import { useEffect, useRef, useState } from 'react';

const LEGACY_SCRIPTS = [
  '/js/dados.js',
  '/js/estado.js',
  '/js/jogo-legado.js'
];

function carregarScript(src) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[data-screm-script="${src}"]`);
    if (existente?.dataset.loaded === 'true') {
      resolve();
      return;
    }
    if (existente) {
      existente.addEventListener('load', resolve, { once: true });
      existente.addEventListener('error', () => reject(new Error(`Não foi possível carregar ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.scremScript = src;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    document.body.appendChild(script);
  });
}

export default function LegacyGame({ onReady }) {
  const [erro, setErro] = useState('');
  const [carregado, setCarregado] = useState(false);
  const inicializado = useRef(false);

  useEffect(() => {
    if (carregado) onReady?.();
  }, [carregado, onReady]);

  useEffect(() => {
    if (inicializado.current) return;
    inicializado.current = true;

    let ativo = true;
    (async () => {
      try {
        for (const src of LEGACY_SCRIPTS) await carregarScript(src);
        if (ativo) setCarregado(true);
      } catch (error) {
        if (ativo) setErro(error.message);
      }
    })();

    return () => { ativo = false; };
  }, []);

  return (
    <>
      <main
        id="menu-html"
        className="scr-menu"
        aria-live="polite"
        aria-label="Menu do ScrEM"
      />
      <canvas
        id="jogo"
        className="jogo"
        role="img"
        aria-label="Jogo ScrEM: monte o caminho do personagem e resolva a missão"
      >
        Seu navegador não suporta o elemento canvas, necessário para jogar o ScrEM.
      </canvas>
      {!carregado && !erro && (
        <div className="scr-loading" role="status">Carregando ScrEM…</div>
      )}
      {erro && (
        <section className="scr-error" role="alert">
          <h1>Não foi possível iniciar o ScrEM</h1>
          <p>{erro}</p>
          <p>
            Confira se o arquivo <code>public/js/dados.js</code> foi copiado do projeto original.
            Ele contém CONFIG, ASSUNTOS e MAPAS, necessários para iniciar o jogo.
          </p>
        </section>
      )}
      <noscript>
        <p className="aviso-noscript">Ative o JavaScript para jogar o ScrEM.</p>
      </noscript>
    </>
  );
}
