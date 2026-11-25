import { useEffect, useState } from 'react';

const STEPS = [
  { title: 'Leia a missão', description: 'Ela diz qual casa com número o personagem precisa alcançar.' },
  { title: 'Monte o caminho', description: 'Use as setas ou WASD. Cada tecla é um passo para a casa ao lado.' },
  { title: 'Respeite as cores', description: null },
  { title: 'Ganhe estrelas', description: 'Quanto menos passos, mais estrelas. ★★★ é o melhor caminho possível.' },
];

export default function HowToPlayScreen() {
  const [snapshot, setSnapshot] = useState(() => window.ScrEMAPI?.getSnapshot() ?? null);

  useEffect(() => {
    if (!window.ScrEMAPI) return undefined;
    return window.ScrEMAPI.subscribe(setSnapshot);
  }, []);

  if (snapshot?.tela !== 'como') return null;

  const custoChoque = snapshot.custoChoque ?? 3;

  return (
    <main className="scr-menu scr-react-menu" aria-label="Como jogar ScrEM">
      <section className="scr-page">
        <header className="scr-page-heading">
          <h1>Como jogar</h1>
        </header>

        <div className="scr-how-grid">
          {STEPS.map((step, index) => (
            <article className="scr-card scr-how-card" key={step.title}>
              <span className="scr-step">{index + 1}</span>
              <h2>{step.title}</h2>
              <p>
                {step.description ?? `Vermelho perde o passo; azul escorrega; amarelo custa ${custoChoque} passos; verde leva ao outro verde.`}
              </p>
            </article>
          ))}
        </div>

        <aside className="scr-keyboard-card">
          <h2>Teclado</h2>
          <p>Setas ou WASD: montar · Enter: executar · Backspace: desfazer · Delete: limpar · H: dica · Esc: sair</p>
        </aside>

        <footer className="scr-page-actions">
          <button className="scr-button secondary" type="button" onClick={() => window.ScrEMAPI?.irPara('inicio')}>Voltar</button>
          <button className="scr-button" type="button" onClick={() => window.ScrEMAPI?.irPara('assuntos')}>Começar</button>
        </footer>
      </section>
    </main>
  );
}
