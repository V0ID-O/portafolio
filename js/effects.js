/* ==================================================
   UI EFFECTS
   - Reveal on scroll (sections + project cards)
   - Typewriter on the hero title
   - 3D tilt on project cards

   All of it is skipped for users who prefer
   reduced motion.
================================================== */

"use strict";

(function () {

    const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* ---------- Reveal on scroll ---------- */

    const revealTargets = document.querySelectorAll(
        ".sobre-mi, .habilidades, .proyectos, .contacto"
    );

    if (!reduced && "IntersectionObserver" in window && revealTargets.length) {

        revealTargets.forEach((section) => {
            section.classList.add("reveal-pending");
        });

        const revealObserver = new IntersectionObserver((entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("is-visible");

                    revealObserver.unobserve(entry.target);
                }
            });

        }, {
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.05,
        });

        revealTargets.forEach((section) => revealObserver.observe(section));


        /* Project cards pop in staggered */

        document.querySelectorAll(".proyectos .proyecto")
            .forEach((card, i) => {

                card.style.transitionDelay = ((i % 2) * 90) + "ms";
            });
    }


    /* ---------- Typewriter hero title ---------- */

    const titulo = document.querySelector(".inicio__titulo");

    if (!reduced && titulo) {

        const texto = titulo.textContent.replace(/\s+/g, " ").trim();

        /* Screen readers get the full text at once */

        titulo.setAttribute("aria-label", texto);

        titulo.textContent = "";

        const cursor = document.createElement("span");

        cursor.className = "type-cursor";
        cursor.setAttribute("aria-hidden", "true");
        cursor.textContent = "▍";

        titulo.appendChild(cursor);

        let i = 0;

        (function type() {

            if (i >= texto.length) {
                return; /* Cursor keeps blinking forever */
            }

            cursor.insertAdjacentText("beforebegin", texto[i]);

            i += 1;

            /* Tiny pause at spaces and punctuation */

            const previous = texto[i - 1];

            const delay =
                previous === " " ? 30 :
                (previous === "," || previous === "." || previous === "'") ? 220 :
                55;

            setTimeout(type, delay);
        })();
    }


    /* ---------- 3D tilt on project cards ---------- */

    if (!reduced && window.matchMedia("(pointer: fine)").matches) {

        document.querySelectorAll(".proyecto").forEach((card) => {

            card.addEventListener("mousemove", (event) => {

                const rect = card.getBoundingClientRect();

                const x = (event.clientX - rect.left) / rect.width - 0.5;

                const y = (event.clientY - rect.top) / rect.height - 0.5;

                card.style.transform =
                    "perspective(700px)" +
                    " rotateX(" + (-y * 8).toFixed(2) + "deg)" +
                    " rotateY(" + (x * 8).toFixed(2) + "deg)";
            });

            card.addEventListener("mouseleave", () => {

                card.style.transform = "";
            });
        });
    }

})();