/* ==================================================
   CPU SNAKE
   Decorative snake playing itself in the empty
   side gutters of the page.

   Rules:
   - Page content (.contenido, menu, footer...) is
     the only WALL. Colliding with it = death.
   - Screen edges are PORTALS: leaving one side
     wraps around to the opposite side.
================================================== */

"use strict";

(function () {


    /* No animation for users who prefer reduced motion */

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }


    const canvas = document.getElementById("snake-canvas");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");


    /* ---------- Config ---------- */

    const CELL = 14;          /* Grid cell size in CSS px */
    const STEP_MS = 180;      /* Movement speed (higher = slower) */
    const MAX_LENGTH = 30;    /* Keeps it gutter-sized */
    const DEATH_MS = 1600;    /* Death explosion duration */

    /* Elements the snake must treat as walls */

    const WALL_SELECTOR = ".contenido, .menu, .footer, .redes__link--github";

    const WALL_MARGIN = 6;    /* Extra px around each wall rect */


    /* Pixel-art snake, 7x7 pixels per segment.
       B = body, D = dark body, P = pupil, T = tongue, . = transparent */

    /* ---------- BODY (two variants, alternating scales) ---------- */

    const BODY_MAP_A = [
        ".BBBBB.",
        "BBBBBBB",
        "BBDDBBB",
        "BDDDDBB",
        "BBDDBBB",
        "BBBBBBB",
        ".BBBBB.",
    ];

    const BODY_MAP_B = [
        ".BBBBB.",
        "BBBBBBB",
        "BBBDDBB",
        "BBBDDBB",
        "BBBDDBB",
        "BBBBBBB",
        ".BBBBB.",
    ];


    /* ---------- HEAD (facing RIGHT; rotated for other dirs) ----------
       Space helmet edition: H = helmet shine (bright arc),
       G = glass dome (translucent), W = glint + teeth,
       P = pupil, T = tongue. */

    const HEAD_MAP = [
        ".HHHHH.",
        "HGWBBBG",
        "HGBBPPG",
        "HBBBBBG",
        "HGBBPPG",
        "HGBBBBG",
        ".GGGGG.",
    ];


    /* ---------- HEAD WITH OPEN MOUTH (chomp!) ----------
       Wide open jaws with white teeth (W), a dark mouth
       interior (M) and the tongue (T) poking out. Drawn
       slightly bigger than the closed head for drama. */

    const OPEN_HEAD_MAP = [
        ".HHHHH.",
        "HBBBBWG",
        "HBBBBMG",
        "HBBBMMT",
        "HBBBBMG",
        "HBBBBWG",
        ".GGGGG.",
    ];


    /* ---------- PLAIN HEADS (light theme) ----------
       No space helmet: just the snake head with its
       pupils and eye glint. */

    const PLAIN_HEAD_MAP = [
        ".BBBBB.",
        "BWBBBBB",
        "BBBBPPB",
        "BBBBBBB",
        "BBBBPPB",
        "BBBBBBB",
        ".BBBBB.",
    ];

    const PLAIN_OPEN_HEAD_MAP = [
        ".BBBBB.",
        "BBBBBWB",
        "BBBBBMB",
        "BBBBMMT",
        "BBBBBMB",
        "BBBBBWB",
        ".BBBBB.",
    ];


    /* Steps the mouth stays open right after eating */

    const MOUTH_STEPS_AFTER_EAT = 3;


    /* Pixel-art apple, 7x7 pixels.
       B = body, H = highlight, L = leaf, S = stem, . = transparent */

    const APPLE_MAP = [
        "..L....",
        ".RRRRR.",
        "RRHRRRR",
        "RRHRRRR",
        "RRRRRRR",
        ".RRRRR.",
        "..RRR..",
    ];


    /* Red apple for the light theme, green for dark */

    const APPLE_COLORS = {
        light: { R: "#e03131", H: "#ffa8a8", L: "#2f9e44", S: "#8a5a2b" },
        dark:  { R: "#2ecc71", H: "#a8f5c4", L: "#1e8a3c", S: "#8a5a2b" },
    };


    /* ---------- State ---------- */

    let cols = 0;
    let rows = 0;
    let walls = null;         /* Uint8Array, 1 = wall cell */
    let snake = [];           /* Head first: {x, y} */
    let dir = { x: 1, y: 0 };
    let food = null;
    let alive = true;
    let deathAt = 0;
    let lastStep = 0;
    let mouthSteps = 0;
    let enabled = false;
    let particles = [];       /* Death explosion debris */
    let fxCenter = null;      /* Where the snake exploded */


    /* ---------- Helpers ---------- */

    function cssVar(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
    }


    /* Darker version of a #rrggbb color */

    function shadeHex(hex, factor) {

        const raw = hex.replace("#", "");

        if (raw.length !== 6) {
            return hex;
        }

        const num = parseInt(raw, 16);

        const r = Math.round(((num >> 16) & 255) * factor);
        const g = Math.round(((num >> 8) & 255) * factor);
        const b = Math.round((num & 255) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }


    /* Rotate a pixel map 90° clockwise, `times` times */

    function rotateMap(map, times) {

        let out = map;

        for (let t = 0; t < times; t++) {

            const size = out.length;

            out = out.map((row, r) =>
                row
                    .split("")
                    .map((_, c) => out[size - 1 - c][r])
                    .join("")
            );
        }

        return out;
    }


    /* Direction -> number of clockwise rotations of the head */

    function headRotations() {

        if (dir.x === 0 && dir.y === 1) {
            return 1; /* down */
        }

        if (dir.x === -1 && dir.y === 0) {
            return 2; /* left */
        }

        if (dir.x === 0 && dir.y === -1) {
            return 3; /* up */
        }

        return 0; /* right */
    }


    function resize() {

        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);

        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cols = Math.ceil(window.innerWidth / CELL);
        rows = Math.ceil(window.innerHeight / CELL);
    }


    /* Recompute wall cells from the live DOM rects */

    function buildWalls() {

        walls = new Uint8Array(cols * rows);

        document.querySelectorAll(WALL_SELECTOR).forEach((el) => {

            const r = el.getBoundingClientRect();

            if (r.bottom < 0 || r.top > window.innerHeight) {
                return; /* Off screen */
            }

            const x0 = Math.max(0, Math.floor((r.left - WALL_MARGIN) / CELL));
            const x1 = Math.min(cols - 1, Math.ceil((r.right + WALL_MARGIN) / CELL));
            const y0 = Math.max(0, Math.floor((r.top - WALL_MARGIN) / CELL));
            const y1 = Math.min(rows - 1, Math.ceil((r.bottom + WALL_MARGIN) / CELL));

            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    walls[y * cols + x] = 1;
                }
            }
        });
    }


    /* Both axes wrap: screen edges are portals */

    function wrap(x, y) {
        return {
            x: (x + cols) % cols,
            y: (y + rows) % rows,
        };
    }


    function isWall(x, y) {
        return walls[y * cols + x] === 1;
    }


    function isFree(x, y) {
        return !isWall(x, y) && !snake.some((p) => p.x === x && p.y === y);
    }


    /* ---------- Space traffic collisions ----------
       The traffic scene (space.js) publishes the
       live bounding boxes of comets, rockets, UFOs
       and the space station. Crashing into one of
       them kills the snake too. */

    function hitsTraffic(x, y) {

        const boxes = window.SPACE_HITBOXES;

        if (!boxes || boxes.length === 0) {
            return false;
        }

        const hx = x * CELL;

        const hy = y * CELL;

        return boxes.some((box) =>
            hx < box.x + box.w &&
            hx + CELL > box.x &&
            hy < box.y + box.h &&
            hy + CELL > box.y
        );
    }


    function neighbors(x, y) {

        return [
            wrap(x + 1, y),
            wrap(x - 1, y),
            wrap(x, y + 1),
            wrap(x, y - 1),
        ];
    }


    /* Shortest wrapped manhattan distance */

    function distance(a, b) {

        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);

        return Math.min(dx, cols - dx) + Math.min(dy, rows - dy);
    }


    /* Flood fill: how many free cells are reachable from start
       without crossing walls or the snake body */

    function reachableArea(start) {

        const body = new Set(snake.map((p) => p.y * cols + p.x));
        const seen = new Set();
        const queue = [start.y * cols + start.x];

        seen.add(queue[0]);

        let count = 0;

        while (queue.length > 0) {

            const index = queue.pop();
            const x = index % cols;
            const y = Math.floor(index / cols);

            count++;

            neighbors(x, y).forEach((n) => {

                const key = n.y * cols + n.x;

                if (isWall(n.x, n.y) || body.has(key) || seen.has(key)) {
                    return;
                }

                seen.add(key);
                queue.push(key);
            });
        }

        return count;
    }


    /* ---------- Spawning ---------- */

    function randomFreeCell(minFreeArea) {

        for (let tries = 0; tries < 200; tries++) {

            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);

            if (isWall(x, y) || snake.some((p) => p.x === x && p.y === y)) {
                continue;
            }

            /* Needs some room to live (avoids pockets) */

            if (reachableArea({ x, y }) < minFreeArea) {
                continue;
            }

            return { x, y };
        }

        return null;
    }


    function spawnFood() {
        food = randomFreeCell(15);
    }


    function spawnSnake() {

        snake = [];
        alive = true;
        mouthSteps = 0;

        const start = randomFreeCell(25);

        if (!start) {
            enabled = false; /* No room to play */
            return;
        }

        snake.push(start);

        /* Grow towards a direction with free space */

        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {

            const next = wrap(start.x + dx, start.y + dy);

            if (isFree(next.x, next.y)) {

                snake.push(next);
                dir = { x: dx, y: dy };
                break;
            }
        }

        spawnFood();
    }


    /* ---------- Brain ---------- */

    function chooseDirection() {

        const head = snake[0];

        const options = neighbors(head.x, head.y)
            .filter((n) => isFree(n.x, n.y));

        if (options.length === 0) {
            return null; /* Trapped: dies this step */
        }


        /* Prefer safe moves: flood fill must leave room for the body */

        const minArea = Math.max(10, snake.length);

        const safe = options.filter(
            (n) => reachableArea(n) >= minArea
        );

        const pool = safe.length > 0 ? safe : options;


        /* Chase the food, small randomness to keep it organic */

        pool.sort(
            (a, b) => distance(a, food) - distance(b, food)
        );

        return (Math.random() < 0.08 && pool.length > 1)
            ? pool[1]
            : pool[0];
    }


    /* ---------- Simulation ---------- */

    function step() {

        buildWalls();

        if (!food || isWall(food.x, food.y)) {
            spawnFood();
        }

        const next = chooseDirection();

        if (!next) {
            die();
            return;
        }

        snake.unshift(next);

        const ate =
            next.x === food.x && next.y === food.y;

        if (ate) {

            spawnFood();

            /* Chomp! Mouth stays open for a few steps */

            mouthSteps = MOUTH_STEPS_AFTER_EAT;

        } else if (mouthSteps > 0) {

            mouthSteps--;
        }


        /* Growing = keep the tail this step.
           Once at MAX_LENGTH, growth stops (tail moves normally). */

        if (!ate || snake.length > MAX_LENGTH) {
            snake.pop();
        }


        /* Wall collision (e.g. the user scrolled) = death */

        if (isWall(snake[0].x, snake[0].y)) {
            die();
            return;
        }


        /* Crashing into passing space traffic = death */

        if (hitsTraffic(snake[0].x, snake[0].y)) {
            die();
        }
    }


    function die() {

        alive = false;
        deathAt = performance.now();

        fxCenter = {
            x: snake[0].x * CELL + CELL / 2,
            y: snake[0].y * CELL + CELL / 2,
        };

        explode();
    }


    /* ---------- Death explosion ----------
       The body bursts into pixel debris with
       white sparks flying everywhere. */

    function explode() {

        particles = [];

        const accent = cssVar("--color-nav-hover") || "#c1121f";

        const colors = [accent, "#ffffff", "#ffd166", accent];

        snake.forEach((segment, i) => {

            const pieces = i === 0 ? 8 : 3;

            for (let k = 0; k < pieces; k++) {

                particles.push({
                    x: segment.x * CELL + CELL / 2,
                    y: segment.y * CELL + CELL / 2,
                    vx: (Math.random() * 2 - 1) * 150,
                    vy: (Math.random() * 2 - 1) * 150 - 40,
                    size: 2 + Math.random() * 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
            }
        });


        /* Fast white sparks bursting from the head */

        for (let k = 0; k < 14; k++) {

            particles.push({
                x: fxCenter.x,
                y: fxCenter.y,
                vx: (Math.random() * 2 - 1) * 300,
                vy: (Math.random() * 2 - 1) * 300 - 60,
                size: 2,
                color: "#ffffff",
            });
        }
    }


    function drawParticles(now) {

        const elapsed = (now - deathAt) / 1000;

        const alpha = Math.max(0, 1 - (now - deathAt) / DEATH_MS);

        if (alpha <= 0) {
            return;
        }

        particles.forEach((p) => {

            /* Slight gravity for a spacey arc */

            const x = p.x + p.vx * elapsed;

            const y = p.y + p.vy * elapsed +
                0.5 * 260 * elapsed * elapsed;

            ctx.globalAlpha = alpha;

            ctx.fillStyle = p.color;

            ctx.fillRect(Math.round(x), Math.round(y), p.size, p.size);

            ctx.globalAlpha = 1;
        });
    }


    /* ---------- Rendering ---------- */

    function drawPixelMap(map, cellX, cellY, palette, scale = 1) {

        const size = CELL * scale;

        const pixel = size / map.length;

        /* Center the (possibly scaled) map on the cell */

        const offset = (size - CELL) / 2;

        for (let row = 0; row < map.length; row++) {

            for (let col = 0; col < map[row].length; col++) {

                const code = map[row][col];

                if (code === ".") {
                    continue;
                }

                ctx.fillStyle = palette[code];

                ctx.fillRect(
                    cellX * CELL - offset + col * pixel,
                    cellY * CELL - offset + row * pixel,
                    Math.ceil(pixel),
                    Math.ceil(pixel)
                );
            }
        }
    }


    function drawApple() {

        const center = {
            x: food.x * CELL + CELL / 2,
            y: food.y * CELL + CELL / 2,
        };

        const bubbleRadius = CELL * 0.75;


        /* Space bubble around the apple */

        ctx.fillStyle = "rgba(160, 210, 255, 0.12)";

        ctx.beginPath();
        ctx.arc(center.x, center.y, bubbleRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(190, 230, 255, 0.55)";

        ctx.lineWidth = 1;

        ctx.stroke();

        const isDark =
            document.documentElement.getAttribute("data-theme") === "dark";

        const palette = isDark ? APPLE_COLORS.dark : APPLE_COLORS.light;

        const pixel = CELL / APPLE_MAP.length;

        const baseX = food.x * CELL;
        const baseY = food.y * CELL;


        for (let row = 0; row < APPLE_MAP.length; row++) {

            for (let col = 0; col < APPLE_MAP[row].length; col++) {

                const code = APPLE_MAP[row][col];

                if (code === ".") {
                    continue;
                }

                ctx.fillStyle = palette[code];

                ctx.fillRect(
                    baseX + col * pixel,
                    baseY + row * pixel,
                    Math.ceil(pixel),
                    Math.ceil(pixel)
                );
            }
        }


        /* Glint on the bubble */

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";

        ctx.fillRect(
            center.x - bubbleRadius * 0.55,
            center.y - bubbleRadius * 0.55,
            2,
            2
        );
    }


    function draw(now) {

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        if (!enabled) {
            return;
        }


        /* Screen shake during the first instants
           of the death explosion */

        const shaking =
            !alive && now - deathAt < 400;

        if (shaking) {

            const strength = 4 * (1 - (now - deathAt) / 400);

            ctx.save();

            ctx.translate(
                (Math.random() * 2 - 1) * strength,
                (Math.random() * 2 - 1) * strength
            );
        }


        const accent = cssVar("--color-nav-hover") || "#c1121f";

        const bodyColor = alive ? accent : "#ff4d4d";
        const bodyDark = alive ? shadeHex(accent, 0.65) : "#b32626";

        const bodyPalette = { B: bodyColor, D: bodyDark };

        const headPalette = {
            B: bodyColor,
            G: "rgba(252, 61, 33, 0.85)",   /* NASA-red helmet shell */
            H: "rgba(255, 236, 230, 0.95)", /* Helmet shine */
            P: "#12161c",
            M: "#12161c",
            T: "#e03131",
            W: "#f5f5f5",
        };


        /* Body & head only while alive: on death the
           corpse scatters instead */

        if (alive) {

        /* Body: alternating scales, skip cells that are walls */

        for (let i = snake.length - 1; i >= 1; i--) {

            const p = snake[i];

            if (isWall(p.x, p.y)) {
                continue;
            }

            const map = i % 2 === 0 ? BODY_MAP_A : BODY_MAP_B;

            drawPixelMap(map, p.x, p.y, bodyPalette);
        }


        /* Head: rotated towards the current direction.
           Opens its mouth while eating or about to eat. */

        const head = snake[0];

        if (!isWall(head.x, head.y)) {

            const aboutToEat =
                food && distance(head, food) === 1;

            const mouthOpen =
                alive && (mouthSteps > 0 || aboutToEat);

            const isDark =
                document.documentElement.getAttribute("data-theme") === "dark";

            /* Helmet only in the dark (space) theme */

            const baseMap = mouthOpen
                ? (isDark ? OPEN_HEAD_MAP : PLAIN_OPEN_HEAD_MAP)
                : (isDark ? HEAD_MAP : PLAIN_HEAD_MAP);

            const headMap = rotateMap(baseMap, headRotations());


            /* Soft space-glow behind the helmet so the
               head pops from the page (dark theme only) */

            const glowColor = isDark
                ? "rgba(252, 61, 33, 0.22)"
                : "rgba(200, 60, 40, 0.16)";

            const glow = ctx.createRadialGradient(
                head.x * CELL + CELL / 2,
                head.y * CELL + CELL / 2,
                CELL * 0.3,
                head.x * CELL + CELL / 2,
                head.y * CELL + CELL / 2,
                CELL * 2.4
            );

            glow.addColorStop(0, glowColor);
            glow.addColorStop(1, "rgba(252, 61, 33, 0)");

            ctx.fillStyle = glow;

            ctx.fillRect(
                head.x * CELL - CELL * 2.4,
                head.y * CELL - CELL * 2.4,
                CELL * 6.8,
                CELL * 6.8
            );


            /* Head is drawn slightly bigger so the
               helmet dome reads clearly; the open
               mouth bigger still: the chomp must show */

            drawPixelMap(
                headMap,
                head.x,
                head.y,
                headPalette,
                mouthOpen ? 1.5 : 1.2
            );


            /* Helmet antenna with a blinking beacon
               (dark space theme only) */

            if (isDark) {

                const px = CELL / HEAD_MAP.length;

                const cx = head.x * CELL + CELL / 2;

                const top = head.y * CELL - CELL * 0.1;

                ctx.fillStyle = "rgba(200, 230, 255, 0.9)";

                ctx.fillRect(cx - px * 0.5, top - px * 2.4, px, px * 2.4);

                const blink = Math.floor(now / 300) % 2 === 0;

                ctx.fillStyle = blink
                    ? "#fc3d21"
                    : "rgba(252, 61, 33, 0.3)";

                ctx.fillRect(cx - px, top - px * 3.6, px * 1.6, px * 1.6);
            }
        }

        }


        /* Food: pixel-art apple (green in dark, red in light) */

        if (food && !isWall(food.x, food.y)) {
            drawApple();
        }


        /* Death explosion FX */

        if (!alive) {
            drawDeathFx(now);
        }

        if (shaking) {
            ctx.restore();
        }
    }


    /* ---------- Death FX ----------
       The body scatters into chunks, plus
       shockwave rings, debris and an arcade
       GAME OVER sign. No screen flash. */

    function drawDeathFx(now) {

        const elapsed = now - deathAt;

        if (elapsed >= DEATH_MS) {
            return;
        }


        /* Shockwave rings */

        const t = elapsed / DEATH_MS;

        const ease = 1 - Math.pow(1 - t, 3);

        const radius = CELL * 6.5 * ease;

        ctx.globalAlpha = 1 - t;

        ctx.strokeStyle = "rgba(252, 61, 33, 0.9)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(fxCenter.x, fxCenter.y, radius, 0, Math.PI * 2);

        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(fxCenter.x, fxCenter.y, radius * 0.7, 0, Math.PI * 2);

        ctx.stroke();

        ctx.globalAlpha = 1;


        /* The corpse scatters: every segment becomes
           a chunk drifting away from the blast */

        const bodyPalette = {
            B: "#ff4d4d",
            D: "#b32626",
        };

        const alpha = 1 - t;

        const elapsedSec = elapsed / 1000;

        const gravity = 0.5 * 220 * elapsedSec * elapsedSec;

        snake.forEach((segment, i) => {

            const cx = segment.x * CELL + CELL / 2;

            const cy = segment.y * CELL + CELL / 2;

            let dx = cx - fxCenter.x;

            let dy = cy - fxCenter.y;

            let dist = Math.hypot(dx, dy);

            if (dist < 1) {

                /* Chunks sitting on the blast point
                   fly up instead */

                dx = 0;

                dy = -1;

                dist = 1;
            }

            const spread = ease * CELL * 4;

            ctx.globalAlpha = alpha;

            drawPixelMap(
                i % 2 === 0 ? BODY_MAP_A : BODY_MAP_B,
                (cx + (dx / dist) * spread) / CELL,
                (cy + (dy / dist) * spread + gravity) / CELL,
                bodyPalette
            );
        });

        ctx.globalAlpha = 1;


        /* Pixel debris + sparks */

        drawParticles(now);


        /* Arcade GAME OVER sign, rising and fading */

        if (elapsed > 250) {

            const textAlpha =
                Math.min(1, (elapsed - 250) / 200) * (1 - t * 0.6);

            ctx.globalAlpha = textAlpha;

            ctx.font = "700 22px Quantico, monospace";

            ctx.textAlign = "center";

            const ty = fxCenter.y - CELL * 4 - ease * 18;

            ctx.fillStyle = "#12161c";

            ctx.fillText("GAME OVER", fxCenter.x + 2, ty + 2);

            ctx.fillStyle = "#ff4d4d";

            ctx.fillText("GAME OVER", fxCenter.x, ty);

            ctx.globalAlpha = 1;
        }
    }


    /* ---------- Loop ---------- */

    function loop(now) {

        if (!document.hidden) {

            if (alive) {

                if (now - lastStep >= STEP_MS) {
                    lastStep = now;
                    step();
                }

            } else if (now - deathAt >= DEATH_MS) {
                spawnSnake();
            }

            draw(now);
        }

        requestAnimationFrame(loop);
    }


    /* ---------- Start (desktop only: needs side gutters) ---------- */

    function startIfRoomy() {

        enabled = window.innerWidth >= 1024;

        if (enabled && snake.length === 0) {
            resize();
            buildWalls();
            spawnSnake();
        }
    }


    resize();
    startIfRoomy();

    if (enabled) {
        requestAnimationFrame(loop);
    }


    window.addEventListener("resize", () => {

        const wasEnabled = enabled;

        resize();
        startIfRoomy();

        if (enabled && !wasEnabled) {
            requestAnimationFrame(loop);
        }
    });

})();