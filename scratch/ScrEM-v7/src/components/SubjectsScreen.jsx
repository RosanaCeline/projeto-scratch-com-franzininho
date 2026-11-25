import { useEffect, useState } from 'react';

export default function SubjectsScreen() {
  const [snapshot, setSnapshot] = useState(() => window.ScrEMAPI?.getSnapshot() ?? null);

  useEffect(() => {
    if (!window.ScrEMAPI) return undefined;
    return window.ScrEMAPI.subscribe(setSnapshot);
  }, []);

  if (snapshot?.tela !== 'assuntos') return null;

  const assuntos = snapshot.assuntos ?? [];

  return (
    <main className="scr-menu scr-react-menu" aria-label="Seleção de assuntos">
      <section className="scr-page">
        <header className="scr-page-heading">
          <h1>Escolha um assunto</h1>
          <p>Matemática · Ensino Médio</p>
        </header>

        <div className="scr-subject-grid">
          {assuntos.map((assunto, index) => (
            <button
              className="scr-card scr-subject-card"
              key={assunto.id}
              type="button"
              style={{ '--subject-color': assunto.cor }}
              onClick={() => window.ScrEMAPI?.selecionarAssunto(index)}
              aria-label={`${assunto.nome}: ${assunto.mapasConcluidos} de ${assunto.totalMapas} mapas concluídos`}
            >
              <span className="scr-subject-icon" aria-hidden="true">{assunto.icone}</span>
              <h2>{assunto.nome}</h2>
              <span
                className="scr-progress-track"
                role="progressbar"
                aria-label={`Progresso em ${assunto.nome}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(assunto.percentual)}
              >
                <span style={{ width: `${assunto.percentual}%` }} />
              </span>
              <p>{assunto.mapasConcluidos} de {assunto.totalMapas} mapas concluídos</p>
              <strong>
                ★ {assunto.estrelas} de {assunto.maxEstrelas}
                {assunto.totalMapas > 0 && assunto.mapasConcluidos === assunto.totalMapas ? ' · completo' : ''}
              </strong>
            </button>
          ))}
        </div>

        <footer className="scr-page-actions">
          <button
            className="scr-button secondary"
            type="button"
            onClick={() => window.ScrEMAPI?.irPara('inicio')}
          >
            Início
          </button>
        </footer>
      </section>
    </main>
  );
}
