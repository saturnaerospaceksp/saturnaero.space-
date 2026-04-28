document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.site-nav');
  const links = nav?.querySelector('.site-nav__links');
  const prompt = document.querySelector('.launch-prompt');
  const promptPanel = prompt?.querySelector('.launch-prompt__panel');
  const promptCloseTargets = prompt ? Array.from(prompt.querySelectorAll('[data-launch-prompt-close]')) : [];

  if (nav && links && !nav.querySelector('.site-nav__toggle')) {
    const panel = document.createElement('div');
    panel.className = 'site-nav__panel';
    panel.id = 'site-nav-panel';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'site-nav__toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panel.id);
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.innerHTML = `
      <span class="site-nav__toggle-icon" aria-hidden="true"></span>
      <span class="site-nav__toggle-label">Menu</span>
    `;

    nav.insertBefore(toggle, links);
    nav.insertBefore(panel, links);
    panel.appendChild(links);

    const mobileQuery = window.matchMedia('(max-width: 640px)');

    const closeMenu = () => {
      panel.classList.remove('is-open');
      panel.hidden = mobileQuery.matches;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };

    const syncMenuState = () => {
      if (!mobileQuery.matches) {
        panel.hidden = false;
        closeMenu();
        return;
      }

      panel.hidden = !panel.classList.contains('is-open');
      toggle.setAttribute('aria-expanded', panel.classList.contains('is-open') ? 'true' : 'false');
      toggle.setAttribute(
        'aria-label',
        panel.classList.contains('is-open') ? 'Close navigation' : 'Open navigation'
      );
    };

    toggle.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('is-open');
      panel.hidden = !isOpen;
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });

    document.addEventListener('click', (event) => {
      if (!mobileQuery.matches || !panel.classList.contains('is-open')) {
        return;
      }

      if (!nav.contains(event.target)) {
        closeMenu();
      }
    });

    panel.addEventListener('click', (event) => {
      if (mobileQuery.matches && event.target.closest('a')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    mobileQuery.addEventListener('change', syncMenuState);
    window.addEventListener('resize', syncMenuState);
    panel.hidden = mobileQuery.matches;
    syncMenuState();
  }

  if (prompt && document.body.classList.contains('home-page')) {
    const openPrompt = () => {
      prompt.classList.remove('is-closing');
      prompt.hidden = false;
      prompt.classList.add('is-open');
    };

    const closePrompt = () => {
      if (prompt.classList.contains('is-closing')) {
        return;
      }

      prompt.classList.add('is-closing');
      prompt.classList.remove('is-open');

      const finishClose = (event) => {
        if (event.target !== promptPanel) {
          return;
        }

        prompt.hidden = true;
        prompt.classList.remove('is-closing');
        promptPanel?.removeEventListener('animationend', finishClose);
      };

      promptPanel?.addEventListener('animationend', finishClose);
    };

    window.setTimeout(openPrompt, 420);

    promptCloseTargets.forEach((target) => {
      target.addEventListener('click', closePrompt);
    });

    prompt.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && prompt.classList.contains('is-open')) {
        closePrompt();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && prompt.classList.contains('is-open')) {
        closePrompt();
      }
    });
  }
});
