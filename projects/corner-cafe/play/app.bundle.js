(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // play/domain.mjs
  function createOrder(draft2, orders2, now = Date.now()) {
    const firstName = String(draft2.firstName || "").trim();
    const lastName = String(draft2.lastName || "").trim();
    if (!firstName || !lastName || firstName.length > 40 || lastName.length > 40) {
      throw new Error("Please enter a first and last name, up to 40 characters each.");
    }
    if (!["hot", "cold"].includes(draft2.temperature)) throw new Error("Choose hot or cold.");
    if (!Object.hasOwn(DRINK_RECIPES, draft2.drink)) throw new Error("Choose a drink.");
    const americano = draft2.drink === "Americano";
    if (!americano && !MILKS.some((milk) => milk.id === draft2.milk)) throw new Error("Choose a milk.");
    if (!americano && !SYRUPS.some((syrup) => syrup.id === draft2.syrup)) throw new Error("Choose a syrup.");
    if (!americano && (!Number.isInteger(draft2.pumps) || draft2.pumps < 0 || draft2.pumps > MAX_SYRUP_PUMPS)) {
      throw new Error(`Choose between 0 and ${MAX_SYRUP_PUMPS} syrup pumps.`);
    }
    return {
      id: crypto.randomUUID(),
      number: Math.max(100, ...orders2.map((order) => order.number)) + 1,
      firstName,
      lastName,
      temperature: draft2.temperature,
      drink: draft2.drink,
      shots: DRINK_RECIPES[draft2.drink].shots,
      syrup: americano || draft2.pumps === 0 ? "none" : draft2.syrup,
      pumps: americano || draft2.syrup === "none" ? 0 : draft2.pumps,
      milk: americano ? null : draft2.milk,
      milkDone: americano,
      status: "preparing",
      createdAt: now,
      readyAt: null
    };
  }
  function milkQueue(orders2, filter2) {
    return orders2.filter((order) => order.status !== "ready" && !order.milkDone && order.milk && (filter2 === "both" || MILKS.find((milk) => milk.id === order.milk)?.group === filter2));
  }
  function finishMilk(orders2, ids) {
    return orders2.map((order) => ids.includes(order.id) && order.status !== "ready" && order.milk ? { ...order, milkDone: true } : order);
  }
  function markReady(orders2, ids, now = Date.now()) {
    return orders2.map((order) => ids.includes(order.id) && order.status !== "ready" ? { ...order, status: "ready", readyAt: now } : order);
  }
  function isOrder(value) {
    return value && typeof value.id === "string" && Number.isInteger(value.number) && typeof value.firstName === "string" && typeof value.lastName === "string" && ["hot", "cold"].includes(value.temperature) && Object.hasOwn(DRINK_RECIPES, value.drink) && (value.shots === void 0 || value.shots === DRINK_RECIPES[value.drink].shots) && ["preparing", "ready"].includes(value.status) && typeof value.milkDone === "boolean" && (value.milk === null || MILKS.some((milk) => milk.id === value.milk)) && SYRUPS.some((syrup) => syrup.id === value.syrup) && Number.isInteger(value.pumps) && value.pumps >= 0 && value.pumps <= MAX_SYRUP_PUMPS && Number.isFinite(value.createdAt) && (value.readyAt === null || Number.isFinite(value.readyAt));
  }
  function seedOrders() {
    const orders2 = [];
    const samples = [
      ["Emma", "Lee", "hot", "Latte", "vanilla", 2, "oat"],
      ["Noah", "Kim", "cold", "Mocha", "caramel", 1, "dairy"],
      ["Olivia", "Park", "hot", "Latte", "lavender", 2, "soy"],
      ["Liam", "Chen", "hot", "Americano", "none", 0, null]
    ];
    for (const [firstName, lastName, temperature, drink, syrup, pumps, milk] of samples) {
      orders2.push(createOrder({ firstName, lastName, temperature, drink, syrup, pumps, milk }, orders2));
    }
    return orders2;
  }
  var DRINK_RECIPES, DRINK_SHOTS, MAX_SYRUP_PUMPS, SYRUPS, MILKS;
  var init_domain = __esm({
    "play/domain.mjs"() {
      DRINK_RECIPES = Object.freeze({
        Americano: { shots: 2, chocolatePumps: 0, finish: "water" },
        Latte: { shots: 1, chocolatePumps: 0, finish: "milk" },
        Mocha: { shots: 1, chocolatePumps: 1, finish: "milk" }
      });
      DRINK_SHOTS = Object.freeze(Object.fromEntries(Object.entries(DRINK_RECIPES).map(([name, recipe]) => [name, recipe.shots])));
      MAX_SYRUP_PUMPS = 6;
      SYRUPS = [
        { id: "vanilla", name: "Vanilla", color: "#d5a257" },
        { id: "caramel", name: "Caramel", color: "#b96b34" },
        { id: "hazelnut", name: "Hazelnut", color: "#996748" },
        { id: "lavender", name: "Lavender", color: "#aa89c2" },
        { id: "none", name: "No syrup", color: "#e5ded7" }
      ];
      MILKS = [
        { id: "dairy", name: "2% milk", short: "2% milk", icon: "milk", group: "dairy", color: "#fff6e7", note: "Classic & creamy" },
        { id: "oat", name: "Oat milk", short: "Oat", icon: "oat", group: "non-dairy", color: "#ecd6ad", note: "Smooth & plant-based" },
        { id: "soy", name: "Soy milk", short: "Soy", icon: "soy", group: "non-dairy", color: "#f0e7c4", note: "Light & plant-based" }
      ];
    }
  });

  // play/art.js
  var ESPRESSO_STICKERS, TEMPERATURE_STICKERS, SYRUP_PUMP_PHOTO, SYRUP_GLASS, MILK_STUDIO;
  var init_art = __esm({
    "play/art.js"() {
      ESPRESSO_STICKERS = {
        shot: "./assets/espresso-shot.webp",
        pump: "./assets/chocolate-pump.webp"
      };
      TEMPERATURE_STICKERS = {
        hot: {
          src: "./assets/hot-drink.webp",
          alt: "A hot latte with tulip-shaped latte art in a kraft paper cup."
        },
        cold: {
          src: "./assets/iced-drink.webp",
          alt: "An iced latte with swirls of milk in a horizontally ribbed glass."
        }
      };
      SYRUP_PUMP_PHOTO = {
        head: "./assets/syrup-pump-head.webp",
        body: "./assets/syrup-bottle.webp"
      };
      SYRUP_GLASS = {
        "hot": {
          "rings": [
            [
              253.751,
              38.967
            ],
            [
              252.514,
              39.128
            ],
            [
              251.278,
              39.288
            ],
            [
              250.041,
              39.447
            ],
            [
              248.805,
              39.606
            ],
            [
              247.568,
              39.763
            ],
            [
              246.332,
              39.919
            ],
            [
              245.095,
              40.074
            ],
            [
              243.859,
              40.228
            ],
            [
              242.622,
              40.38
            ],
            [
              241.386,
              40.531
            ],
            [
              240.149,
              40.68
            ],
            [
              238.913,
              40.827
            ],
            [
              237.677,
              40.973
            ],
            [
              236.44,
              41.117
            ],
            [
              235.204,
              41.259
            ],
            [
              233.967,
              41.399
            ],
            [
              232.731,
              41.537
            ],
            [
              231.494,
              41.672
            ],
            [
              230.258,
              41.806
            ],
            [
              229.021,
              41.937
            ],
            [
              227.785,
              42.066
            ],
            [
              226.548,
              42.192
            ],
            [
              225.312,
              42.316
            ],
            [
              224.075,
              42.438
            ],
            [
              222.839,
              42.557
            ],
            [
              221.602,
              42.673
            ],
            [
              220.366,
              42.787
            ],
            [
              219.129,
              42.898
            ],
            [
              217.893,
              43.006
            ],
            [
              216.656,
              43.111
            ],
            [
              215.42,
              43.214
            ],
            [
              214.183,
              43.314
            ],
            [
              212.947,
              43.411
            ],
            [
              211.711,
              43.505
            ],
            [
              210.474,
              43.596
            ],
            [
              209.238,
              43.685
            ],
            [
              208.001,
              43.77
            ],
            [
              206.765,
              43.853
            ],
            [
              205.528,
              43.933
            ],
            [
              204.292,
              44.009
            ],
            [
              203.055,
              44.083
            ],
            [
              201.819,
              44.154
            ],
            [
              200.582,
              44.223
            ],
            [
              199.346,
              44.288
            ],
            [
              198.109,
              44.351
            ],
            [
              196.873,
              44.411
            ],
            [
              195.636,
              44.468
            ],
            [
              194.4,
              44.522
            ],
            [
              193.163,
              44.574
            ],
            [
              191.927,
              44.623
            ],
            [
              190.69,
              44.67
            ],
            [
              189.454,
              44.714
            ],
            [
              188.217,
              44.755
            ],
            [
              186.981,
              44.794
            ],
            [
              185.745,
              44.831
            ],
            [
              184.508,
              44.866
            ],
            [
              183.272,
              44.898
            ],
            [
              182.035,
              44.928
            ],
            [
              180.799,
              44.956
            ],
            [
              179.562,
              44.982
            ],
            [
              178.326,
              45.006
            ],
            [
              177.089,
              45.029
            ],
            [
              175.853,
              45.049
            ],
            [
              174.616,
              45.068
            ],
            [
              173.38,
              45.085
            ],
            [
              172.143,
              45.101
            ],
            [
              170.907,
              45.115
            ],
            [
              169.67,
              45.128
            ],
            [
              168.434,
              45.14
            ],
            [
              167.197,
              45.15
            ],
            [
              165.961,
              45.16
            ],
            [
              164.724,
              45.168
            ],
            [
              163.488,
              45.176
            ],
            [
              162.251,
              45.183
            ],
            [
              161.015,
              45.19
            ],
            [
              159.779,
              45.196
            ],
            [
              158.542,
              45.201
            ],
            [
              157.306,
              45.206
            ],
            [
              156.069,
              45.211
            ],
            [
              154.833,
              45.216
            ]
          ],
          "levels": {
            "Latte": [
              235.351,
              227.851,
              220.613,
              213.589,
              206.736,
              200.019,
              193.407
            ],
            "Mocha": [
              227.851,
              220.613,
              213.589,
              206.736,
              200.019,
              193.407,
              186.874
            ]
          },
          "base": {
            "Latte": "./assets/glass-hot-base-latte.webp",
            "Mocha": "./assets/glass-hot-base-mocha.webp"
          },
          "shade": "./assets/glass-hot-shade.webp",
          "shine": "./assets/glass-hot-shine.webp"
        },
        "cold": {
          "rings": [
            [
              252.581,
              43.317
            ],
            [
              250.915,
              43.781
            ],
            [
              249.249,
              43.964
            ],
            [
              247.583,
              43.622
            ],
            [
              245.917,
              42.783
            ],
            [
              244.251,
              41.801
            ],
            [
              242.584,
              40.738
            ],
            [
              240.918,
              39.656
            ],
            [
              239.252,
              38.62
            ],
            [
              237.586,
              37.692
            ],
            [
              235.92,
              36.928
            ],
            [
              234.254,
              36.373
            ],
            [
              232.587,
              36.062
            ],
            [
              230.921,
              36.014
            ],
            [
              229.255,
              36.232
            ],
            [
              227.589,
              36.704
            ],
            [
              225.923,
              37.404
            ],
            [
              224.257,
              38.289
            ],
            [
              222.59,
              39.31
            ],
            [
              220.924,
              40.406
            ],
            [
              219.258,
              41.513
            ],
            [
              217.592,
              42.567
            ],
            [
              215.926,
              43.506
            ],
            [
              214.259,
              44.276
            ],
            [
              212.593,
              44.831
            ],
            [
              210.927,
              45.14
            ],
            [
              209.261,
              45.185
            ],
            [
              207.595,
              44.964
            ],
            [
              205.929,
              44.492
            ],
            [
              204.262,
              43.796
            ],
            [
              202.596,
              42.92
            ],
            [
              200.93,
              41.915
            ],
            [
              199.264,
              40.841
            ],
            [
              197.598,
              39.764
            ],
            [
              195.932,
              38.747
            ],
            [
              194.265,
              37.852
            ],
            [
              192.599,
              37.131
            ],
            [
              190.933,
              36.63
            ],
            [
              189.267,
              36.377
            ],
            [
              187.601,
              36.39
            ],
            [
              185.935,
              36.667
            ],
            [
              184.268,
              37.193
            ],
            [
              182.602,
              37.939
            ],
            [
              180.936,
              38.86
            ],
            [
              179.27,
              39.903
            ],
            [
              177.604,
              41.007
            ],
            [
              175.937,
              42.108
            ],
            [
              174.271,
              43.141
            ],
            [
              172.605,
              44.046
            ],
            [
              170.939,
              44.771
            ],
            [
              169.273,
              45.273
            ],
            [
              167.607,
              45.523
            ],
            [
              165.94,
              45.507
            ],
            [
              164.274,
              45.228
            ],
            [
              162.608,
              44.702
            ],
            [
              160.942,
              43.961
            ],
            [
              159.276,
              43.05
            ],
            [
              157.61,
              42.024
            ],
            [
              155.943,
              40.944
            ],
            [
              154.277,
              39.875
            ],
            [
              152.611,
              38.881
            ],
            [
              150.945,
              38.02
            ],
            [
              149.279,
              37.346
            ],
            [
              147.613,
              36.899
            ],
            [
              145.946,
              36.706
            ],
            [
              144.28,
              36.779
            ],
            [
              142.614,
              37.114
            ],
            [
              140.948,
              37.693
            ],
            [
              139.282,
              38.483
            ],
            [
              137.616,
              39.437
            ],
            [
              135.949,
              40.499
            ],
            [
              134.283,
              41.608
            ],
            [
              132.617,
              42.699
            ],
            [
              130.951,
              43.709
            ],
            [
              129.285,
              44.195
            ],
            [
              127.618,
              44.221
            ],
            [
              125.952,
              43.916
            ],
            [
              124.286,
              43.371
            ],
            [
              122.62,
              42.696
            ],
            [
              120.954,
              42.008
            ],
            [
              119.288,
              41.424
            ]
          ],
          "levels": {
            "Latte": [
              235.056,
              225.307,
              217.268,
              210.611,
              204.097,
              196.545,
              187.173
            ],
            "Mocha": [
              225.307,
              217.268,
              210.611,
              204.097,
              196.545,
              187.173,
              178.242
            ]
          },
          "base": {
            "Latte": "./assets/glass-cold-base-latte.webp",
            "Mocha": "./assets/glass-cold-base-mocha.webp"
          },
          "shade": "./assets/glass-cold-shade.webp",
          "shine": "./assets/glass-cold-shine.webp"
        },
        "meniscus": "./assets/glass-meniscus.webp",
        "bottleTone": "./assets/glass-bottletone.webp"
      };
      MILK_STUDIO = {
        "surface": "./assets/milk-surface.webp",
        "flow": {
          "width": 180,
          "height": 216,
          "count": 48,
          "columns": 8,
          "src": "./assets/milk-flow-src.webp"
        },
        "packs": {
          "dairy": {
            "width": 168,
            "height": 174,
            "lip": [
              26,
              33
            ],
            "foot": [
              35.333,
              170.667
            ],
            "frames": 29,
            "shadow": 25.52,
            "sheet": "./assets/milk-packs-dairy-sheet.webp"
          },
          "oat": {
            "width": 164,
            "height": 220,
            "lip": [
              2,
              83
            ],
            "foot": [
              54.667,
              217.667
            ],
            "frames": 15,
            "shadow": 31.39,
            "sheet": "./assets/milk-packs-oat-sheet.webp"
          },
          "soy": {
            "width": 154,
            "height": 186,
            "lip": [
              20,
              69
            ],
            "foot": [
              49.167,
              183
            ],
            "frames": 15,
            "shadow": 35.35,
            "sheet": "./assets/milk-packs-soy-sheet.webp"
          }
        },
        "columns": 5,
        "steps": 15
      };
    }
  });

  // play/app.js
  var app_exports = {};
  function setupCounter() {
    const machine = document.querySelector("#machine");
    const lever = document.querySelector("#lever");
    const cups = document.querySelector("#cups");
    const options = [...cups.querySelectorAll("button")];
    const message = document.querySelector("#message");
    const streams = [...machine.querySelectorAll(".outlet")].map((outlet, i) => ({
      cup: options[i],
      mouth: options[i].querySelector(".cup-mouth"),
      liquid: options[i].querySelector(".liquid-surface"),
      column: outlet.querySelector(".column"),
      landing: outlet.querySelector(".landing"),
      origin: outlet.transform.baseVal.getItem(0).matrix.f,
      top: 0,
      height: 0
    }));
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const shotMs = 2e3;
    const fallMs = 155;
    machine.style.setProperty("--fall-time", `${fallMs}ms`);
    let timer;
    let fill = 0, startFill = 0, contactAt = null, doseMs = 0, fillFrame = 0;
    let seatedAt = 0;
    let drag = null;
    let handledPointer = false;
    function isDown() {
      return machine.dataset.lever === "down";
    }
    function phase(state, note) {
      machine.dataset.state = state;
      const active = state === "seating" || state === "pouring";
      const label = isDown() ? active ? "Lift to stop" : "Lift lever" : "pull to login";
      lever.setAttribute("aria-label", label);
      if (message.textContent !== note) message.textContent = note;
    }
    function paintFill(level) {
      fill = level;
      const depth = 88 * (1 - fill);
      const center = 84 + depth;
      const transform = `translateY(${100 * depth / 144}%) scale(${0.76 + 0.24 * fill})`;
      for (const stream of streams) {
        stream.mouth.hidden = fill === 0;
        stream.liquid.style.transform = transform;
        if (machine.dataset.state !== "pouring") continue;
        const surfaceY = stream.top + stream.height * Math.min(center, 126) / 446;
        const length = Math.max(1, surfaceY - stream.origin);
        stream.column.setAttribute("transform", `scale(1 ${length / 100})`);
        stream.landing.setAttribute("transform", `translate(0 ${length})`);
        stream.landing.style.opacity = String(Math.max(0, Math.min(1, (119 - center) / 12)));
      }
    }
    function alignStreams() {
      if (machine.dataset.state !== "pouring") return;
      const scene = machine.getBoundingClientRect();
      const scale = 768 / scene.height;
      for (const stream of streams) {
        const cup = stream.cup.getBoundingClientRect();
        stream.top = (cup.top - scene.top) * scale;
        stream.height = cup.height * scale;
      }
      paintFill(fill);
    }
    new ResizeObserver(alignStreams).observe(machine);
    function fillAt(now) {
      return Math.min(1, startFill + Math.max(0, now - contactAt) / doseMs);
    }
    function tickFill(now) {
      if (contactAt === null) return;
      const current = fillAt(now);
      const visible = reducedMotion.matches ? Math.max(fill, Math.floor(current * 4) / 4) : current;
      if (visible !== fill) paintFill(visible);
      if (current < 1) fillFrame = requestAnimationFrame(tickFill);
    }
    function cancelFill() {
      cancelAnimationFrame(fillFrame);
      fillFrame = 0;
      contactAt = null;
    }
    function beginPour() {
      const travel = reducedMotion.matches ? 0 : fallMs;
      startFill = fill;
      contactAt = performance.now() + travel;
      doseMs = shotMs - travel;
      phase("pouring", "Pouring espresso\u2026");
      alignStreams();
      fillFrame = requestAnimationFrame(tickFill);
      timer = setTimeout(() => {
        cancelFill();
        paintFill(1);
        phase("ready", "Choose a cup.");
      }, travel + (1 - startFill) * doseMs);
    }
    function setLever(down) {
      if (down === isDown()) return;
      clearTimeout(timer);
      machine.dataset.lever = down ? "down" : "up";
      machine.classList.remove("tease");
      if (!down) {
        const stopped = machine.dataset.state === "pouring";
        if (contactAt !== null) paintFill(fillAt(performance.now()));
        cancelFill();
        phase("ready", stopped ? "Pour stopped. Choose a cup." : "Choose a cup.");
        return;
      }
      if (fill === 1) {
        phase("ready", "The cups are full. Choose a cup.");
        return;
      }
      if (cups.hidden) {
        cups.hidden = false;
        seatedAt = performance.now() + (reducedMotion.matches ? 0 : 560);
      }
      phase("seating", "Starting the pour\u2026");
      const wait = reducedMotion.matches ? 0 : Math.max(190, seatedAt - performance.now());
      if (wait > 0) timer = setTimeout(beginPour, wait);
      else beginPour();
    }
    function clearDrag() {
      const active = drag;
      drag = null;
      machine.classList.remove("tracking");
      machine.style.removeProperty("--angle");
      if (active && lever.hasPointerCapture(active.id)) lever.releasePointerCapture(active.id);
    }
    function restart() {
      clearTimeout(timer);
      cancelFill();
      clearDrag();
      seatedAt = 0;
      handledPointer = false;
      machine.dataset.lever = "up";
      machine.classList.add("tease");
      cups.hidden = true;
      phase("idle", "");
      paintFill(0);
    }
    function track(event) {
      const dy = event.clientY - drag.y;
      drag.distance = Math.max(drag.distance, Math.hypot(event.clientX - drag.x, dy));
      const position = Math.max(0, Math.min(1, drag.start + dy / drag.travel));
      machine.style.setProperty("--angle", `${-37 + position * 71}deg`);
      if (!isDown() && position >= 0.68) setLever(true);
      else if (isDown() && position <= 0.44) setLever(false);
    }
    lever.addEventListener("pointerdown", (event) => {
      if (drag || !event.isPrimary || event.button !== 0) return;
      handledPointer = false;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        start: isDown() ? 1 : 0,
        distance: 0,
        travel: Math.max(38, machine.getBoundingClientRect().width * 0.15)
      };
      machine.classList.remove("tease");
      machine.classList.add("tracking");
      lever.classList.add("pointer-focus");
      lever.focus({ preventScroll: true });
      lever.setPointerCapture(event.pointerId);
    });
    lever.addEventListener("pointermove", (event) => {
      if (drag && drag.id === event.pointerId) track(event);
    });
    lever.addEventListener("pointerup", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      track(event);
      const tapped = drag.distance < 7;
      handledPointer = true;
      clearDrag();
      if (tapped) setLever(!isDown());
    });
    function cancel(event) {
      if (!drag || drag.id !== event.pointerId) return;
      handledPointer = true;
      clearDrag();
    }
    lever.addEventListener("pointercancel", cancel);
    lever.addEventListener("lostpointercapture", cancel);
    lever.addEventListener("click", (event) => {
      if (event.detail === 0 || !handledPointer) setLever(!isDown());
      handledPointer = false;
    });
    document.addEventListener("keydown", () => lever.classList.remove("pointer-focus"), true);
    lever.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setLever(event.key === "ArrowDown");
      } else if (event.repeat && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
      }
    });
    return restart;
  }
  function render() {
    cancelSyrupStroke();
    cancelMilkPour();
    const atCounter = screen === "welcome";
    counterSkin.media = atCounter ? "all" : "not all";
    demoSkin.media = atCounter ? "not all" : "all";
    entryPalette.media = atCounter ? "not all" : "screen";
    if (atCounter) {
      if (!counterRoot.isConnected) {
        app.replaceChildren(counterRoot);
        clearTimeout(toastTimer);
        const toastNode = document.querySelector("#toast");
        toastNode.className = "toast";
        toastNode.textContent = "";
      }
      restartCounter();
      return;
    }
    if (counterRoot.isConnected) restartCounter();
    renderDemoScreen();
  }
  function newDraft() {
    return { firstName: "", lastName: "", temperature: null, drink: null, syrup: "none", pumps: 0, milk: null };
  }
  function readOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(isOrder)) throw new Error("Saved order data is invalid.");
      storageError = "";
      return parsed;
    } catch (error) {
      console.error("Unable to load cafe orders:", error);
      storageError = "Saved orders could not be loaded. Ordering is paused to protect your data. Allow browser storage or use a fresh local browser profile.";
      return [];
    }
  }
  function saveOrders(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      orders = next;
      storageError = "";
      return true;
    } catch (error) {
      console.error("Unable to save cafe orders:", error);
      storageError = "Your change was not saved. Free some browser storage or allow local storage, then try again.";
      toast(storageError, true);
      return false;
    }
  }
  function mutateOrders(update) {
    const latest = readOrders();
    if (storageError) {
      toast(storageError, true);
      return false;
    }
    return saveOrders(update(latest));
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  function icon(name, size = 22) {
    const paths = {
      cup: '<path d="M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2"/>',
      arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
      back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
      snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M8 4l4 3 4-3M8 20l4-3 4 3M3 11l5-1-1-5m10 14-1-5 5-1M3 13l5 1-1 5m10-14-1 5 5 1"/>',
      users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      print: '<path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6Z"/><path d="M17 11h1"/>',
      milk: '<path d="m8 3 8 0 3 5v13H5V8l3-5Zm-3 5h14M8 3v5m8-5v5"/><path d="M9 12h6v5H9Z"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
      home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
      logout: '<path d="M9 3H4v18h5m6-15 6 6-6 6m-6-6h12"/>',
      leaf: '<path d="M20 3C9 1 2 7 5 15c8 6 16-1 15-12Z"/><path d="M3 21 15 9"/>',
      oat: '<path d="M12 22V3m0 6C7 9 5 6 6 3c4 0 6 2 6 6Zm0 6c-5 0-7-3-6-6 4 0 6 2 6 6Zm0 5c-5 0-7-3-6-6 4 0 6 2 6 6Zm0-11c5 0 7-3 6-6-4 0-6 2-6 6Zm0 6c5 0 7-3 6-6-4 0-6 2-6 6Zm0 5c5 0 7-3 6-6-4 0-6 2-6 6Z"/>',
      soy: '<path d="M20 3C11 1 2 10 3 18c1 5 8 4 13-1S23 8 20 3Zm0 0 2-2"/><circle cx="8" cy="16" r="2.3"/><circle cx="12.5" cy="11.5" r="2.3"/><circle cx="17" cy="7" r="2.3"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      minus: '<path d="M5 12h14"/>',
      sparkle: '<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/>'
    };
    return `<svg data-icon="${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cup}</svg>`;
  }
  function espressoRecipeLabel(drink) {
    const { shots, chocolatePumps } = DRINK_RECIPES[drink];
    const espresso = `${shots} espresso shot${shots === 1 ? "" : "s"}`;
    return chocolatePumps ? `${espresso} + ${chocolatePumps} pump${chocolatePumps === 1 ? "" : "s"} of chocolate syrup` : espresso;
  }
  function noSyrupLabel(drink) {
    return DRINK_RECIPES[drink].chocolatePumps ? "No extra syrup" : "No syrup";
  }
  function toast(message, error = false) {
    const element = document.querySelector("#toast");
    clearTimeout(toastTimer);
    element.textContent = message;
    element.className = `toast visible${error ? " error" : ""}`;
    toastTimer = setTimeout(() => {
      element.className = "toast";
    }, error ? 8e3 : 3500);
  }
  function go(next) {
    selected.clear();
    screen = next;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector("h1")?.focus({ preventScroll: true });
  }
  function button(label, action, options = {}) {
    return `<button type="button" class="button ${options.secondary ? "secondary" : ""} ${options.className || ""}" data-action="${action}" ${options.disabled ? "disabled" : ""}>${label}${options.arrow === false ? "" : icon("arrow", 19)}</button>`;
  }
  function title(eyebrow, heading, description) {
    return `<div class="page-heading">${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<h1 tabindex="-1">${heading}</h1>${description ? `<p>${description}</p>` : ""}</div>`;
  }
  function shell(content) {
    const team = Boolean(account && role && role !== "drinker");
    const choosingRole = screen === "audience";
    const breadcrumb = {
      name: forCustomer ? "Customer name" : "Put in Your Name",
      audience: "Choose Your Role",
      drink: "Caffeine Dosage",
      syrup: "Syrup",
      milk: "Milk",
      temperature: forCustomer ? "Temperature" : null,
      status: "Order status",
      "my-orders": "My orders",
      roles: "Team stations",
      "order-taker": "Order taking",
      "steam-filter": "Milk prep",
      "steam-queue": "Milk queue",
      mixer: "Drink assembly",
      labels: "Cup labels"
    }[screen] || (team ? "Behind the counter" : "A little cup of happy");
    const inOrder = ["name", "temperature", "drink", "syrup", "milk"].includes(screen);
    const nav = account ? `
    ${team ? `<button class="nav-item ${["roles", "audience"].includes(screen) ? "active" : ""}" data-action="roles">${icon("users")}Coffee team</button>
      <button class="nav-item ${screen === "order-taker" || screen === "labels" || forCustomer && (inOrder || screen === "status") ? "active" : ""}" data-action="order-taker">${icon("print")}Order taking</button>
      <button class="nav-item ${screen.startsWith("steam") ? "active" : ""}" data-action="steamer">${icon("milk")}Milk prep</button>
      <button class="nav-item ${screen === "mixer" ? "active" : ""}" data-action="mixer">${icon("cup")}Drink assembly</button>` : `<button class="nav-item ${inOrder ? "active" : ""}" data-action="new-order">${icon("cup")}Order a coffee</button>
      <button class="nav-item ${screen === "my-orders" || screen === "status" ? "active" : ""}" data-action="my-orders">${icon("clock")}My orders <span class="nav-count">${ownIds.length}</span></button>`}
    <button class="nav-item" data-action="audience">${icon("home")}Switch team / drinker</button>
    ` : `<div class="nav-item active">${icon("home")}Welcome in</div>`;
    return `<div class="app-shell">
    <aside class="sidebar${choosingRole ? " entry-rail" : ""}">
      <a class="brand" href="#" data-action="brand" aria-label="Corner Cafe home"><span class="brand-icon">${icon("cup", 28)}</span><span>corner<span class="brand-second">cafe<span class="brand-dot">.</span></span></span></a>
      ${choosingRole ? `<p class="entry-current" aria-current="page">${icon("home")}Role selection</p>` : `<nav aria-label="Main navigation">${nav}</nav>`}
      ${account ? `<div class="profile"><span class="avatar">${escapeHtml((account.firstName || "G")[0])}</span><div><strong>${escapeHtml(account.firstName || "Guest")}</strong>${account.type === "church" ? "<small>Church Center \xB7 demo</small>" : ""}</div><button class="icon-button" data-action="sign-out" aria-label="Sign out">${icon("logout", 18)}</button></div>` : ""}
    </aside>
    <div class="main-shell">
      <header class="topbar"><div class="breadcrumb">Corner Cafe <span>/</span> ${breadcrumb}</div><div class="header-right"><span class="open-badge"><i></i>The cafe is open</span><span class="demo-badge">LOCAL PROTOTYPE</span></div></header>
      ${storageError ? `<div class="error-banner" role="alert">${escapeHtml(storageError)}</div>` : ""}
      <main id="main">${content}</main>
    </div>
  </div>`;
  }
  function choiceMotif(paired = false) {
    const star = (x, y, size, tilt) => `<g transform="translate(${x} ${y}) rotate(${tilt} ${size / 2} ${size / 2})">${icon("sparkle", size)}</g>`;
    return `<svg class="choice-motif" viewBox="0 0 160 160" fill="none" focusable="false">
      <circle cx="80" cy="86" r="64" fill="var(--paper, #fffdf5)"/>
      ${paired ? star(43, 3, 22, -9) : star(13, 57, 18, -9)}
      ${paired ? star(76, 138, 17, 9) : star(132, 102, 12, 9)}
      <circle cx="${paired ? 89 : 136}" cy="${paired ? 16 : 38}" r="3.3" fill="var(--enamel, #f2de7d)"/>
    </svg>`;
  }
  function temperatureChoiceArt(temperature) {
    const { src, alt } = TEMPERATURE_STICKERS[temperature];
    return `<div class="temperature-art ${temperature === "hot" ? "hot-card" : "cold-card"}" aria-hidden="true">
    ${choiceMotif()}
    <img class="temperature-sticker" width="456" height="750" alt="${alt}" draggable="false" src="${src}">
  </div>`;
  }
  function espressoChoiceArt({ shots, chocolatePumps }) {
    const shot = `<img class="recipe-shot" width="307" height="404" alt="" draggable="false" src="${ESPRESSO_STICKERS.shot}">`;
    const pump = `<img class="recipe-pump" width="296" height="494" alt="" draggable="false" src="${ESPRESSO_STICKERS.pump}">`;
    return `<span class="espresso-art" aria-hidden="true">${choiceMotif(shots + chocolatePumps > 1)}<span class="recipe-stickers">
    ${shot.repeat(shots)}${chocolatePumps ? `<span class="recipe-plus">+</span>${pump.repeat(chocolatePumps)}` : ""}
  </span></span>`;
  }
  function toneFilter(id) {
    return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table"/><feFuncG type="table"/><feFuncB type="table"/></feComponentTransfer></filter>`;
  }
  function glassDefs() {
    return `<filter id="station-shadow" x="-.3" y="-1" width="1.6" height="3"><feGaussianBlur stdDeviation="2"/></filter>
    ${toneFilter("station-liquid-color")}
    <linearGradient id="station-depth" gradientUnits="userSpaceOnUse" x1="0" x2="0"><stop stop-color="#653718" stop-opacity="0"/><stop offset=".62" stop-color="#653718" stop-opacity=".08"/><stop offset="1" stop-color="#57311c" stop-opacity=".45"/></linearGradient>
    <clipPath id="station-volume"><path class="station-outline"/></clipPath>
    <clipPath id="station-disc"><circle r="1"/></clipPath>`;
  }
  function recipeGlass(glass) {
    return `<image class="station-cup" x="0" y="100" width="150" height="180" href="${glass.base[draft.drink]}"/>
        <g class="station-syrup" clip-path="url(#station-volume)" opacity="0">
          <image x="0" y="100" width="150" height="180" href="${glass.shade}" filter="url(#station-liquid-color)"/>
          <rect x="40" y="110" width="105" height="150" fill="url(#station-depth)"/>
          <g class="station-cap"><g clip-path="url(#station-disc)"><image x="-1" y="-1" width="2" height="2" preserveAspectRatio="none" href="${SYRUP_GLASS.meniscus}" filter="url(#station-liquid-color)"/></g></g>
          <image x="0" y="100" width="150" height="180" href="${glass.shine}"/>
        </g>`;
  }
  function syrupStation() {
    const style = draft.temperature === "cold" ? "cold" : "hot";
    const glass = SYRUP_GLASS[style];
    const basePumps = DRINK_RECIPES[draft.drink].chocolatePumps;
    const x = PUMP_OUTLET.x;
    return `<div class="syrup-station">
    <fieldset class="station-flavors"><legend>Flavor</legend><div class="syrup-options">
      ${SYRUPS.map(({ id, name, color }) => `<button type="button" class="syrup-option" data-action="syrup" data-value="${id}" style="--swatch:${color}" aria-pressed="${draft.syrup === id}">${id === "none" ? noSyrupLabel(draft.drink) : name}</button>`).join("")}
    </div><p class="station-hint">Switching flavors resets the extra pumps.</p></fieldset>
    <div class="station-dispenser" aria-hidden="true">
      <svg class="station-photo" viewBox="0 0 280 294" data-glass="${style}" data-recipe="${draft.drink}" focusable="false">
        <defs>${glassDefs()}
          <linearGradient id="station-thread"><stop stop-color="var(--syrup-shadow)"/><stop offset=".3" stop-color="var(--syrup-tint)"/><stop offset=".5" stop-color="var(--syrup-glint)"/><stop offset=".7" stop-color="var(--syrup-tint)"/><stop offset="1" stop-color="var(--syrup-shadow)"/></linearGradient>
        </defs>
        <g filter="url(#station-shadow)" fill="#745039" opacity=".19"><ellipse cx="92" cy="269" rx="43" ry="4"/><ellipse cx="201" cy="270" rx="30" ry="4"/></g>
        <image class="station-head" width="280" height="294" href="${SYRUP_PUMP_PHOTO.head}"/>
        <image class="station-bottle" width="280" height="294" href="${SYRUP_PUMP_PHOTO.body}"/>
        <image x="169" y="95" width="62" height="176" href="${SYRUP_GLASS.bottleTone}" filter="url(#station-liquid-color)"/>
        <path d="M174 166q26 5 52 0v24q-26 5-52 0Z" fill="#fbefd6" opacity=".96"/>
        <text class="bottle-label" x="200" y="182.5" text-anchor="middle" font-family="Georgia, serif" font-size="8.4" fill="#4b3526"></text>
        ${recipeGlass(glass)}
        <rect class="station-thread" x="${x - 1.7}" y="${PUMP_OUTLET.y}" width="3.4" height="0" rx="1.6" fill="url(#station-thread)"/>
        <ellipse class="station-ripple" cx="${x}" fill="none" stroke="var(--syrup-glint)" stroke-width=".85" opacity="0"/>
      </svg>
    </div>
    <div class="station-dose">
      <output id="syrup-dose" aria-live="polite" aria-atomic="true">Syrup added: <strong class="dose-count">${draft.pumps} of ${MAX_SYRUP_PUMPS} pumps</strong></output>
      <div class="dose-stepper" role="group" aria-label="Adjust extra syrup">
        <button type="button" data-action="pump-down" aria-label="Remove one pump" aria-controls="syrup-dose">\u2212</button>
        <button type="button" data-action="pump-up" aria-label="Add one pump" aria-controls="syrup-dose">+</button>
      </div>
      <p class="station-base-note">${draft.drink} starts with ${espressoRecipeLabel(draft.drink)}.${basePumps ? " The included chocolate doesn\u2019t count as extra syrup." : ""}</p>
    </div>
  </div>`;
  }
  function milkStation() {
    const style = draft.temperature, glass = SYRUP_GLASS[style];
    const flavor = SYRUPS.find((item) => item.id === draft.syrup);
    const base = `${espressoRecipeLabel(draft.drink)} \xB7 ${draft.pumps ? `${draft.pumps} pump${draft.pumps === 1 ? "" : "s"} of ${syrupName(flavor)} syrup` : noSyrupLabel(draft.drink)}`;
    const { packs, columns, flow, surface } = MILK_STUDIO;
    const fieldView = `x="-1" y="-.5" width="2" height="1.5" viewBox="0 0 ${flow.width} ${flow.height}" preserveAspectRatio="none" overflow="hidden"`;
    const packImages = MILKS.map(({ id }) => {
      const p = packs[id];
      return `<image id="milk-photo-${id}" width="${p.width * columns}" height="${p.height * Math.ceil(p.frames / columns)}" href="${p.sheet}"/>`;
    }).join("");
    const lineup = MILKS.map(({ id }, i) => {
      const p = packs[id], x = 164 + 44 * i, scale = 0.47;
      return `<ellipse cx="${x}" cy="269" rx="${p.shadow * scale}" ry="1.8" fill="#745039" opacity=".18" filter="url(#station-shadow)"/>
      <g transform="translate(${x - p.foot[0] * scale} ${268 - p.foot[1] * scale}) scale(${scale})"><svg width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}" overflow="hidden"><use href="#milk-photo-${id}"/></svg></g>`;
    }).join("");
    return `<div class="milk-station">
    <fieldset class="milk-choices"><legend>Milk type</legend><div class="milk-options">
      ${MILKS.map((m) => `<button type="button" class="milk-option" data-action="milk" data-value="${m.id}" aria-label="${m.name}" aria-describedby="milk-kind-${m.id}" aria-pressed="${draft.milk === m.id}"><span>${m.name}</span><small id="milk-kind-${m.id}">${m.group === "dairy" ? "Dairy" : "Non-dairy"}</small></button>`).join("")}
    </div></fieldset>
    <div class="milk-stage" aria-hidden="true">
      <svg class="milk-photo" viewBox="0 0 280 294" data-glass="${style}" data-recipe="${draft.drink}" focusable="false">
        <defs>${glassDefs()}${toneFilter("milk-tone")}${toneFilter("milk-fresh-tone")}${packImages}
          <clipPath id="milk-volume"><path class="milk-outline"/></clipPath>
          <image id="milk-side" x="0" y="100" width="150" height="180" href="${glass.shade}"/>
          <image id="milk-reflections" x="0" y="100" width="150" height="180" href="${glass.shine}"/>
          <g id="milk-face" class="milk-cap"><g clip-path="url(#station-disc)"><image x="-1" y="-1" width="2" height="2" preserveAspectRatio="none" href="${surface}"/></g></g>
          <linearGradient id="milk-hold-depth" gradientUnits="userSpaceOnUse" x1="0" x2="0"><stop class="milk-old-surface"/><stop offset="1"/></linearGradient>
          <mask id="milk-recipe-mask" maskUnits="userSpaceOnUse" x="35" y="103" width="116" height="167">
            <rect x="35" y="103" width="116" height="167" fill="white"/><path class="milk-recipe-hold" fill="url(#milk-hold-depth)"/>
          </mask>
          <image id="milk-flow-atlas" width="${flow.width * flow.columns}" height="${flow.height * Math.ceil(flow.count / flow.columns)}" href="${flow.src}"/>
          <radialGradient id="milk-spread"><stop stop-color="white"/><stop offset=".53" stop-color="white" stop-opacity=".91"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient>
          <mask id="milk-traces" maskUnits="userSpaceOnUse" x="35" y="103" width="116" height="167" color-interpolation="sRGB">
            <g class="milk-field-space"><svg class="milk-field-a" ${fieldView}><use href="#milk-flow-atlas"/></svg><svg class="milk-field-b" ${fieldView}><use href="#milk-flow-atlas"/></svg></g>
            <circle class="milk-spread" r="1" fill="url(#milk-spread)"/>
          </mask>
          <linearGradient id="milk-depth" gradientUnits="userSpaceOnUse" x1="0" x2="0"><stop stop-color="#56311b" stop-opacity="0"/><stop offset=".59" stop-color="#56311b" stop-opacity=".06"/><stop offset="1" stop-color="#56311b" stop-opacity=".25"/></linearGradient>
          <linearGradient id="milk-jet-color"><stop stop-color="#a48a69"/><stop offset=".18" stop-color="var(--milk-color)"/><stop offset=".5" stop-color="#fffdf2"/><stop offset=".83" stop-color="var(--milk-color)"/><stop offset="1" stop-color="#ac977e"/></linearGradient>
        </defs>
        <g filter="url(#station-shadow)" fill="#745039" opacity=".19"><ellipse cx="92" cy="269" rx="43" ry="4"/><ellipse class="milk-package-shadow" cx="206" cy="269" ry="3.4"/></g>
        ${recipeGlass(glass)}
        <g class="milk-blend" clip-path="url(#milk-volume)" opacity="0">
          <g mask="url(#milk-recipe-mask)">
            <use href="#milk-side" filter="url(#milk-tone)"/><rect x="40" y="105" width="105" height="160" fill="url(#milk-depth)"/>
            <use href="#milk-face" filter="url(#milk-tone)"/><use href="#milk-reflections"/>
          </g>
          <g mask="url(#milk-traces)">
            <use href="#milk-side" filter="url(#milk-fresh-tone)"/><use href="#milk-face" filter="url(#milk-fresh-tone)"/><use href="#milk-reflections"/>
          </g>
        </g>
        <path class="milk-jet" fill="url(#milk-jet-color)" stroke="#b2a18b" stroke-width=".38"/>
        <ellipse class="milk-ripple" fill="none" stroke="var(--milk-color)" stroke-width=".95" opacity="0"/>
        <g class="milk-lineup">${lineup}</g>
        <g class="milk-package"><svg class="milk-pose" overflow="hidden"><use/></svg></g>
      </svg>
    </div>
    <div class="milk-recipe"><h2>${style === "hot" ? "Hot" : "Iced"} ${draft.drink}</h2><p>${base}</p><p class="milk-status" role="status" aria-atomic="true">No milk selected.</p></div>
  </div><p class="milk-allergens">Prepared on shared equipment that may come into contact with allergens.</p>`;
  }
  function choiceCard(action, value, heading, detail, visual, active = false, extra = "") {
    return `<button type="button" class="choice-card ${active ? "selected" : ""} ${extra}" data-action="${action}" data-value="${value}" aria-pressed="${active}"><span class="choice-check">${active ? icon("check", 14) : ""}</span>${visual}<strong>${heading}</strong><span class="choice-detail">${detail}</span></button>`;
  }
  function audience() {
    const greeting = account.firstName ? `Welcome in, ${escapeHtml(account.firstName)}.` : "Welcome to the corner.";
    const mark = (name) => roleChooserArt.querySelector(`[data-role-art="${name}"]`).outerHTML;
    return `<section class="center-page"><div class="page-heading"><h1 tabindex="-1">${greeting}</h1></div><div class="role-grid two">
    ${choiceCard("drinker", "", "Coffee drinker", "Find your new favorite little ritual.", `<div class="role-visual peach">${mark("drinker")}</div>`)}
    ${choiceCard("roles", "", "Coffee team", "A little teamwork for the community", `<div class="role-visual lavender">${mark("team")}</div>`)}
    </div><p class="helper-note">${account.type === "church" ? "Church Center demo account \xB7 No real authentication or credentials." : "Guest demo access \xB7 Explore either side of the counter."}</p></section>`;
  }
  function stationLink(action, name, detail, value = "") {
    return `<button type="button" class="station-link" data-action="${action}" data-value="${value}">
    <span><strong>${name}</strong><small>${detail}</small></span>${icon("arrow", 19)}
  </button>`;
  }
  function rolePicker() {
    return `<section class="desk-page station-page">${title("", "Choose a station")}<div class="station-menu">
    ${stationLink("order-taker", "Order taking", "Enter customer orders and print cup labels.")}
    ${stationLink("steamer", "Milk prep", "Prepare milk for hot and iced drinks.")}
    ${stationLink("mixer", "Drink assembly", "Assemble drinks and mark them ready for pickup.")}
  </div>${demoQueueControl()}</section>`;
  }
  function demoQueueControl() {
    return `<div class="demo-tools"><button type="button" class="text-button" data-action="seed">Add 4 demo orders</button></div>`;
  }
  function nameScreen() {
    return `<section class="builder name-entry">
    <button type="button" class="back-link" data-action="${forCustomer ? "order-taker" : "audience"}">${icon("back", 16)} Back</button>
    ${forCustomer ? title("", "Customer name") : title("FIRST, A LITTLE HELLO", "What should we call you?")}
    <form id="name-form">
      <div class="name-fields">
        <label>First name<input name="firstName" autocomplete="given-name" required maxlength="40" value="${escapeHtml(draft.firstName)}"></label>
        <label>Last name<input name="lastName" autocomplete="family-name" required maxlength="40" value="${escapeHtml(draft.lastName)}"></label>
      </div>
      <button class="button" type="submit">${forCustomer ? "Choose temperature" : "Let\u2019s make your coffee"} ${icon("arrow", 19)}</button>
    </form>
  </section>`;
  }
  function stepper() {
    const steps = ["temperature", "drink", "syrup", "milk"];
    return `<ol class="stepper" aria-label="Order progress">${steps.map((step, index) => `<li class="${step === screen ? "current" : steps.indexOf(screen) > index ? "complete" : ""}" ${step === screen ? 'aria-current="step"' : ""}><span>${steps.indexOf(screen) > index ? icon("check", 12) : `0${index + 1}`}</span><small>${["Temperature", "Your drink", "Syrup", "Milk"][index]}</small></li>`).join("")}</ol>`;
  }
  function wizard() {
    const choosingTemperature = screen === "temperature";
    const choosingEspresso = screen === "drink";
    let content = "";
    let next = "";
    let previous = "name";
    if (choosingTemperature) {
      content = `${forCustomer ? title("", "Choose temperature") : title("LET\u2019S MAKE SOMETHING LOVELY", "What\u2019s your kind of cozy?", "Something warm to hold, or a little chill to brighten your day?")}<div class="temperature-grid">
      ${choiceCard("temperature", "hot", forCustomer ? "Hot" : "Hot & cozy", forCustomer ? "Hot water or steamed milk" : "A warm little hug in a cup.", temperatureChoiceArt("hot"), draft.temperature === "hot")}
      ${choiceCard("temperature", "cold", forCustomer ? "Iced" : "Iced & happy", forCustomer ? "Cold water or cold milk" : "A refreshing kind of pick-me-up.", temperatureChoiceArt("cold"), draft.temperature === "cold")}
      </div>`;
      next = button(forCustomer ? "Choose a drink" : "Find my drink", "next", { disabled: !draft.temperature });
    } else if (choosingEspresso) {
      previous = "temperature";
      content = `<div class="page-heading"><h1 tabindex="-1">Choose Your Espresso Shot</h1></div>
      <div class="drink-options">${Object.entries(DRINK_RECIPES).map(([name, recipe]) => choiceCard(
        "drink",
        name,
        name,
        `${espressoRecipeLabel(name)}<span class="recipe-finish">With ${recipe.finish}</span>`,
        espressoChoiceArt(recipe),
        draft.drink === name
      )).join("")}</div>`;
      const readyToOrder = draft.drink === "Americano";
      const label = readyToOrder ? forCustomer ? "Place customer\u2019s order" : "Place my order" : draft.drink ? "Choose syrup" : "Continue";
      next = button(label, readyToOrder ? "submit-order" : "next", { disabled: !draft.drink || Boolean(storageError) });
    } else if (screen === "syrup") {
      previous = "drink";
      content = `<div class="page-heading"><h1 tabindex="-1">Choose Your Syrup</h1>
      <p id="station-instructions">Choose a flavor and use + or \u2212 to adjust it, or continue without extra syrup.</p>
    </div>${syrupStation()}`;
      next = button("Choose milk", "next");
    } else {
      previous = "syrup";
      content = `<div class="page-heading"><h1 tabindex="-1">Choose Your Milk</h1><p>Select a milk to fill your glass. Switching milks replaces the pour.</p></div>${milkStation()}`;
      next = button(forCustomer ? "Place customer\u2019s order" : "Place my order", "submit-order", { disabled: !draft.milk || Boolean(storageError) });
    }
    const layout = choosingTemperature ? "temperature-step" : choosingEspresso ? "espresso-step" : screen === "milk" ? "milk-step" : "syrup-step";
    return `<section class="${layout}"><div class="builder">${stepper()}${content}<div class="builder-actions"><button class="back-link" data-action="back" data-value="${previous}">${icon("back", 17)} Back</button>${next}</div><div class="customer-note">Made for <strong>${escapeHtml(`${draft.firstName} ${draft.lastName}`)}</strong>${forCustomer ? " \xB7 Ordered by the coffee team" : ""}</div></div></section>`;
  }
  function orderTaker() {
    return `<section class="desk-page station-page">${title("", "Order taking")}<div class="station-menu">
    ${stationLink("customer-order", "Take an order", "Start with the customer\u2019s name.")}
    ${stationLink("labels", "Print cup labels", orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"} available to label.` : "No orders to label yet.")}
  </div>${demoQueueControl()}</section>`;
  }
  function milkFilter() {
    return `<section class="desk-page station-page">${title("", "Choose a milk queue")}<div class="station-menu">
    ${stationLink("milk-filter", "Dairy", "2% milk", "dairy")}
    ${stationLink("milk-filter", "Non-dairy", "Oat and soy milk", "non-dairy")}
    ${stationLink("milk-filter", "All milks", "All orders waiting for milk", "both")}
  </div></section>`;
  }
  function orderRecipe(order) {
    const milk = MILKS.find((item) => item.id === order.milk);
    const syrup = SYRUPS.find((item) => item.id === order.syrup);
    return {
      drink: `${order.temperature === "hot" ? "Hot" : "Iced"} ${order.drink}`,
      base: espressoRecipeLabel(order.drink) + (DRINK_RECIPES[order.drink].finish === "water" ? " + water" : ""),
      milk: milk?.name,
      extra: order.pumps ? `${order.pumps} pump${order.pumps === 1 ? "" : "s"} of ${syrupName(syrup)} syrup` : null
    };
  }
  function syrupName(syrup) {
    return syrup?.name.toLowerCase() || "";
  }
  function recipeRows(recipe) {
    const row = (label, value) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`;
    return `<dl class="recipe-lines">${row("Base", recipe.base)}${recipe.milk ? row("Milk", recipe.milk) : ""}${row("Extra syrup", recipe.extra || "None")}</dl>`;
  }
  function orderState(order) {
    const ready = order.status === "ready";
    return `<span class="order-state${ready ? " ready-state" : ""}">${ready ? "Ready for pickup" : "Preparing"}</span>`;
  }
  function ticket(order, selectable = true, mode = screen) {
    const recipe = orderRecipe(order), id = escapeHtml(order.id);
    let footer = "";
    if (mode === "my-orders") {
      footer = `<button class="text-button" data-action="track" data-value="${id}">View status<span class="sr-only"> for order ${order.number}</span> ${icon("arrow", 16)}</button>`;
    } else if (mode === "steam-queue") {
      footer = `<span>${order.temperature === "hot" ? "Steam the milk" : "Use cold milk"}</span><button class="text-button" data-action="finish-one" data-value="${id}" aria-label="Finish milk for order ${order.number}">Finish milk</button>`;
    } else if (mode === "mixer" && order.status !== "ready") {
      footer = !recipe.milk ? "No milk needed" : order.milkDone ? "Milk prepared" : order.temperature === "cold" ? "Cold milk pending" : "Steamed milk pending";
    }
    return `<article class="ticket${selectable && selected.has(order.id) ? " is-selected" : ""}" data-order-id="${id}" ${mode === "steam-queue" ? 'data-swipe="true"' : ""}>
    <div class="ticket-top"><span class="ticket-number">Order #${order.number}</span><div class="ticket-tools">
      ${!selectable || mode === "labels" ? orderState(order) : ""}
      ${selectable ? `<label class="ticket-select"><span class="sr-only">Select order ${order.number} for ${escapeHtml(order.firstName)}</span><input type="checkbox" data-select="${id}" ${selected.has(order.id) ? "checked" : ""}></label>` : ""}
    </div></div>
    <h3>${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)}</h3>
    <p class="ticket-drink">${escapeHtml(recipe.drink)}</p><p class="ticket-base">${escapeHtml(recipe.base)}</p>
    <ul class="ticket-tags">${recipe.milk ? `<li>${escapeHtml(recipe.milk)}</li>` : ""}<li>${escapeHtml(recipe.extra || noSyrupLabel(order.drink))}</li></ul>
    ${footer ? `<div class="ticket-bottom">${footer}</div>` : ""}
  </article>`;
  }
  function emptyState(heading, detail = "") {
    return `<div class="empty-state"><h2>${heading}</h2>${detail ? `<p>${detail}</p>` : ""}</div>`;
  }
  function visibleOrders() {
    if (screen === "steam-queue") return milkQueue(orders, filter);
    if (screen === "mixer") return orders.filter((order) => order.status !== "ready");
    return orders;
  }
  function queueScreen() {
    const isSteam = screen === "steam-queue";
    const isMixer = screen === "mixer";
    const list = visibleOrders();
    const ready = orders.filter((order) => order.status === "ready");
    const heading = isSteam ? "Milk prep queue" : isMixer ? "Drink assembly" : "Cup labels";
    const instruction = isSteam ? "Swipe a ticket right to finish its milk, or select several tickets." : isMixer ? "Select finished drinks to mark them ready for pickup." : "Select the orders you want to print.";
    const empty = isSteam ? `No ${filter === "both" ? "" : filter + " "}orders waiting for milk.` : isMixer ? "No drinks to assemble." : "No labels to print.";
    const grid = (rows, selectable = true) => `<div class="ticket-grid">${rows.map((order) => ticket(order, selectable)).join("")}</div>`;
    const count = (n) => `<span class="count-bubble">${n}</span>`;
    return `<section class="desk-page">${title("", heading, list.length ? instruction : "")}
    <div class="queue-toolbar"><div class="queue-tabs">${isSteam ? [["dairy", "Dairy"], ["non-dairy", "Non-dairy"], ["both", "All milks"]].map(([value, label]) => `<button class="pill-tab" data-action="queue-filter" data-value="${value}" aria-pressed="${filter === value}">${label} ${count(milkQueue(orders, value).length)}</button>`).join("") : `<span class="queue-title">${isMixer ? "Preparing" : "Orders"} ${count(list.length)}</span>`}</div>
      ${list.length ? `<button class="text-button" data-action="select-all">${list.every((order) => selected.has(order.id)) ? "Deselect all" : "Select all"}</button>` : ""}</div>
    ${list.length ? isSteam ? MILKS.map((milk) => {
      const group = list.filter((order) => order.milk === milk.id);
      return group.length ? `<section class="milk-group"><h2>${milk.name} ${count(group.length)}</h2>${grid(group)}</section>` : "";
    }).join("") : grid(list) : emptyState(empty)}
    ${list.length ? `<div class="queue-action-bar"><span><strong>${selected.size}</strong> ${isSteam ? "pour" : "order"}${selected.size === 1 ? "" : "s"} selected</span>${button(isSteam ? "Finish milk" : isMixer ? "Mark as ready" : "Print selected", isSteam ? "finish-selected" : isMixer ? "ready-selected" : "print-selected", { disabled: !selected.size, arrow: false })}</div>` : ""}
    ${isMixer ? `<section class="ready-group"><h2>Ready for pickup ${count(ready.length)}</h2>${ready.length ? grid(ready, false) : '<p class="desk-note">No drinks ready for pickup.</p>'}</section>` : ""}
    ${orders.length ? "" : demoQueueControl()}
    <p class="desk-note local-note">Local demo \xB7 Orders sync across tabs in this browser, not across devices.</p></section>`;
  }
  function statusScreen() {
    const order = orders.find((item) => item.id === trackedId);
    if (!order) return `<section class="desk-page">${title("", "Order not found", "This order is no longer in this browser.")}${button(forCustomer ? "Take another order" : "Order a coffee", forCustomer ? "customer-order" : "new-order")}</section>`;
    const ready = order.status === "ready", recipe = orderRecipe(order);
    return `<section class="receipt-page">
    <article class="pickup-ticket${ready ? " pickup-ready" : ""}">
      <header class="receipt-head"><div><span class="receipt-label">Pickup ticket</span><h1 tabindex="-1">Order #${order.number}</h1></div>${orderState(order)}</header>
      <div class="status-recipe"><p class="receipt-name">For <strong>${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)}</strong></p>
        <h2>${escapeHtml(recipe.drink)}</h2>${recipeRows(recipe)}</div>
      <p class="pickup-note">${ready ? "Pick up at the caf\xE9 counter." : "This ticket updates when the drink is ready."}</p>
    </article>
    <div class="receipt-actions">${button(forCustomer ? "Take another order" : "Order another coffee", forCustomer ? "customer-order" : "new-order")}
      ${button(forCustomer ? "Back to order taking" : "My orders", forCustomer ? "order-taker" : "my-orders", { secondary: true, arrow: false })}</div>
    ${ready ? "" : '<button class="text-button receipt-demo" data-action="simulate-ready">Mark ready (demo)</button>'}
  </section>`;
  }
  function myOrders() {
    const mine = orders.filter((order) => ownIds.includes(order.id));
    return `<section class="desk-page">${title("", "My orders", "Orders you placed during this session.")}
    ${mine.length ? `<div class="ticket-grid">${mine.map((order) => ticket(order, false)).join("")}</div>` : emptyState("No orders yet.")}
    <div class="section-action">${button("Order a coffee", "new-order")}</div></section>`;
  }
  function renderDemoScreen() {
    const pages = {
      audience,
      roles: rolePicker,
      name: nameScreen,
      temperature: wizard,
      drink: wizard,
      syrup: wizard,
      milk: wizard,
      "order-taker": orderTaker,
      "steam-filter": milkFilter,
      "steam-queue": queueScreen,
      mixer: queueScreen,
      labels: queueScreen,
      status: statusScreen,
      "my-orders": myOrders
    };
    app.innerHTML = shell(pages[screen]());
    if (screen === "syrup") updateSyrupStation(true);
    if (screen === "milk") showMilkStation();
  }
  function cancelSyrupStroke() {
    cancelAnimationFrame(syrupFrame);
    syrupFrame = 0;
  }
  function applyLiquidTone(filter2, rgb) {
    const white = [255, 249, 237];
    const ramp = [
      rgb.map((n) => n * 0.32),
      rgb.map((n) => n * 0.68),
      rgb,
      rgb.map((n, i) => n * 0.53 + white[i] * 0.47),
      white
    ];
    filter2.querySelectorAll("feComponentTransfer > *").forEach((channel, i) => {
      channel.setAttribute("tableValues", ramp.map((stop) => (stop[i] / 255).toFixed(4)).join(" "));
    });
    return ramp;
  }
  function setSyrupColor(station, scene, flavor) {
    const rgb = flavor.color.slice(1).match(/../g).map((v) => parseInt(v, 16));
    const ramp = applyLiquidTone(scene.querySelector("#station-liquid-color"), rgb);
    station.style.setProperty("--syrup-tint", flavor.color);
    station.style.setProperty("--syrup-shadow", `rgb(${ramp[1].map(Math.round).join(",")})`);
    station.style.setProperty("--syrup-glint", `rgb(${ramp[3].map(Math.round).join(",")})`);
    const label = scene.querySelector(".bottle-label");
    if (label) label.textContent = flavor.id === "none" ? "Syrup" : flavor.name;
    scene.dataset.flavor = flavor.id;
  }
  function paintSyrupLevel(scene, amount) {
    if (scene.dataset.amount === String(amount)) return Number(scene.dataset.surface);
    const glass = SYRUP_GLASS[scene.dataset.glass];
    const levels = glass.levels[scene.dataset.recipe];
    const n = Math.floor(amount), next = Math.min(n + 1, MAX_SYRUP_PUMPS);
    const y = levels[n] + (levels[next] - levels[n]) * (amount - n);
    scene.dataset.amount = String(amount);
    scene.dataset.surface = String(y);
    const syrup = scene.querySelector(".station-syrup");
    syrup.setAttribute("opacity", 0.89 * Math.min(1, amount / 0.55));
    if (amount) shapeGlassFill(
      glass.rings,
      levels[0],
      y,
      scene.querySelector(".station-outline"),
      scene.querySelector(".station-cap"),
      scene.querySelector("#station-depth")
    );
    return y;
  }
  function shapeGlassFill(rings, bottom, y, outlineNode, cap, absorption) {
    function radius(at) {
      const pos = (rings[0][0] - at) / (rings[0][0] - rings[rings.length - 1][0]) * (rings.length - 1);
      const i = Math.floor(pos);
      return rings[i][1] + (rings[i + 1][1] - rings[i][1]) * (pos - i);
    }
    const cx = 92, depth = 0.225;
    const rb = radius(bottom), rt = radius(y);
    const side = rings.filter(([row]) => row > y && row < bottom);
    const right = side.slice().reverse().map(([row, r]) => `L${cx + r} ${row}`).join("");
    const left = side.map(([row, r]) => `L${cx - r} ${row}`).join("");
    const outline = `M${cx - rt} ${y}A${rt} ${rt * depth} 0 0 1 ${cx + rt} ${y}${right}L${cx + rb} ${bottom}A${rb} ${rb * depth} 0 0 1 ${cx - rb} ${bottom}${left}Z`;
    outlineNode.setAttribute("d", outline);
    cap.setAttribute("transform", `translate(${cx} ${y}) scale(${rt} ${rt * depth})`);
    absorption.setAttribute("y1", y + rt * depth);
    absorption.setAttribute("y2", bottom + rb * depth);
    return outline;
  }
  function restDispenser(scene) {
    scene.querySelector(".station-head").removeAttribute("transform");
    scene.querySelector(".station-thread").setAttribute("height", 0);
    scene.querySelector(".station-ripple").setAttribute("opacity", 0);
  }
  function updateSyrupStation(resetPhoto = false) {
    const station = app.querySelector(".syrup-station");
    const scene = station.querySelector(".station-photo");
    const flavor = SYRUPS.find((item) => item.id === draft.syrup);
    const none = flavor.id === "none";
    const full = draft.pumps === MAX_SYRUP_PUMPS;
    if (scene.dataset.flavor !== flavor.id) setSyrupColor(station, scene, flavor);
    for (const option of station.querySelectorAll('[data-action="syrup"]')) {
      option.setAttribute("aria-pressed", String(option.dataset.value === flavor.id));
    }
    station.querySelector('[data-action="pump-up"]').setAttribute("aria-disabled", String(none || full));
    station.querySelector('[data-action="pump-down"]').setAttribute("aria-disabled", String(!draft.pumps));
    const counter = station.querySelector(".dose-count"), text = `${draft.pumps} of ${MAX_SYRUP_PUMPS} pumps`;
    if (counter.textContent !== text) counter.textContent = text;
    if (resetPhoto) {
      scene.dataset.motion = "idle";
      restDispenser(scene);
      paintSyrupLevel(scene, draft.pumps);
    }
  }
  function animateSyrup(scene) {
    const from = Number(scene.dataset.amount), pouring = draft.pumps > from;
    const goal = pouring ? Math.min(draft.pumps, Math.floor(from) + 1) : draft.pumps;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    restDispenser(scene);
    if (reduced.matches || goal === from) {
      updateSyrupStation(true);
      return;
    }
    scene.dataset.motion = pouring ? "pour" : "lower";
    scene.dataset.goal = String(goal);
    const head = scene.querySelector(".station-head"), thread = scene.querySelector(".station-thread");
    const ripple = scene.querySelector(".station-ripple");
    const ease = (t, start, end) => {
      const u = Math.max(0, Math.min(1, (t - start) / (end - start)));
      return u * u * (3 - 2 * u);
    };
    const started = performance.now();
    function frame(now) {
      if (reduced.matches) {
        syrupFrame = 0;
        updateSyrupStation(true);
        return;
      }
      const t = Math.min(1, Math.max(0, (now - started) / (pouring ? 680 : 260)));
      const progress = pouring ? ease(t, 0.4, 0.81) : ease(t, 0, 1);
      const surface = paintSyrupLevel(scene, progress === 1 ? goal : from + (goal - from) * progress);
      if (pouring) {
        const travel = PUMP_OUTLET.travel * ease(t, 0, 0.25) * (1 - ease(t, 0.56, 0.87));
        const tip = PUMP_OUTLET.y + travel;
        const leading = tip + (surface - tip) * ease(t, 0.12, 0.4);
        const trailing = tip + (surface - tip) * ease(t, 0.6, 0.81);
        head.setAttribute("transform", `translate(0 ${travel})`);
        thread.setAttribute("y", trailing);
        thread.setAttribute("height", Math.max(0, leading - trailing));
        const wave = ease(t, 0.4, 0.93);
        ripple.setAttribute("cy", surface);
        ripple.setAttribute("rx", 2 + 9 * wave);
        ripple.setAttribute("ry", 0.65 + 2.5 * wave);
        ripple.setAttribute("opacity", t < 0.4 ? 0 : 0.64 * (1 - wave));
      }
      if (t < 1) syrupFrame = requestAnimationFrame(frame);
      else {
        syrupFrame = 0;
        if (draft.pumps !== goal) animateSyrup(scene);
        else updateSyrupStation(true);
      }
    }
    syrupFrame = requestAnimationFrame(frame);
  }
  function adjustSyrup(delta) {
    const count = draft.pumps + delta;
    if (draft.syrup === "none" || count < 0 || count > MAX_SYRUP_PUMPS) return;
    draft.pumps = count;
    updateSyrupStation();
    const scene = app.querySelector(".station-photo");
    if (syrupFrame && scene.dataset.motion === "pour" && count >= Number(scene.dataset.goal)) return;
    cancelSyrupStroke();
    animateSyrup(scene);
  }
  function cancelMilkPour() {
    cancelAnimationFrame(milkFrame);
    milkFrame = 0;
  }
  function poseMilkPackage(scene, pack, lift, tilt, returning = false) {
    const { steps, columns } = MILK_STUDIO, { width, height, lip, foot } = pack;
    const angle = Math.round((steps - 1) * tilt);
    const frame = returning && pack.frames > steps ? 2 * (steps - 1) - angle : angle;
    const restX = 206 + lip[0] - foot[0], restY = 268 + lip[1] - foot[1];
    const x = restX + (101 - restX) * lift, y = restY + (94 - restY) * lift;
    const pose = scene.querySelector(".milk-pose");
    if (pose.dataset.frame !== String(frame)) {
      pose.setAttribute("viewBox", `${frame % columns * width} ${Math.floor(frame / columns) * height} ${width} ${height}`);
      pose.dataset.frame = String(frame);
    }
    scene.querySelector(".milk-package").setAttribute("transform", `translate(${x - lip[0]} ${y - lip[1]})`);
    scene.querySelector(".milk-package-shadow").setAttribute("opacity", 1 - 0.86 * lift);
    return { x, y };
  }
  function mixRamp(t, from, to) {
    const v = Math.max(0, Math.min(1, (t - from) / (to - from)));
    return v * v * (3 - 2 * v);
  }
  function paintMilkLevel(scene, milk, fraction, mixing) {
    if (scene.dataset.filled === String(fraction) && scene.dataset.mixing === String(mixing) && scene.dataset.milk === (milk?.id || "")) {
      return Number(scene.dataset.milkSurface);
    }
    const glass = SYRUP_GLASS[scene.dataset.glass], rings = glass.rings;
    const start = Number(scene.dataset.surface), full = rings[rings.length - 1][0] + 5;
    const y = start + (full - start) * fraction;
    const blend = scene.querySelector(".milk-blend");
    scene.dataset.milkSurface = String(y);
    scene.dataset.milk = milk?.id || "";
    scene.dataset.filled = String(fraction);
    scene.dataset.mixing = String(mixing);
    blend.setAttribute("opacity", fraction ? 1 : 0);
    const outline = scene.querySelector(".milk-outline"), cap = scene.querySelector(".milk-cap");
    const depth = scene.querySelector("#milk-depth"), hold = scene.querySelector(".milk-recipe-hold");
    if (!hold.hasAttribute("d")) {
      hold.setAttribute("d", shapeGlassFill(rings, rings[0][0], start, outline, cap, depth));
      const boundary = scene.querySelector("#milk-hold-depth");
      boundary.setAttribute("y1", start - 7);
      boundary.setAttribute("y2", start + 13);
    }
    if (!fraction) return y;
    shapeGlassFill(rings, rings[0][0], y, outline, cap, depth);
    hold.setAttribute("opacity", 1 - mixRamp(mixing, 0.27, 0.89));
    scene.querySelector(".milk-old-surface").setAttribute("stop-opacity", 1 - mixRamp(fraction, 0.07, 0.42));
    const rise = start - y, spread = scene.querySelector(".milk-spread");
    spread.setAttribute("transform", `translate(94 ${y + rise * 0.13}) scale(${4 + 83 * mixRamp(mixing, 0, 0.23)} ${3 + rise * 1.2})`);
    spread.setAttribute("opacity", 0.94 * mixRamp(mixing, 0, 0.13) * (1 - mixRamp(mixing, 0.34, 0.83)));
    const mocha = scene.dataset.recipe === "Mocha";
    const coffee = mocha ? [78, 46, 33] : [94, 58, 36];
    const finish2 = { dairy: [200, 164, 123], oat: [191, 146, 96], soy: [193, 157, 119] }[milk.id];
    const mixed = 0.23 + 0.77 * mixRamp(mixing, 0.13, 0.88);
    const syrupShare = draft.pumps / MAX_SYRUP_PUMPS * 0.26;
    const syrup = SYRUPS.find((f) => f.id === draft.syrup).color.slice(1).match(/../g).map((s) => parseInt(s, 16));
    applyLiquidTone(scene.querySelector("#milk-tone"), coffee.map((v, i2) => {
      const milky = finish2[i2] - (mocha ? 27 : 0);
      const tint = milky + (0.8 * syrup[i2] - milky) * syrupShare;
      return v + (tint - v) * mixed;
    }));
    const { count, columns, width, height } = MILK_STUDIO.flow;
    const frame = mixing * (count - 1), i = Math.floor(frame);
    scene.querySelector(".milk-field-space").setAttribute("transform", `translate(94 ${y}) scale(48 ${rings[0][0] + 8 - y})`);
    const view = (n) => `${n % columns * width} ${Math.floor(n / columns) * height} ${width} ${height}`;
    scene.querySelector(".milk-field-a").setAttribute("viewBox", view(i));
    const next = scene.querySelector(".milk-field-b");
    next.setAttribute("viewBox", view(Math.min(count - 1, i + 1)));
    next.setAttribute("opacity", frame - i);
    return y;
  }
  function paintMilkStream(scene, lip, surface, lead, tail, wave) {
    const jet = scene.querySelector(".milk-jet"), ripple = scene.querySelector(".milk-ripple");
    if (lead <= tail) jet.removeAttribute("d");
    else {
      const left = [], right = [];
      for (let i = 0; i <= 6; i++) {
        const f = tail + (lead - tail) * i / 6, x = 94 + (lip.x - 94) * (1 - f) ** 2;
        const y = lip.y + (surface - lip.y) * f, r = 1.55 + 1.1 * (1 - f);
        left.push(`${x - r} ${y}`);
        right.unshift(`${x + r} ${y}`);
      }
      jet.setAttribute("d", `M${left.concat(right).join("L")}Z`);
    }
    ripple.setAttribute("cx", 94);
    ripple.setAttribute("cy", surface);
    ripple.setAttribute("rx", 4 + 4 * wave);
    ripple.setAttribute("ry", 0.9 + 0.9 * wave);
    ripple.setAttribute("opacity", lead === 1 && tail < 1 ? 0.55 * (1 - tail) : 0);
  }
  function showMilkStation(animate = false) {
    cancelMilkPour();
    const station = app.querySelector(".milk-station"), scene = station.querySelector(".milk-photo");
    const milk = MILKS.find((m) => m.id === draft.milk);
    setSyrupColor(station, scene, SYRUPS.find((s) => s.id === draft.syrup));
    paintSyrupLevel(scene, draft.pumps);
    for (const option of station.querySelectorAll('[data-action="milk"]')) {
      option.setAttribute("aria-pressed", String(option.dataset.value === draft.milk));
    }
    app.querySelector('.milk-step [data-action="submit-order"]').disabled = !milk || Boolean(storageError);
    const pack = milk ? MILK_STUDIO.packs[milk.id] : null;
    scene.querySelector(".milk-lineup").style.display = milk ? "none" : "";
    scene.querySelector(".milk-package").style.display = milk ? "" : "none";
    scene.querySelector(".milk-package-shadow").setAttribute("rx", pack ? pack.shadow : 0);
    if (milk) {
      const pose = scene.querySelector(".milk-pose");
      pose.setAttribute("width", pack.width);
      pose.setAttribute("height", pack.height);
      pose.removeAttribute("data-frame");
      pose.querySelector("use").setAttribute("href", `#milk-photo-${milk.id}`);
      station.style.setProperty("--milk-color", milk.color);
      applyLiquidTone(scene.querySelector("#milk-fresh-tone"), milk.color.slice(1).match(/../g).map((c) => parseInt(c, 16) * 0.82 + 255 * 0.18));
    }
    const status = station.querySelector(".milk-status");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    function rest(fraction) {
      const y = paintMilkLevel(scene, milk, fraction, fraction);
      if (pack) {
        const lip = poseMilkPackage(scene, pack, 0, 0, fraction === 1);
        paintMilkStream(scene, lip, y, 0, 0, 0);
      }
    }
    function finish2() {
      milkFrame = 0;
      rest(milk ? 1 : 0);
      scene.dataset.motion = "idle";
      status.textContent = milk ? `${milk.name} added.` : "No milk selected.";
    }
    if (!animate || !milk || reduced.matches) {
      finish2();
      return;
    }
    rest(0);
    scene.dataset.motion = "pour";
    status.textContent = `Pouring ${milk.name.toLowerCase()}\u2026`;
    const start = performance.now(), pourMs = 2100, settleMs = 900;
    const contactMs = pourMs * 0.35;
    function frame(now) {
      const elapsed = Math.max(0, now - start);
      if (elapsed >= pourMs + settleMs || reduced.matches) {
        finish2();
        return;
      }
      const t = Math.min(1, elapsed / pourMs);
      const ease = (a, b) => mixRamp(t, a, b);
      const mixing = Math.max(0, (elapsed - contactMs) / (pourMs + settleMs - contactMs));
      const lip = poseMilkPackage(scene, pack, ease(0, 0.3) * (1 - ease(0.76, 1)), ease(0.06, 0.36) * (1 - ease(0.74, 0.94)), t >= 0.74);
      const y = paintMilkLevel(scene, milk, ease(0.35, 0.82), mixing);
      paintMilkStream(scene, lip, y, ease(0.25, 0.35), ease(0.75, 0.82), 0.5 + 0.5 * Math.sin(t * 42));
      if (t >= 0.82 && scene.dataset.motion === "pour") {
        scene.dataset.motion = "settling";
        status.textContent = `${milk.name} added.`;
      }
      milkFrame = requestAnimationFrame(frame);
    }
    milkFrame = requestAnimationFrame(frame);
  }
  function beginOrder(customer = false) {
    forCustomer = customer;
    draft = newDraft();
    if (!customer && account?.firstName && account?.lastName) {
      draft.firstName = account.firstName;
      draft.lastName = account.lastName;
      go("temperature");
    } else go("name");
  }
  function submitOrder() {
    if (!["drink", "milk"].includes(screen)) return;
    let created;
    try {
      const saved = mutateOrders((latest) => {
        created = createOrder(draft, latest);
        return [...latest, created];
      });
      if (!saved) return;
    } catch (error) {
      console.error("Order validation failed:", error);
      toast(error.message, true);
      return;
    }
    trackedId = created.id;
    if (!forCustomer) ownIds.push(created.id);
    go("status");
    toast(`Order #${created.number} received.`);
  }
  function finish(ids) {
    const eligible = new Set(milkQueue(orders, filter).map((order) => order.id));
    const validIds = ids.filter((id) => eligible.has(id));
    if (!validIds.length) return;
    if (!mutateOrders((latest) => finishMilk(latest, validIds))) return;
    selected.clear();
    render();
    toast(`Milk prepared for ${validIds.length} order${validIds.length === 1 ? "" : "s"}.`);
  }
  var counterRoot, roleChooserArt, counterSkin, demoSkin, entryPalette, restartCounter, STORAGE_KEY, app, storageError, orders, screen, account, role, forCustomer, draft, filter, selected, trackedId, ownIds, milkFrame, syrupFrame, toastTimer, PUMP_OUTLET, actions, pointerStart, demoEntry;
  var init_app = __esm({
    "play/app.js"() {
      init_domain();
      init_art();
      counterRoot = document.querySelector("#login-counter");
      roleChooserArt = document.querySelector("#role-chooser-art").content;
      counterSkin = document.querySelector("#counter-skin");
      demoSkin = document.querySelector("#demo-skin");
      entryPalette = document.querySelector("#entry-palette");
      restartCounter = setupCounter();
      STORAGE_KEY = "corner-cafe-orders-v1";
      app = document.querySelector("#app");
      storageError = "";
      orders = readOrders();
      screen = "welcome";
      account = null;
      role = null;
      forCustomer = false;
      draft = newDraft();
      filter = "both";
      selected = /* @__PURE__ */ new Set();
      trackedId = null;
      ownIds = [];
      milkFrame = 0;
      syrupFrame = 0;
      PUMP_OUTLET = { x: 95.8, y: 44.4, travel: 12 };
      actions = {
        brand: () => go(account ? "audience" : "welcome"),
        guest: () => {
          account = { type: "guest" };
          role = null;
          go("audience");
        },
        church: () => {
          account = { type: "church", firstName: "Grace", lastName: "Chang" };
          role = null;
          go("audience");
          toast("Demo account connected. No real Church Center sign-in.");
        },
        "sign-out": () => {
          account = null;
          role = null;
          ownIds = [];
          trackedId = null;
          forCustomer = false;
          draft = newDraft();
          go("welcome");
        },
        audience: () => {
          if (account) {
            role = null;
            forCustomer = false;
            go("audience");
          }
        },
        drinker: () => {
          role = "drinker";
          beginOrder();
        },
        roles: () => {
          if (account) {
            role = "team";
            forCustomer = false;
            go("roles");
          }
        },
        "order-taker": () => {
          if (account) {
            role = "order-taker";
            forCustomer = false;
            go("order-taker");
          }
        },
        steamer: () => {
          if (account) {
            role = "steamer";
            forCustomer = false;
            go("steam-filter");
          }
        },
        mixer: () => {
          if (account) {
            role = "mixer";
            forCustomer = false;
            go("mixer");
          }
        },
        labels: () => {
          if (account) go("labels");
        },
        "customer-order": () => {
          if (account) {
            role = "order-taker";
            beginOrder(true);
          }
        },
        "new-order": () => {
          if (account) {
            role = "drinker";
            beginOrder();
          } else actions.guest();
        },
        "my-orders": () => go("my-orders"),
        back: (value) => go(value),
        temperature: (value) => {
          draft.temperature = value;
          render();
        },
        drink: (value) => {
          draft.drink = value;
          render();
        },
        syrup: (value) => {
          if (value === draft.syrup) return;
          cancelSyrupStroke();
          draft.syrup = value;
          draft.pumps = 0;
          updateSyrupStation(true);
        },
        "pump-up": () => adjustSyrup(1),
        "pump-down": () => adjustSyrup(-1),
        milk: (value) => {
          if (draft.milk === value) return;
          draft.milk = value;
          showMilkStation(true);
        },
        next: () => {
          if (screen === "temperature" && draft.temperature) go("drink");
          else if (screen === "drink" && draft.drink) go("syrup");
          else if (screen === "syrup") go("milk");
        },
        "submit-order": submitOrder,
        "milk-filter": (value) => {
          filter = value;
          go("steam-queue");
        },
        "queue-filter": (value) => {
          filter = value;
          selected.clear();
          render();
        },
        "select-all": () => {
          const list = visibleOrders();
          const all = list.every((order) => selected.has(order.id));
          selected = new Set(all ? [] : list.map((order) => order.id));
          render();
        },
        "finish-one": (value) => finish([value]),
        "finish-selected": () => finish([...selected]),
        "ready-selected": () => {
          const count = selected.size;
          if (!mutateOrders((latest) => markReady(latest, [...selected]))) return;
          selected.clear();
          render();
          toast(`${count} ${count === 1 ? "order is" : "orders are"} ready for pickup.`);
        },
        "simulate-ready": () => {
          if (!mutateOrders((latest) => markReady(latest, [trackedId]))) return;
          render();
          toast("Order marked ready in this demo.");
        },
        track: (value) => {
          trackedId = value;
          forCustomer = false;
          go("status");
        },
        seed: () => {
          if (!mutateOrders((latest) => {
            const max = Math.max(100, ...latest.map((order) => order.number));
            return [...latest, ...seedOrders().map((order, index) => ({ ...order, number: max + index + 1 }))];
          })) return;
          render();
          toast("4 demo orders added.");
        },
        "print-selected": () => {
          const labels = orders.filter((order) => selected.has(order.id));
          if (!labels.length) return;
          document.querySelector("#print-area").innerHTML = labels.map((order) => {
            const recipe = orderRecipe(order);
            return `<section class="print-label"><header>Corner Cafe <strong>#${order.number}</strong></header><h2>${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)}</h2><p><strong>${escapeHtml(recipe.drink)}</strong></p>${recipeRows(recipe)}</section>`;
          }).join("");
          window.print();
        }
      };
      app.addEventListener("click", (event) => {
        const element = event.target.closest("[data-action]");
        if (!element || element.disabled || element.getAttribute("aria-disabled") === "true") return;
        event.preventDefault();
        const action = actions[element.dataset.action];
        if (!action) return;
        action(element.dataset.value);
        if (["temperature", "drink", "milk", "queue-filter", "select-all"].includes(element.dataset.action)) {
          const candidates = app.querySelectorAll(`[data-action="${element.dataset.action}"]`);
          [...candidates].find((candidate) => candidate.dataset.value === element.dataset.value)?.focus({ preventScroll: true });
        }
      });
      app.addEventListener("keydown", (event) => {
        if (event.repeat && (event.key === "Enter" || event.key === " ") && event.target.closest('[data-action="pump-up"]')) event.preventDefault();
      });
      app.addEventListener("submit", (event) => {
        if (event.target.id !== "name-form") return;
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);
        const firstName = String(data.get("firstName")).trim();
        const lastName = String(data.get("lastName")).trim();
        if (!firstName || !lastName) {
          toast("Please enter both a first and last name.", true);
          form.querySelector(`[name="${!firstName ? "firstName" : "lastName"}"]`).focus();
          return;
        }
        draft.firstName = firstName;
        draft.lastName = lastName;
        if (!forCustomer) Object.assign(account, { firstName, lastName });
        go("temperature");
      });
      app.addEventListener("change", (event) => {
        if (!event.target.matches("[data-select]")) return;
        const id = event.target.dataset.select;
        event.target.checked ? selected.add(id) : selected.delete(id);
        render();
        app.querySelector(`[data-select="${id}"]`)?.focus({ preventScroll: true });
      });
      pointerStart = null;
      app.addEventListener("pointerdown", (event) => {
        const card = event.target.closest("[data-swipe]");
        if (card && !event.target.closest("button, input, label")) pointerStart = { id: card.dataset.orderId, x: event.clientX, y: event.clientY };
      });
      app.addEventListener("pointerup", (event) => {
        if (pointerStart && event.clientX - pointerStart.x > 70 && Math.abs(event.clientY - pointerStart.y) < 65) finish([pointerStart.id]);
        pointerStart = null;
      });
      app.addEventListener("pointercancel", () => {
        pointerStart = null;
      });
      window.addEventListener("afterprint", () => {
        document.querySelector("#print-area").innerHTML = "";
      });
      window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY && event.key !== null) return;
        const wasReady = orders.find((order) => order.id === trackedId)?.status === "ready";
        orders = readOrders();
        const eligibleIds = new Set(visibleOrders().map((order) => order.id));
        selected = new Set([...selected].filter((id) => eligibleIds.has(id)));
        if (["status", "mixer", "labels", "steam-queue", "order-taker", "roles", "my-orders"].includes(screen) || storageError) render();
        const tracked = orders.find((order) => order.id === trackedId);
        if (!wasReady && tracked?.status === "ready") toast(`Order #${tracked.number} is ready for pickup.`);
      });
      demoEntry = new URLSearchParams(window.location.search).get("demo");
      if (demoEntry === "drinker") {
        account = { type: "guest" };
        role = "drinker";
        beginOrder();
      } else if (demoEntry === "team") {
        account = { type: "guest", firstName: "Volunteer" };
        role = "team";
        if (!orders.length && !storageError) {
          mutateOrders((latest) => latest.length ? latest : seedOrders());
        }
        go("roles");
      } else {
        render();
      }
    }
  });

  // play/entry.js
  function report(type, message = "") {
    if (window.parent !== window) {
      window.parent.postMessage({ type, message }, "*");
    }
  }
  Promise.resolve().then(() => (init_app(), app_exports)).then(() => {
    if (!document.querySelector("#app h1")) {
      throw new Error("The cafe did not render its first screen.");
    }
    report("corner-cafe-ready");
  }).catch((error) => {
    console.error("Corner Cafe startup failed:", error);
    const panel = document.createElement("section");
    panel.style.cssText = "max-width:520px;margin:60px auto;padding:28px;font:16px/1.7 system-ui;color:var(--ink);background:var(--paper);border:1px solid var(--card-edge);border-radius:16px";
    panel.setAttribute("role", "alert");
    const heading = document.createElement("h1");
    heading.textContent = "The cafe could not open.";
    const detail = document.createElement("p");
    detail.textContent = error instanceof Error ? error.message : String(error);
    const help = document.createElement("p");
    help.textContent = "Reload this page. If you opened a downloaded HTML file, try the portfolio\u2019s HTTP preview instead.";
    panel.append(heading, detail, help);
    document.querySelector("#app").replaceChildren(panel);
    report("corner-cafe-error", detail.textContent);
  });
})();
