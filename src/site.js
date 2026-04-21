document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.site-nav');
  const links = nav?.querySelector('.site-nav__links');

  if (!nav || !links || nav.querySelector('.site-nav__toggle')) {
    return;
  }

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
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };

  const syncMenuState = () => {
    if (!mobileQuery.matches) {
      closeMenu();
      return;
    }

    toggle.setAttribute('aria-expanded', panel.classList.contains('is-open') ? 'true' : 'false');
    toggle.setAttribute(
      'aria-label',
      panel.classList.contains('is-open') ? 'Close navigation' : 'Open navigation'
    );
  };

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
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
  syncMenuState();
});
