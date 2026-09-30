/* ==================================================
   PORTFOLIO SCRIPTS
   Theme / menu toggle / scrollspy / footer year
================================================== */

"use strict";


/* ==================================================
   THEME TOGGLE
   Light <-> dark, remembered in localStorage
================================================== */

const themeToggle = document.querySelector(".theme-toggle");

const THEME_KEY = "portfolio-theme";


function applyTheme(theme, save) {

    const dark = theme === "dark";

    document.documentElement.setAttribute("data-theme", theme);

    if (themeToggle) {

        themeToggle.setAttribute("aria-pressed", String(dark));

        themeToggle.setAttribute(
            "aria-label",
            dark ? "Switch to light theme" : "Switch to dark theme"
        );
    }


    /* Keep the browser UI color in sync */

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    if (themeColorMeta) {
        themeColorMeta.setAttribute("content", dark ? "#010003" : "#003049");
    }


    if (save) {

        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {}
    }
}


if (themeToggle) {

    /* Sync the button with the theme chosen in <head> */

    applyTheme(
        document.documentElement.getAttribute("data-theme") || "light",
        false
    );


    themeToggle.addEventListener("click", () => {

        const isDark =
            document.documentElement.getAttribute("data-theme") === "dark";

        applyTheme(isDark ? "light" : "dark", true);
    });
}


/* ==================================================
   LANGUAGE TOGGLE
   English (default) <-> Spanish, remembered
   in localStorage
================================================== */

const LANG_KEY = "portfolio-lang";

const langToggle = document.querySelector(".lang-toggle");

