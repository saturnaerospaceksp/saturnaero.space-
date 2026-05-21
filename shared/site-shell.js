(() => {
  const marker = '/saturnaero.space-/';
  const path = decodeURIComponent(window.location.pathname.replace(/\\/g, '/'));
  const markerIndex = path.indexOf(marker);
  const relative = markerIndex >= 0 ? path.slice(markerIndex + marker.length) : path.replace(/^\/+/, '');
  const depth = Math.max(0, relative.split('/').filter(Boolean).length - 1);
  const root = depth > 0 ? '../'.repeat(depth) : './';
  const launchStorageKey = 'saturn-launches';

  const readSharedState = () => {
    try {
      const parsed = JSON.parse(window.name || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeSharedState = (state) => {
    try {
      window.name = JSON.stringify(state);
    } catch {
      // Ignore name storage failures and fall back to localStorage only.
    }
  };

  const readStoredValue = (key) => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore localStorage access errors and fall back to window.name.
    }

    const sharedState = readSharedState();
    return sharedState[key];
  };

  const writeStoredValue = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore localStorage write errors and persist via window.name below.
    }

    const sharedState = readSharedState();
    sharedState[key] = value;
    writeSharedState(sharedState);
  };

  const siteStateStorageKeys = {
    stats: 'saturn-home-stats',
    roles: 'saturn-careers-roles',
    launches: launchStorageKey,
  };

  const defaultSiteState = {
    stats: { completed: 13, payloads: 8, reflown: 10 },
    roles: [],
    launches: [],
  };

  const normalizeStats = (stats) => ({
    completed: Math.max(0, Math.floor(Number(stats?.completed ?? defaultSiteState.stats.completed))),
    payloads: Math.max(0, Math.floor(Number(stats?.payloads ?? defaultSiteState.stats.payloads))),
    reflown: Math.max(0, Math.floor(Number(stats?.reflown ?? defaultSiteState.stats.reflown))),
  });

  const toDate = (value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  };

  const normalizeLaunch = (launch, index = 0) => {
    const date = toDate(launch?.launchDateTime);
    return {
      id: String(launch?.id || `launch-${index}`),
      missionName: String(launch?.missionName || 'Untitled Mission'),
      missionDescription: String(launch?.missionDescription || ''),
      orbitType: String(launch?.orbitType || 'TBC'),
      launchDateTime: date ? date.toISOString() : '',
      launchSite: String(launch?.launchSite || 'TBC'),
      vehicle: String(launch?.vehicle || 'TBC'),
    };
  };

  const normalizeRole = (role, index = 0) => ({
    id: String(role?.id || `role-${index}`),
    title: String(role?.title || 'Untitled Role'),
    location: String(role?.location || 'Location TBC'),
    type: String(role?.type || 'Full-time'),
    status: role?.status === 'closed' ? 'closed' : 'open',
    summary: String(role?.summary || ''),
    roleDescription: String(role?.roleDescription || role?.description || role?.summary || ''),
    experienceRequired: String(role?.experienceRequired || ''),
  });

  const normalizeSiteState = (state) => {
    const stats = normalizeStats(state?.stats);
    const roles = Array.isArray(state?.roles) ? state.roles.filter((role) => role && typeof role === 'object').map((role, index) => normalizeRole(role, index)) : [];
    const launches = Array.isArray(state?.launches)
      ? state.launches
          .filter((launch) => launch && typeof launch === 'object')
          .map((launch, index) => normalizeLaunch(launch, index))
          .filter((launch) => launch.launchDateTime)
          .sort((a, b) => new Date(a.launchDateTime).getTime() - new Date(b.launchDateTime).getTime())
      : [];

    return { stats, roles, launches };
  };

  const readLegacySiteState = () => {
    const stats = normalizeStats(readStoredValue(siteStateStorageKeys.stats));

    const rawRoles = readStoredValue(siteStateStorageKeys.roles);
    const roles = Array.isArray(rawRoles)
      ? rawRoles.filter((role) => role && typeof role === 'object').map((role, index) => normalizeRole(role, index))
      : [];

    const rawLaunches = readStoredValue(siteStateStorageKeys.launches);
    const launches = Array.isArray(rawLaunches)
      ? rawLaunches
          .filter((launch) => launch && typeof launch === 'object')
          .map((launch, index) => normalizeLaunch(launch, index))
          .filter((launch) => launch.launchDateTime)
          .sort((a, b) => new Date(a.launchDateTime).getTime() - new Date(b.launchDateTime).getTime())
      : [];

    return { stats, roles, launches };
  };

  const writeLegacySiteState = (state) => {
    cachedSiteState = normalizeSiteState(state);
    writeStoredValue(siteStateStorageKeys.stats, cachedSiteState.stats);
    writeStoredValue(siteStateStorageKeys.roles, cachedSiteState.roles);
    writeStoredValue(siteStateStorageKeys.launches, cachedSiteState.launches);
  };

  let cachedSiteState = null;
  const siteStateUrl = `${root}data/site-state.json`;
  const siteStateReady = (async () => {
    let publishedState = null;
    try {
      const response = await fetch(siteStateUrl, { cache: 'no-store' });
      if (response.ok) {
        publishedState = await response.json();
      }
    } catch {
      // Ignore fetch failures and fall back to the browser state.
    }

    const legacyState = readLegacySiteState();
    const merged = normalizeSiteState(publishedState || legacyState);
    cachedSiteState = merged;
    if (!publishedState) {
      writeLegacySiteState(merged);
    }
    return merged;
  })();

  window.SaturnSiteState = {
    ready: siteStateReady,
    getState: () => cachedSiteState || readLegacySiteState(),
    getStats: () => (cachedSiteState || readLegacySiteState()).stats,
    getRoles: () => (cachedSiteState || readLegacySiteState()).roles,
    getLaunches: () => (cachedSiteState || readLegacySiteState()).launches,
    normalizeSiteState,
    writeLegacySiteState,
  };

  if (!window.SaturnLaunches) {
    const readLaunches = () => {
      return (cachedSiteState || readLegacySiteState()).launches;
    };

    const writeLaunches = (launches) => {
      const normalized = launches.map((launch, index) => normalizeLaunch(launch, index));
      const nextState = {
        ...(cachedSiteState || readLegacySiteState()),
        launches: normalized,
      };
      cachedSiteState = normalizeSiteState(nextState);
      writeLegacySiteState(cachedSiteState);
    };

    const getUpcomingLaunches = (now = Date.now()) =>
      readLaunches().filter((launch) => new Date(launch.launchDateTime).getTime() >= now);

    const getNextLaunch = (now = Date.now()) => getUpcomingLaunches(now)[0] || null;

    const formatLaunchDateTime = (iso) => {
      const date = toDate(iso);
      if (!date) return 'TBC';

      return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(date);
    };

    const formatCountdown = (iso, now = Date.now()) => {
      const target = toDate(iso);
      if (!target) return '';

      const delta = target.getTime() - now;
      if (delta <= 0) return '';

      const totalSeconds = Math.floor(delta / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (value) => String(value).padStart(2, '0');
      return `T-${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const getWidgetState = (launch, now = Date.now()) => {
      if (!launch) {
        return { label: 'UPCOMING LAUNCHES', countdown: '' };
      }

      const target = toDate(launch.launchDateTime);
      if (!target) {
        return { label: 'UPCOMING LAUNCHES', countdown: '' };
      }

      const delta = target.getTime() - now;
      if (delta <= 0 || delta >= 24 * 60 * 60 * 1000) {
        return { label: 'UPCOMING LAUNCHES', countdown: '' };
      }

      return { label: 'UPCOMING LAUNCHES', countdown: formatCountdown(launch.launchDateTime, now) };
    };

      window.SaturnLaunches = {
        storageKey: launchStorageKey,
        normalizeLaunch,
        readLaunches,
        writeLaunches,
        getUpcomingLaunches,
        getNextLaunch,
        formatLaunchDateTime,
        formatCountdown,
        getWidgetState,
      };
  }

  const headerExists = Boolean(document.querySelector('.masthead'));
  const footerExists = Boolean(document.querySelector('.site-footer'));

  const shellCssId = 'site-shell-css';
  if (!document.getElementById(shellCssId)) {
    const link = document.createElement('link');
    link.id = shellCssId;
    link.rel = 'stylesheet';
    link.href = `${root}shared/site-shell.css`;
    document.head.appendChild(link);
  }

  const buildLaunchWidget = (header) => {
    if (!header || header.querySelector('[data-launch-widget]')) {
      return;
    }

    const widget = document.createElement('div');
    widget.className = 'masthead__launch';
    widget.dataset.launchWidget = 'true';
    widget.innerHTML = `
      <button class="masthead__launch-button" type="button" aria-expanded="false">
        <span class="masthead__launch-label">Upcoming Launches</span>
        <span class="masthead__launch-countdown" hidden></span>
        <span class="masthead__launch-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="masthead__launch-menu" role="menu" aria-label="Upcoming launches">
        <div class="masthead__launch-list"></div>
        <a class="masthead__launch-link" href="${root}upcoming-launches/">All upcoming launches</a>
      </div>
    `;

    header.appendChild(widget);

    const button = widget.querySelector('.masthead__launch-button');
    const menu = widget.querySelector('.masthead__launch-menu');
    const list = widget.querySelector('.masthead__launch-list');
    const label = widget.querySelector('.masthead__launch-label');
    const countdown = widget.querySelector('.masthead__launch-countdown');

    const renderMenu = () => {
      if (!list) return;

      const launches = window.SaturnLaunches.getUpcomingLaunches();
      list.innerHTML = '';

      if (!launches.length) {
        const empty = document.createElement('div');
        empty.className = 'masthead__launch-empty';
        empty.textContent = 'No upcoming launches scheduled.';
        list.append(empty);
        return;
      }

      launches.slice(0, 3).forEach((launch) => {
        const item = document.createElement('a');
        item.className = 'masthead__launch-item';
        item.href = `${root}upcoming-launches/`;

        const mission = document.createElement('p');
        mission.className = 'masthead__launch-mission';
        mission.textContent = launch.missionName;

        const meta = document.createElement('p');
        meta.className = 'masthead__launch-meta';
        meta.textContent = window.SaturnLaunches.formatLaunchDateTime(launch.launchDateTime);

        item.append(mission, meta);
        list.append(item);
      });
    };

    const updateButton = () => {
      const nextLaunch = window.SaturnLaunches.getNextLaunch();
      const state = window.SaturnLaunches.getWidgetState(nextLaunch);
      label.textContent = state.label;
      if (state.countdown) {
        countdown.hidden = false;
        countdown.textContent = state.countdown;
      } else {
        countdown.hidden = true;
        countdown.textContent = '';
      }
      renderMenu();
    };

    updateButton();
    siteStateReady.then(() => {
      updateButton();
    });
    window.setInterval(updateButton, 1000);

    const closeWidget = () => {
      widget.classList.remove('is-open');
      button?.setAttribute('aria-expanded', 'false');
    };

    const openWidget = () => {
      widget.classList.add('is-open');
      button?.setAttribute('aria-expanded', 'true');
    };

    let closeTimer = null;
    const clearCloseTimer = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    widget.addEventListener('pointerenter', () => {
      clearCloseTimer();
      openWidget();
    });

    widget.addEventListener('pointerleave', () => {
      clearCloseTimer();
      closeTimer = window.setTimeout(closeWidget, 120);
    });

    widget.addEventListener('focusin', () => {
      clearCloseTimer();
      openWidget();
    });

    widget.addEventListener('focusout', (event) => {
      if (widget.contains(event.relatedTarget)) {
        return;
      }

      clearCloseTimer();
      closeTimer = window.setTimeout(closeWidget, 120);
    });

    button?.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = widget.classList.contains('is-open');
      closeWidget();
      if (!isOpen) {
        openWidget();
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-launch-widget]')) {
        closeWidget();
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key === launchStorageKey) {
        updateButton();
      }
    });
  };

  if (!headerExists) {
    const header = document.createElement('header');
    header.className = 'masthead';
    header.setAttribute('aria-label', 'Primary navigation');
    header.dataset.siteShell = 'header';
    header.innerHTML = `
      <a class="masthead__home" href="${root}" aria-label="Saturn Aerospace home" data-brand-cycle>#SATURN</a>
      <nav class="nav" aria-label="Site sections">
        <div class="nav__group" data-nav-group>
          <button class="nav__button" type="button" aria-expanded="false">Vehicles</button>
          <div class="nav__menu" role="menu" aria-label="Vehicles">
            <span class="nav__link" aria-disabled="true">Coming Soon!</span>
          </div>
        </div>
        <div class="nav__group" data-nav-group>
          <button class="nav__button" type="button" aria-expanded="false">Technologies</button>
          <div class="nav__menu" role="menu" aria-label="Technologies">
            <a class="nav__link" href="${root}scom/">SCOM</a>
            <a class="nav__link" href="${root}mnswt/">MNSWT</a>
          </div>
        </div>
        <div class="nav__group" data-nav-group>
          <button class="nav__button" type="button" aria-expanded="false">Company</button>
          <div class="nav__menu" role="menu" aria-label="Company">
            <a class="nav__link" href="${root}team/">Team</a>
            <a class="nav__link" href="${root}careers/">Careers</a>
            <a class="nav__link" href="${root}our-goal/">Our Goal</a>
          </div>
        </div>
        <div class="nav__group" data-nav-group>
          <button class="nav__button" type="button" aria-expanded="false">Launches</button>
          <div class="nav__menu" role="menu" aria-label="Launches">
            <a class="nav__link" href="${root}upcoming-launches/">Upcoming Launches</a>
            <a class="nav__link" href="${root}launch-with-us/">Launch With Us</a>
          </div>
        </div>
      </nav>
      <button class="masthead__toggle" type="button" aria-label="Open navigation" aria-expanded="false">
        <span class="masthead__toggle-lines" aria-hidden="true"><span></span></span>
      </button>
    `;
    document.body.prepend(header);
  }

  buildLaunchWidget(document.querySelector('.masthead'));

  if (!footerExists) {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.setAttribute('aria-label', 'Site footer');
    footer.dataset.siteShell = 'footer';
    footer.innerHTML = `
      <div class="site-footer__inner">
        <nav class="site-footer__links" aria-label="Important pages">
          <a href="${root}careers/">Careers</a>
          <a href="${root}launch-with-us/">Launch With Us</a>
          <a href="${root}our-goal/">Our Goal</a>
          <a href="${root}upcoming-launches/">Upcoming Launches</a>
          <a href="${root}privacy-policy/">Privacy Policy</a>
        </nav>
        <p class="site-footer__copyright">Copyright Saturn Aerospace 2026 - All Rights Reserved</p>
      </div>
    `;
    document.body.appendChild(footer);
  }

  const shellGroups = Array.from(document.querySelectorAll('.masthead [data-nav-group]'));
  if (shellGroups.length) {
    const header = document.querySelector('header[data-site-shell="header"], header.masthead');
    const toggle = header?.querySelector('.masthead__toggle');
    const brand = header?.querySelector('[data-brand-cycle]');

    if (brand) {
      const labels = ['#RHE4', '#DAPHNIS', '#HYPERION', '#AEGIR', '#SATURN'];
      let index = 4;
      let timer = null;

      const setLabel = (nextIndex) => {
        index = nextIndex;
        brand.classList.add('is-changing');
        brand.textContent = labels[index];
        window.setTimeout(() => {
          brand.classList.remove('is-changing');
        }, 120);
      };

      const advance = () => setLabel((index + 1) % labels.length);

      const startCycle = () => {
        stopCycle();
        timer = window.setInterval(advance, 3200);
      };

      const stopCycle = () => {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      };

      brand.addEventListener('pointerenter', () => {
        advance();
      });

      startCycle();
    }

    const closeGroup = (group) => {
      const button = group.querySelector('.nav__button');
      group.classList.remove('is-open');
      button?.setAttribute('aria-expanded', 'false');
    };

    const openGroup = (group) => {
      const button = group.querySelector('.nav__button');
      group.classList.add('is-open');
      button?.setAttribute('aria-expanded', 'true');
    };

    shellGroups.forEach((group) => {
      let closeTimer = null;

      const clearCloseTimer = () => {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
      };

      group.addEventListener('pointerenter', () => {
        clearCloseTimer();
        openGroup(group);
      });

      group.addEventListener('pointerleave', () => {
        clearCloseTimer();
        closeTimer = window.setTimeout(() => closeGroup(group), 120);
      });

      group.addEventListener('focusin', () => {
        clearCloseTimer();
        openGroup(group);
      });

      group.addEventListener('focusout', (event) => {
        if (group.contains(event.relatedTarget)) {
          return;
        }

        clearCloseTimer();
        closeTimer = window.setTimeout(() => closeGroup(group), 120);
      });

      group.querySelector('.nav__button')?.addEventListener('click', () => {
        const isOpen = group.classList.contains('is-open');
        shellGroups.forEach(closeGroup);
        if (!isOpen) {
          openGroup(group);
        }
      });
    });

    const closeHeaderNav = () => {
      header?.classList.remove('is-nav-open');
      toggle?.setAttribute('aria-expanded', 'false');
      shellGroups.forEach(closeGroup);
    };

    toggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = header?.classList.toggle('is-nav-open');
      toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
      if (!isOpen) {
        shellGroups.forEach(closeGroup);
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.nav__group') && !event.target.closest('.masthead__toggle')) {
        closeHeaderNav();
      }
    });
  }
})();
