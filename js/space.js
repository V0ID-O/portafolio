/* ==================================================
   SPACE TRAFFIC
   Decorative pixel-art scene: drifting stars
   plus, every now and then, a comet, a rocket
   or an alien UFO flying across.

   Two layers:
   - Inside the sticky menu (stars only).
   - Full viewport (stars + traffic), behind
     the page content.
================================================== */

"use strict";

(function () {


    /* No scene for users who prefer reduced motion */

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }


    const menu = document.querySelector(".menu");


    /* ---------- Config ---------- */

    const SPAWN_MIN_MS = 2500;
    const SPAWN_MAX_MS = 6500;
    const FIRST_SPAWN_MS = 800;


    /* ---------- Pixel maps ---------- */

    /* Alien UFO, 13x7. C = glass dome, B = hull,
       L = running light, . = transparent */

    const UFO_MAP = [
        ".....CCC.....",
        "....CCCCC....",
        "..BBBBBBBBB..",
        ".BBBBBBBBBBB.",
        "BLBLBLBLBLBLB",
        ".BBBBBBBBBBB.",
        "..B.......B..",
    ];


    /* Rocket facing RIGHT, 11x7. F = fuselage,
       W = window, . = transparent. The flame is
       drawn behind it with a live flicker. */

    const ROCKET_MAP = [
        "....FFF....",
        "..FFFFFFF..",
        ".FFWWFFFFF.",
        "FFWWFFFFFFF",
        ".FFWWFFFFF.",
        "..FFFFFFF..",
        "....FFF....",
    ];


    /* Space station, 11x5. P = solar panels,
       M = central module, . = transparent */

    const ISS_MAP = [
        "PPPP...PPPP",
        "PPPPMMMPPPP",
        "....MMM....",
        "PPPPMMMPPPP",
        "PPPP...PPPP",
    ];


    /* ---------- Scene factory ----------
       One independent scene per canvas: menu
       (traffic: false) and full viewport. */

    function createScene(canvas, options) {

        const ctx = canvas.getContext("2d");

        const traffic = !!canvas.traffic;
        const scaleSprites = canvas.spaceScale || 3;

        let stars = [];
        let sprites = [];
        let nextSpawnAt = 0;
        let nextMeteorAt = 0;
        let nextIssAt = 0;
        let width = 0;
        let height = 0;


        /* ---------- Helpers ---------- */

        function cssVar(name) {
            return getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim();
        }


        function palette() {

            const dark =
                document.documentElement.getAttribute("data-theme") === "dark";

            return dark ? {
                star: "210, 228, 255",
                dome: "rgba(160, 220, 255, 0.85)",
                hull: "#39435a",
                hullDark: "#2a3244",
                flameA: "#ffb703",
                flameB: "#ff5d5d",
                cometHead: "#eaf6ff",
                cometTail: "160, 210, 255",
                meteorHead: "#ffffff",
                meteorTail: "255, 255, 255",
                panel: "#3e6fb8",
                module: "#c9d4e4",
                planet: "#5b6c9e",
                planetShade: "#3c4a75",
                ring: "rgba(200, 215, 255, 0.45)",
                moon: "#b9c4d8",
                moonShade: "#8b97ad",
                nebulaA: "138, 84, 255",
                nebulaB: "77, 159, 255",
            } : {
                star: "90, 110, 140",
                dome: "rgba(120, 190, 240, 0.8)",
                hull: "#4a5568",
                hullDark: "#37415a",
                flameA: "#f08c00",
                flameB: "#d64545",
                cometHead: "#5a7ba6",
                cometTail: "120, 160, 210",
                meteorHead: "#4a6a94",
                meteorTail: "120, 150, 200",
                panel: "#7295c4",
                module: "#6b7788",
                planet: "#8a9bc4",
                planetShade: "#6b7ba4",
                ring: "rgba(90, 110, 150, 0.35)",
                moon: "#9aa6bd",
                moonShade: "#7b87a0",
                nebulaA: "138, 84, 255",
                nebulaB: "77, 159, 255",
            };
        }


        /* Mirror a pixel map horizontally (for
           sprites flying right-to-left) */

        function flipMap(map) {
            return map.map((row) => row.split("").reverse().join(""));
        }


        function drawSprite(map, x, y, colors) {

            const px = scaleSprites;

            /* Snap to the pixel grid so the sprite
               stays crisp pixel-art */

            x = Math.round(x / px) * px;
            y = Math.round(y / px) * px;

            for (let row = 0; row < map.length; row++) {

                for (let col = 0; col < map[row].length; col++) {

                    const code = map[row][col];

                    if (code === "." || !colors[code]) {
                        continue;
                    }

                    ctx.fillStyle = colors[code];

                    ctx.fillRect(x + col * px, y + row * px, px, px);
                }
            }
        }


        /* ---------- Stars ---------- */

        function buildStars() {

            stars = [];

            const count = Math.round(
                (width * height) / (canvas.starArea || 1600)
            );

            for (let i = 0; i < count; i++) {

                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() < 0.3 ? 2 : 1,
                    speed: 2 + Math.random() * 6,
                    phase: Math.random() * Math.PI * 2,
                });
            }
        }


        function drawStars(now) {

            const rgb = palette().star;

            stars.forEach((star) => {

                star.x -= star.speed / 60;

                if (star.x < -2) {
                    star.x = width + 2;
                    star.y = Math.random() * height;
                }

                const twinkle = 0.35 +
                    0.4 * (0.5 + 0.5 * Math.sin(now / 700 + star.phase));

                ctx.fillStyle = `rgba(${rgb}, ${twinkle.toFixed(3)})`;

                ctx.fillRect(
                    Math.round(star.x),
                    Math.round(star.y),
                    star.size,
                    star.size
                );
            });
        }


        /* ---------- Traffic ---------- */

        function spawnSprite(now) {

            const roll = Math.random();

            /* UFOs only "de vez en cuando" */

            const type =
                roll < 0.42 ? "comet" :
                roll < 0.75 ? "ship" :
                "ufo";

            const fromLeft = Math.random() < 0.5;

            const sprite = {
                type,
                fromLeft,
                seed: Math.random() * Math.PI * 2,
            };


            if (type === "comet") {

                sprite.x = fromLeft ? -80 : width + 80;
                sprite.y = Math.random() * height * 0.8;

                const speed = 280 + Math.random() * 180;
                const angle = (Math.random() * 24 - 12) * Math.PI / 180;

                sprite.vx = (fromLeft ? 1 : -1) * speed * Math.cos(angle);
                sprite.vy = speed * Math.sin(angle);

            } else {

                sprite.x = fromLeft ? -100 : width + 100;
                sprite.y = Math.random() * Math.max(1, height - 32);

                sprite.vx = (fromLeft ? 1 : -1) *
                    (type === "ufo"
                        ? 40 + Math.random() * 35
                        : 130 + Math.random() * 100);

                sprite.vy = 0;
            }


            sprites.push(sprite);
        }


        function drawComet(sprite, colors) {

            const px = scaleSprites;

            /* Head: 2x2 core */

            const x = Math.round(sprite.x / px) * px;
            const y = Math.round(sprite.y / px) * px;

            ctx.fillStyle = colors.cometHead;

            ctx.fillRect(x, y, px * 2, px * 2);

            /* Trail: squares fading behind the head */

            const dirX = Math.sign(sprite.vx) || 1;

            let tx = x - dirX * px * 2;
            let ty = y - (sprite.vy / (Math.abs(sprite.vx) || 1)) * px * 2;

            const alphas = [0.55, 0.4, 0.3, 0.2, 0.12, 0.07];

            alphas.forEach((alpha, i) => {

                const size = i < 2 ? 1.4 : 1;

                ctx.fillStyle = `rgba(${colors.cometTail}, ${alpha})`;

                ctx.fillRect(
                    Math.round(tx / px) * px,
                    Math.round(ty / px) * px,
                    size * px,
                    size * px
                );

                tx -= dirX * px * 1.6;
                ty -= (sprite.vy / (Math.abs(sprite.vx) || 1)) * px * 1.5;
            });
        }


        function drawUfo(sprite, colors, now) {

            const px = scaleSprites;
            const accent = cssVar("--color-nav-hover") || "#c1121f";

            const bob = Math.sin(now / 400 + sprite.seed) * 3;

            const map = sprite.fromLeft ? UFO_MAP : flipMap(UFO_MAP);

            /* Alternate the running lights along the rim */

            const litIndex = Math.floor(now / 250) % 2;

            const lights = UFO_MAP[4]
                .split("")
                .reduce((acc, code, col) => {

                    if (code === "L") {

                        /* Every other light along the rim.
                           The row is symmetric, so the columns
                           survive the horizontal flip. */

                        const index = (col - 1) / 2;

                        acc[col] = (index % 2 === litIndex)
                            ? accent
                            : colors.hullDark;
                    }

                    return acc;

                }, {});


            drawSprite(map, sprite.x, sprite.y + bob, {
                C: colors.dome,
                B: colors.hull,
                L: null, /* lights drawn below */
            });


            const x = Math.round(sprite.x / px) * px;
            const y = Math.round((sprite.y + bob) / px) * px;

            map.forEach((row, r) => {

                row.split("").forEach((code, col) => {

                    if (code !== "L") {
                        return;
                    }

                    ctx.fillStyle = lights[col] || accent;

                    ctx.fillRect(x + col * px, y + r * px, px, px);
                });
            });
        }


        function drawShip(sprite, colors) {

            const px = scaleSprites;
            const map = sprite.fromLeft ? ROCKET_MAP : flipMap(ROCKET_MAP);

            /* Flickering flame at the tail */

            const flameLen = 2 + Math.floor(Math.random() * 3);

            for (let i = 0; i < flameLen; i++) {

                ctx.fillStyle = i % 2 === 0 ? colors.flameA : colors.flameB;

                const fx = sprite.fromLeft
                    ? sprite.x - (flameLen - i) * px
                    : sprite.x + 11 * px + i * px;

                const fy = sprite.y + 3 * px;

                ctx.fillRect(
                    Math.round(fx / px) * px,
                    Math.round(fy / px) * px,
                    px,
                    px
                );
            }


            drawSprite(map, sprite.x, sprite.y, {
                F: colors.hull,
                W: colors.dome,
            });


            /* Dark belly shading (bottom two rows) */

            const x = Math.round(sprite.x / px) * px;
            const y = Math.round(sprite.y / px) * px;

            [4, 5].forEach((r) => {

                map[r].split("").forEach((code, col) => {

                    if (code !== "F") {
                        return;
                    }

                    ctx.fillStyle = colors.hullDark;

                    ctx.fillRect(x + col * px, y + r * px, px, px);
                });
            });
        }


        /* ---------- Deep-space backdrop (dark only) ---------- */

        /* Slow-breathing nebula blobs */

        function drawNebula(now) {

            const colors = palette();

            const pulse = 0.055 + 0.03 * (0.5 + 0.5 * Math.sin(now / 5200));

            const blobs = [
                { rgb: colors.nebulaA, x: 0.24, y: 0.32, r: 0.55, phase: 0 },
                { rgb: colors.nebulaB, x: 0.78, y: 0.72, r: 0.5, phase: 2.1 },
            ];

            blobs.forEach((blob) => {

                const radius = blob.r * Math.max(width, height) *
                    (0.92 + 0.08 * Math.sin(now / 6400 + blob.phase));

                const gradient = ctx.createRadialGradient(
                    blob.x * width, blob.y * height, 0,
                    blob.x * width, blob.y * height, radius
                );

                gradient.addColorStop(0, `rgba(${blob.rgb}, ${pulse})`);
                gradient.addColorStop(1, `rgba(${blob.rgb}, 0)`);

                ctx.fillStyle = gradient;

                ctx.fillRect(0, 0, width, height);
            });
        }


        /* Blocky pixel-art circle */

        function drawPixelCircle(cx, cy, r, px, fill, shade) {

            const steps = Math.ceil((r * 2) / px);

            for (let row = 0; row < steps; row++) {

                const yTop = cy - r + row * px;

                const dy = (yTop + px / 2 - cy) / r;

                const half = Math.sqrt(Math.max(0, 1 - dy * dy)) * r;

                if (half <= 0) {
                    continue;
                }

                const halfPx = Math.max(px, Math.round(half / px) * px);

                const x0 = Math.round((cx - halfPx) / px) * px;
                const y0 = Math.round(yTop / px) * px;

                ctx.fillStyle = fill;

                ctx.fillRect(x0, y0, halfPx * 2, px);

                /* Terminator shading on the right side */

                if (shade) {

                    ctx.fillStyle = shade;

                    ctx.fillRect(
                        x0 + halfPx * 2 - Math.max(px, halfPx * 0.7),
                        y0,
                        Math.max(px, halfPx * 0.55),
                        px
                    );
                }
            }
        }


        /* Ringed planet (Saturn style) with an orbiting
           pixel moon — very slow, background depth */

        function drawPlanets(now) {

            const colors = palette();

            const radius = Math.min(60, Math.max(26, width * 0.032));

            const px = Math.max(4, Math.round(radius / 8));

            const cx = width * 0.84;

            const cy = height * 0.2 + Math.sin(now / 5600) * 6;


            /* Ring (back half first, then the body,
               then the front half on top) */

            const drawRing = (fromAngle, toAngle) => {

                ctx.strokeStyle = colors.ring;

                ctx.lineWidth = Math.max(3, radius * 0.14);

                ctx.save();

                ctx.translate(cx, cy);

                ctx.rotate(-0.35);

                ctx.scale(1, 0.32);

                ctx.beginPath();

                ctx.arc(0, 0, radius * 1.55, fromAngle, toAngle);

                ctx.stroke();

                ctx.restore();
            };

            drawRing(Math.PI, Math.PI * 2);

            drawPixelCircle(cx, cy, radius, px, colors.planet, colors.planetShade);

            drawRing(Math.PI * 0.06, Math.PI * 0.94);


            /* Moon orbiting the planet on a tilted path */

            const orbitAngle = now / 14000;

            const mx = cx + Math.cos(orbitAngle) * radius * 2.6;

            const my = cy + Math.sin(orbitAngle) * radius * 0.75 +
                radius * 2.1;

            drawPixelCircle(
                mx, my,
                radius * 0.28,
                px,
                colors.moon,
                colors.moonShade
            );
        }


        /* ---------- Meteors & ISS ---------- */

        function spawnMeteorShower() {

            const count = 3 + Math.floor(Math.random() * 3);

            for (let i = 0; i < count; i++) {

                const dir = Math.random() < 0.5 ? 1 : -1;

                sprites.push({
                    type: "meteor",
                    seed: 0,
                    x: Math.random() * width,
                    y: Math.random() * height * 0.3,
                    vx: dir * (280 + Math.random() * 180),
                    vy: 240 + Math.random() * 200,
                });
            }
        }


        function spawnIss() {

            const fromLeft = Math.random() < 0.5;

            sprites.push({
                type: "iss",
                fromLeft,
                seed: 0,
                x: fromLeft ? -120 : width + 120,
                y: height * (0.12 + Math.random() * 0.45),
                vx: (fromLeft ? 1 : -1) * (16 + Math.random() * 12),
                vy: 0,
            });
        }


        function drawIss(sprite, colors) {

            const map = sprite.fromLeft ? ISS_MAP : flipMap(ISS_MAP);

            const bob = Math.sin(sprite.x / 90 + sprite.seed) * 2;

            drawSprite(map, sprite.x, sprite.y + bob, {
                P: colors.panel,
                M: colors.module,
            });
        }

        function resize() {

            const dpr = window.devicePixelRatio || 1;

            width = canvas.clientWidth;
            height = canvas.clientHeight;

            if (width === 0 || height === 0) {
                return;
            }

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);

            canvas.style.width = width + "px";
            canvas.style.height = height + "px";

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            buildStars();
        }


        /* ---------- Loop ---------- */

        function loop(now) {

            if (!document.hidden && width > 0) {

                ctx.clearRect(0, 0, width, height);

                /* Deep-space backdrop, dark theme only */

                const dark = traffic &&
                    document.documentElement.getAttribute("data-theme") === "dark";

                if (dark) {

                    drawNebula(now);

                    drawPlanets(now);
                }


                drawStars(now);


                if (traffic) {

                    if (!dark) {

                        /* Nothing flies in the light theme */

                        sprites = [];

                        window.SPACE_HITBOXES = [];

                        nextSpawnAt = now + SPAWN_MIN_MS;

                        nextMeteorAt = now + 8000;

                        nextIssAt = now + 20000;

                    } else {

                        if (now >= nextSpawnAt) {

                            spawnSprite(now);

                            nextSpawnAt = now +
                                SPAWN_MIN_MS +
                                Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS);
                        }

                        if (now >= nextMeteorAt) {

                            spawnMeteorShower();

                            nextMeteorAt = now + 9000 + Math.random() * 8000;
                        }

                        if (now >= nextIssAt) {

                            spawnIss();

                            nextIssAt = now + 22000 + Math.random() * 16000;
                        }
                    }


                    sprites = sprites.filter((sprite) => {

                        sprite.x += sprite.vx / 60;
                        sprite.y += sprite.vy / 60;

                        const margin = 160;

                        return sprite.x > -margin &&
                            sprite.x < width + margin &&
                            sprite.y < height + margin;
                    });

                    if (sprites.length > 0) {

                        const colors = palette();

                        /* Publish live hitboxes so the snake
                           can die crashing into traffic */

                        window.SPACE_HITBOXES = sprites.map((sprite) => {

                            const px = scaleSprites;

                            let bx = sprite.x;

                            let dims = [0, 0];

                            if (sprite.type === "comet" ||
                                sprite.type === "meteor") {

                                dims = [2, 2];

                            } else if (sprite.type === "ufo") {

                                dims = [13, 7];

                            } else if (sprite.type === "iss") {

                                dims = [11, 5];

                            } else if (sprite.type === "ship") {

                                /* The flame trails behind the rocket */

                                if (sprite.fromLeft) {
                                    bx -= 3 * px;
                                }

                                dims = [14, 7];
                            }

                            return {
                                x: bx,
                                y: sprite.y,
                                w: dims[0] * px,
                                h: dims[1] * px,
                            };
                        });


                        sprites.forEach((sprite) => {

                            if (sprite.type === "comet") {
                                drawComet(sprite, colors);
                            } else if (sprite.type === "meteor") {

                                /* Meteors reuse the comet streaks
                                   but in pure white */

                                drawComet(sprite, {
                                    cometHead: colors.meteorHead,
                                    cometTail: colors.meteorTail,
                                });

                            } else if (sprite.type === "ufo") {
                                drawUfo(sprite, colors, now);
                            } else if (sprite.type === "iss") {
                                drawIss(sprite, colors);
                            } else {
                                drawShip(sprite, colors);
                            }
                        });
                    }
                }
            }

            requestAnimationFrame(loop);
        }


        resize();

        if (traffic) {

            nextSpawnAt = FIRST_SPAWN_MS;

            /* First meteor shower and station flyby */

            nextMeteorAt = 6000;

            nextIssAt = 5000;
        }

        requestAnimationFrame(loop);

        window.addEventListener("resize", resize);

        if ("ResizeObserver" in window && canvas.resizesWith) {
            new ResizeObserver(resize).observe(canvas.resizesWith);
        }
    }


    /* ---------- Menu scene: stars only ---------- */

    if (menu) {

        const menuCanvas = document.createElement("canvas");

        menuCanvas.className = "menu__space";
        menuCanvas.setAttribute("aria-hidden", "true");
        menuCanvas.starArea = 1600;
        menuCanvas.resizesWith = menu;

        menu.prepend(menuCanvas);

        createScene(menuCanvas);
    }


    /* ---------- Full viewport scene: stars + traffic ---------- */

    const spaceCanvas = document.createElement("canvas");

    spaceCanvas.className = "space-scene";
    spaceCanvas.setAttribute("aria-hidden", "true");
    spaceCanvas.starArea = 9000;
    spaceCanvas.traffic = true;

    /* Slightly chunkier pixels on big screens */

    spaceCanvas.spaceScale = window.innerWidth >= 1400 ? 4 : 3;

    document.body.prepend(spaceCanvas);

    createScene(spaceCanvas);

})();