const TRANSLATIONS = {

    en: {
        docTitle: "Portfolio | Sebastián Ruiz",
        docDesc:
            "Professional portfolio of Sebastián Ruiz, systems engineer and web developer",
        navAria: "Main navigation",
        menuToggleAria: "Open navigation menu",
        themeToDark: "Switch to dark theme",
        themeToLight: "Switch to light theme",
        heroTitle: "Hello, I'm Sebastian",
        heroText:
            "I am a systems engineer and web developer passionate about " +
            "building clean, functional web experiences. I recently " +
            "launched <strong>Notes_VTT</strong>, a progressive web app " +
            "for musicians, and I am always learning something new — " +
            "from frontend development to databases and deployment.",
        navProjects: "Projects",
        navContact: "Contact",
        skillsTitle: "Skills",
        aboutTitle: "About Me",
        profileTitle: "Professional Profile",
        profileText:
            "I have experience in frontend development and in creating " +
            "web interfaces using modern technologies.",
        infoTitle: "Additional Information",
        infoLocation: "Location: Bogotá, Colombia",
        infoAvailability: "Availability: Freelance",
        infoLanguages: "Languages: Spanish and English",
        projectsTitle: "My Projects",
        p1Title: "Notes_VTT",
        p1Desc:
            "Progressive web app for writing song notes and lyrics, " +
            "with chips linking to YouTube beats. Google sign-in and " +
            "real-time sync across devices.",
        p1Tech:
            "<strong>Technologies:</strong> " +
            "HTML, CSS, JavaScript, Firebase (Firestore + Auth).",
        p1Link: "Open app",
        p1LinkAria: "Open Notes_VTT app",
        p5Title: "Jewelry Management System",
        p5Desc:
            "Real production management system for a jewelry store: " +
            "product catalog, inventory, daily sales and QR code labels. " +
            "Works without internet (offline-first) and automatically " +
            "syncs with the cloud every 10 minutes, conflict-free, " +
            "through UUID-based sync.",
        p5Tech:
            "<strong>Technologies:</strong> " +
            "Python, FastAPI, SQLite, JavaScript, Cloudflare Workers + D1.",
        p5Link: "In production — private code",
        p2Title: "Online Store",
        p2Desc:
            "Development of an online store with a product catalog, " +
            "shopping cart, and contact form.",
        p2LinkAria: "View Online Store project",
        p3Title: "Personal Blog",
        p3Desc:
            "Blog designed for publishing articles related to " +
            "technology and web development.",
        p3LinkAria: "View Personal Blog project",
        p4Title: "Task Application",
        p4Desc:
            "Web application for creating, completing, and deleting " +
            "tasks using local storage.",
        p4LinkAria: "View Task Application project",
        techHtml: "<strong>Technologies:</strong> HTML, CSS and JavaScript.",
        viewProject: "View project",
        contactTitle: "Contact",
        contactText: "You can find me on my social media:",
        footerName: "Sebastian Ruiz.",
    },

    es: {
        docTitle: "Portafolio | Sebastián Ruiz",
        docDesc:
            "Portafolio profesional de Sebastián Ruiz, ingeniero de " +
            "sistemas y desarrollador web",
        navAria: "Navegación principal",
        menuToggleAria: "Abrir menú de navegación",
        themeToDark: "Cambiar a tema oscuro",
        themeToLight: "Cambiar a tema claro",
        heroTitle: "Hola, soy Sebastián",
        heroText:
            "Soy ingeniero de sistemas y desarrollador web apasionado " +
            "por construir experiencias web limpias y funcionales. " +
            "Recientemente lancé <strong>Notes_VTT</strong>, una app " +
            "progresiva para músicos, y siempre estoy aprendiendo algo " +
            "nuevo — desde desarrollo frontend hasta bases de datos " +
            "y despliegue.",
        navProjects: "Proyectos",
        navContact: "Contacto",
        skillsTitle: "Habilidades",
        aboutTitle: "Sobre mí",
        profileTitle: "Perfil profesional",
        profileText:
            "Tengo experiencia en desarrollo frontend y en la creación " +
            "de interfaces web con tecnologías modernas.",
        infoTitle: "Información adicional",
        infoLocation: "Ubicación: Bogotá, Colombia",
        infoAvailability: "Disponibilidad: Freelance",
        infoLanguages: "Idiomas: Español e inglés",
        projectsTitle: "Mis proyectos",
        p1Title: "Notes_VTT",
        p1Desc:
            "App progresiva para escribir notas de canciones y letras, " +
            "con chips que enlazan a beats de YouTube. Inicio de sesión " +
            "con Google y sincronización en tiempo real entre dispositivos.",
        p1Tech:
            "<strong>Tecnologías:</strong> " +
            "HTML, CSS, JavaScript, Firebase (Firestore + Auth).",
        p1Link: "Abrir app",
        p1LinkAria: "Abrir la app Notes_VTT",
        p5Title: "Sistema de gestión de joyería",
        p5Desc:
            "Sistema de gestión en producción real para una joyería: " +
            "catálogo de productos, inventario, ventas diarias y etiquetas " +
            "con código QR. Funciona sin internet (offline-first) y se " +
            "sincroniza automáticamente con la nube cada 10 minutos, sin " +
            "conflictos, mediante UUID.",
        p5Tech:
            "<strong>Tecnologías:</strong> " +
            "Python, FastAPI, SQLite, JavaScript, Cloudflare Workers + D1.",
        p5Link: "En producción — código privado",
        p2Title: "Tienda online",
        p2Desc:
            "Desarrollo de una tienda online con catálogo de productos, " +
            "carrito de compras y formulario de contacto.",
        p2LinkAria: "Ver el proyecto Tienda online",
        p3Title: "Blog personal",
        p3Desc:
            "Blog diseñado para publicar artículos sobre tecnología " +
            "y desarrollo web.",
        p3LinkAria: "Ver el proyecto Blog personal",
        p4Title: "Aplicación de tareas",
        p4Desc:
            "Aplicación web para crear, completar y eliminar tareas " +
            "usando almacenamiento local.",
        p4LinkAria: "Ver el proyecto Aplicación de tareas",
        techHtml: "<strong>Tecnologías:</strong> HTML, CSS y JavaScript.",
        viewProject: "Ver proyecto",
        contactTitle: "Contacto",
        contactText: "Puedes encontrarme en mis redes sociales:",
        footerName: "Sebastián Ruiz.",
    },
};


function translation(key) {
    return TRANSLATIONS[currentLang][key];
}


