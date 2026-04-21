import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const splashImage = new URL('../img/img_home_splash.png', import.meta.url).href;

function App() {
  return (
    <main className="page-shell">
      <section className="hero" aria-label="Saturn Aerospace splash screen">
        <div className="hero__backdrop" />
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />

        <div className="hero__content">
          <p className="eyebrow">KSP space company</p>
          <h1>Saturn Aerospace</h1>
          <p className="subtitle">
            A KSP space company, with software flying our rockets
          </p>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__frame">
            <img
              src={splashImage}
              alt=""
              className="hero__image"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
