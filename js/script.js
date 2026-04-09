document.documentElement.classList.add("js-enabled");

const COMMUNITY_LINKS = {
    discord: "https://discord.gg/zAweNAyBbs",
    youtube: "https://www.youtube.com/@saturnaero",
    email: "mailto:saturnaerospaceksp@gmail.com"
};

const currentPage = document.body.dataset.page;
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const siteHeader = document.querySelector("[data-site-header]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-nav-link]").forEach((link) => {
    if (link.dataset.navLink === currentPage) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
    }
});

if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            nav.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
}

if (siteHeader) {
    const syncHeader = () => {
        siteHeader.classList.toggle("is-scrolled", window.scrollY > 14);
    };

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
}

document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
});

document.querySelectorAll("[data-community-link]").forEach((link) => {
    const key = link.dataset.communityLink;
    const url = COMMUNITY_LINKS[key];

    if (!url) {
        return;
    }

    link.setAttribute("href", url);

    if (url.startsWith("http")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noreferrer");
    }
});

const revealItems = document.querySelectorAll("[data-reveal]");

if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.18
    });

    revealItems.forEach((item) => observer.observe(item));
}