function applyLang(lang, save) {

    currentLang = lang;

    document.documentElement.setAttribute("lang", lang);

    document.title = translation("docTitle");

    document.querySelectorAll("[data-i18n]").forEach((element) => {

        const value = TRANSLATIONS[lang][element.getAttribute("data-i18n")];

        if (value === undefined) {
            return;
        }

        if (element.hasAttribute("data-i18n-html")) {
            element.innerHTML = value;
        } else {
            element.textContent = value;
        }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {

        const value = TRANSLATIONS[lang][element.getAttribute("data-i18n-aria")];

        if (value !== undefined) {
            element.setAttribute("aria-label", value);
        }
    });


    /* Meta description and Open Graph */

    const descriptionMeta = document.querySelector('meta[name="description"]');

    const ogDescription = document.querySelector(
        'meta[property="og:description"]'
    );

    if (descriptionMeta) {
        descriptionMeta.setAttribute("content", translation("docDesc"));
    }

    if (ogDescription) {
        ogDescription.setAttribute("content", translation("docDesc"));
    }


    /* Button shows the language you can switch TO */

    if (langToggle) {

        langToggle.textContent = lang === "en" ? "ES" : "EN";

        langToggle.setAttribute(
            "aria-label",
            lang === "en" ? "Cambiar idioma a español" : "Switch language to English"
        );
    }


    /* Refresh the theme button label in the new language */

    if (themeToggle) {

        const dark =
            document.documentElement.getAttribute("data-theme") === "dark";

        themeToggle.setAttribute(
            "aria-label",
            dark ? translation("themeToLight") : translation("themeToDark")
        );
    }


    if (save) {

        try {
            localStorage.setItem(LANG_KEY, lang);
        } catch (error) {}
    }
}


let currentLang = "en";


try {

    const savedLang = localStorage.getItem(LANG_KEY);

    if (savedLang === "es" || savedLang === "en") {
        applyLang(savedLang, false);
    }

} catch (error) {}


if (langToggle) {

    langToggle.addEventListener("click", () => {
        applyLang(currentLang === "en" ? "es" : "en", true);
    });
}


/* ==================================================
   HAMBURGER MENU
================================================== */

const menuToggle = document.querySelector(".menu__toggle");
const menuList = document.querySelector(".menu__lista");


function setMenu(open) {

    menuList.classList.toggle("menu__lista--open", open);

    menuToggle.setAttribute("aria-expanded", String(open));
}


if (menuToggle && menuList) {

    menuToggle.addEventListener("click", () => {
        setMenu(!menuList.classList.contains("menu__lista--open"));
    });


    /* Close when a link inside the menu is clicked */

    menuList.addEventListener("click", (event) => {

        if (event.target.closest("a")) {
            setMenu(false);
        }
    });


    /* Close with the Escape key */

    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            menuList.classList.contains("menu__lista--open")
        ) {
            setMenu(false);
            menuToggle.focus();
        }
    });
}


/* ==================================================
   FOOTER YEAR
================================================== */

const footerYear = document.querySelector(".footer__texto time");

if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}


/* ==================================================
   SCROLLSPY
   Highlights the icon of the current section
================================================== */

const menuLinks = [...document.querySelectorAll(".menu__link")];

const sections = menuLinks
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);


function setActiveLink(id) {

    menuLinks.forEach((link) => {

        const isActive = link.hash === `#${id}`;

        link.classList.toggle("menu__link--active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "true");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}


if ("IntersectionObserver" in window && sections.length > 0) {

    const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {
                setActiveLink(entry.target.id);
            }
        });

    }, {
        rootMargin: "-35% 0px -55% 0px",
    });

    sections.forEach((section) => observer.observe(section));


    /* The hero is short on tall screens and never
       reaches the observer band, so it is watched
       explicitly for its home button */

    const inicioSection = document.querySelector("#inicio");

    if (inicioSection) {
        observer.observe(inicioSection);
    }
}


/* The first and last sections can never reach the
   observer band: the hero is too short on tall
   screens, and the footer + github link push the
   contact section out of the band at max scroll.
   Detect "near the top / bottom" directly. */

function isNearPageTop() {
    return window.scrollY <= 24;
}


function isNearPageBottom() {

    const scrollBottom = window.scrollY + window.innerHeight;

    const limit = document.documentElement.scrollHeight - 32;

    return scrollBottom >= limit;
}


window.addEventListener("scroll", () => {

    if (sections.length === 0) {
        return;
    }

    /* At the top the home button lights up */

    if (isNearPageTop()) {
        setActiveLink(sections[0].id);

    } else if (isNearPageBottom()) {
        setActiveLink(sections[sections.length - 1].id);
    }

}, { passive: true });


/* Handle a page opened already scrolled to an end */

if (sections.length > 0) {

    if (isNearPageTop()) {
        setActiveLink(sections[0].id);

    } else if (isNearPageBottom()) {
        setActiveLink(sections[sections.length - 1].id);
    }
}