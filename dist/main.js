"use strict";
(() => {
  // src/platform.ts
  var tv = window;
  function describeError(error) {
    if (error instanceof Error) return error.name + ": " + error.message;
    try {
      if (error && typeof error === "object") {
        const value = error;
        if (value.name || value.message)
          return [value.name, value.message, value.code].filter((item) => item !== void 0).map(String).join(": ");
      }
      return typeof error === "string" ? error : JSON.stringify(error) || String(error);
    } catch {
      return "[errore non serializzabile]";
    }
  }
  function inspectAvplay(host) {
    var _a;
    try {
      const candidate = (_a = host.webapis) == null ? void 0 : _a.avplay;
      if (!candidate) return { api: null, result: "assente" };
      const methods = [
        "getState",
        "open",
        "setDisplayRect",
        "setListener",
        "prepareAsync",
        "play",
        "pause",
        "stop",
        "close"
      ];
      const missing = methods.filter(
        (name) => typeof candidate[name] !== "function"
      );
      if (missing.length)
        return { api: null, result: "incompleta: " + missing.join(", ") };
      const state = candidate.getState();
      return {
        api: candidate,
        result: "getState riuscito: " + state + "; riproduzione NON ancora verificata"
      };
    } catch (error) {
      return { api: null, result: "non accessibile: " + describeError(error) };
    }
  }
  var mediaKeys = [
    "MediaPlayPause",
    "MediaPlay",
    "MediaPause",
    "MediaStop",
    "MediaFastForward",
    "MediaRewind"
  ];
  function registerKeys(host) {
    return mediaKeys.map((name) => {
      var _a;
      try {
        const input = (_a = host.tizen) == null ? void 0 : _a.tvinputdevice;
        if (!input) return name + ": API assente";
        input.registerKey(name);
        return name + ": registrato";
      } catch (error) {
        return name + ": " + describeError(error);
      }
    });
  }
  function loadSamsungBridge() {
    return new Promise((resolve) => {
      if (!tv.tizen) return resolve("non tentato: window.tizen assente");
      if (tv.webapis)
        return resolve("window.webapis gi\xE0 presente; nessuno script caricato");
      const script = document.createElement("script");
      let finished = false;
      const finish = (result) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.remove();
        resolve(result);
      };
      const timer = window.setTimeout(
        () => finish("timeout bridge Samsung (5 s)"),
        5e3
      );
      script.onload = () => finish("script caricato; verificare le API sotto");
      script.onerror = () => finish("bridge Samsung non caricabile nel documento del modulo");
      script.src = "$WEBAPIS/webapis/webapis.js";
      document.head.appendChild(script);
    });
  }

  // src/probes.ts
  function probeBrowser() {
    var _a, _b, _c;
    const video = document.createElement("video");
    const namespace = (name) => {
      try {
        return String(typeof tv[name] !== "undefined");
      } catch (error) {
        return "non accessibile: " + describeError(error);
      }
    };
    const result = {
      "User Agent": navigator.userAgent,
      Lingua: navigator.language,
      Piattaforma: navigator.platform,
      Schermo: screen.width + "x" + screen.height + ", DPR " + window.devicePixelRatio,
      Viewport: window.innerWidth + "x" + window.innerHeight,
      Origine: location.origin,
      "Contesto sicuro": String(window.isSecureContext),
      "window.tizen": namespace("tizen"),
      "window.webapis": namespace("webapis"),
      AVPlay: inspectAvplay(tv).result,
      "HTML5 video": String(typeof video.play === "function"),
      MediaSource: String(typeof MediaSource !== "undefined")
    };
    const formats = [
      ["MP4 H264 baseline + AAC", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'],
      ["MP4 H264 high + AAC", 'video/mp4; codecs="avc1.640028, mp4a.40.2"'],
      ["MP4 HEVC", 'video/mp4; codecs="hvc1.1.6.L93.B0"'],
      ["WebM VP9", 'video/webm; codecs="vp9"'],
      ["HLS", "application/vnd.apple.mpegurl"]
    ];
    for (const [name, mime] of formats) {
      if (!name || !mime) continue;
      try {
        result["canPlayType " + name] = video.canPlayType(mime) || "nessun supporto dichiarato";
        result["MSE " + name] = typeof MediaSource !== "undefined" && typeof MediaSource.isTypeSupported === "function" ? String(MediaSource.isTypeSupported(mime)) : "API assente";
      } catch (error) {
        result["Codec " + name] = describeError(error);
      }
    }
    try {
      result["Versione Tizen dichiarata"] = String(
        (_c = (_b = (_a = tv.tizen) == null ? void 0 : _a.systeminfo) == null ? void 0 : _b.getCapability(
          "http://tizen.org/feature/platform.version"
        )) != null ? _c : "API assente"
      );
    } catch (error) {
      result["Versione Tizen dichiarata"] = describeError(error);
    }
    return result;
  }
  function probeLocalStorage(storage2) {
    const key = "streamflixbrew.probe." + Date.now() + "." + Math.random();
    try {
      storage2.setItem(key, "probe");
      if (storage2.getItem(key) !== "probe")
        throw new Error("lettura diversa dalla scrittura");
      return "scrittura / lettura / rimozione riuscite (non prova durata dopo riavvio)";
    } finally {
      storage2.removeItem(key);
    }
  }
  function probeIndexedDB(factory, timeoutMs = 5e3) {
    return new Promise((resolve) => {
      const name = "streamflixbrew-probe-" + Date.now() + "-" + Math.random();
      let finished = false;
      let database = null;
      let transaction = null;
      let timedOut = false;
      const remove = () => {
        database == null ? void 0 : database.close();
        const deletion = factory.deleteDatabase(name);
        deletion.onsuccess = () => finish("transazione scrittura / lettura / cancellazione DB riuscite");
        deletion.onerror = () => finish("lettura riuscita; rimozione DB fallita");
        deletion.onblocked = () => finish("lettura riuscita; rimozione DB bloccata");
      };
      const finish = (result) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(result);
      };
      const timer = window.setTimeout(() => {
        timedOut = true;
        try {
          transaction == null ? void 0 : transaction.abort();
        } catch {
        }
        database == null ? void 0 : database.close();
        finish("timeout IndexedDB; risultato non confermato");
      }, timeoutMs);
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("probe");
      request.onerror = () => finish("apertura fallita: " + describeError(request.error));
      request.onblocked = () => finish("apertura bloccata");
      request.onsuccess = () => {
        database = request.result;
        if (finished || timedOut) {
          remove();
          return;
        }
        try {
          transaction = database.transaction("probe", "readwrite");
          const store = transaction.objectStore("probe");
          store.put("ok", "key");
          const read = store.get("key");
          let matched = false;
          read.onsuccess = () => {
            matched = read.result === "ok";
          };
          transaction.oncomplete = () => {
            if (!matched) {
              database == null ? void 0 : database.close();
              finish("lettura non corrispondente");
              return;
            }
            remove();
          };
          transaction.onabort = () => {
            database == null ? void 0 : database.close();
            finish("transazione abortita");
          };
          transaction.onerror = () => {
            database == null ? void 0 : database.close();
            finish("transazione fallita");
          };
        } catch (error) {
          database.close();
          finish(describeError(error));
        }
      };
    });
  }
  async function probeStorage() {
    const result = {};
    try {
      result.localStorage = probeLocalStorage(window.localStorage);
    } catch (error) {
      result.localStorage = "non utilizzabile: " + describeError(error);
    }
    try {
      result.IndexedDB = window.indexedDB ? await probeIndexedDB(window.indexedDB) : "API assente";
    } catch (error) {
      result.IndexedDB = "non utilizzabile: " + describeError(error);
    }
    return result;
  }

  // src/navigation.ts
  function keyAction(key, code) {
    const names = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      Enter: "enter",
      Escape: "back",
      Back: "back",
      GoBack: "back",
      BrowserBack: "back",
      MediaPlay: "play",
      MediaPause: "pause",
      MediaPlayPause: "toggle",
      MediaStop: "stop",
      MediaFastForward: "forward",
      MediaRewind: "rewind",
      " ": "toggle"
    };
    const codes = {
      38: "up",
      40: "down",
      37: "left",
      39: "right",
      13: "enter",
      27: "back",
      10009: "back",
      415: "play",
      19: "pause",
      10252: "toggle",
      413: "stop",
      417: "forward",
      412: "rewind"
    };
    return names[key] || codes[code] || "unknown";
  }
  function moveFocus(index, action, enabled) {
    const delta = action === "up" ? -2 : action === "down" ? 2 : action === "left" ? -1 : action === "right" ? 1 : 0;
    if (!delta) return index;
    let next = index + delta;
    while (next >= 0 && next < enabled.length) {
      if ((action === "left" || action === "right") && Math.floor(next / 2) !== Math.floor(index / 2))
        break;
      if (enabled[next]) return next;
      next += delta;
    }
    return index;
  }

  // src/report.ts
  function makeReport(build, findings2, keys2, errors2, events2) {
    return [
      "STREAMFLIXBREW P01.1 | " + build,
      "Rilevato: " + (/* @__PURE__ */ new Date()).toISOString(),
      "Compatibilit\xE0 TV: DA CONFERMARE con prova reale",
      ...Object.entries(findings2).map(([name, value]) => name + ": " + value),
      "TASTI (ultimi 12):",
      ...keys2.slice(-12),
      "ERRORI (ultimi 12):",
      ...errors2.length ? errors2.slice(-12) : ["nessuno rilevato"],
      "EVENTI (ultimi 16):",
      ...events2.slice(-16),
      "DATI MANUALI: modello TV / firmware / TizenBrew / audio udibile s\xEC-no",
      "canPlayType e MSE dichiarano capacit\xE0, non certificano il playback.",
      "Storage: prova di sessione; persistenza dopo riavvio non verificata."
    ].join("\n");
  }
  function reportPages(report2, width = 70, linesPerPage = 13) {
    const lines = [];
    for (const line of report2.split("\n")) {
      if (!line) lines.push("");
      for (let i = 0; i < line.length; i += width)
        lines.push(line.slice(i, i + width));
    }
    const pages2 = [];
    for (let i = 0; i < lines.length; i += linesPerPage)
      pages2.push(lines.slice(i, i + linesPerPage).join("\n"));
    return pages2.length ? pages2 : [""];
  }

  // src/playback.ts
  var Playback = class {
    constructor(video, surface2, event, finding) {
      this.video = video;
      this.surface = surface2;
      this.event = event;
      this.finding = finding;
      this.generation = 0;
      this.av = null;
      this.timer = 0;
      this.progressed = false;
      this.htmlPlaying = false;
      this.pending = false;
      this.mode = null;
      video.addEventListener("playing", () => {
        if (this.mode === "html5") {
          this.htmlPlaying = true;
          this.event("HTML5: playing");
        }
      });
      video.addEventListener("timeupdate", () => {
        if (this.mode !== "html5" || !this.htmlPlaying || this.progressed || video.currentTime < 0.1)
          return;
        this.progressed = true;
        this.pending = false;
        clearTimeout(this.timer);
        this.finding(
          "Test HTML5",
          "playing + timeline avanzata; confermare immagine/audio"
        );
      });
      for (const name of [
        "pause",
        "ended",
        "waiting",
        "stalled",
        "loadedmetadata"
      ]) {
        video.addEventListener(name, () => {
          if (this.mode === "html5") this.event("HTML5: " + name);
        });
      }
      video.addEventListener("error", () => {
        var _a, _b;
        if (this.mode !== "html5") return;
        this.pending = false;
        this.finding(
          "Test HTML5",
          "MediaError " + ((_a = video.error) == null ? void 0 : _a.code) + ": " + (((_b = video.error) == null ? void 0 : _b.message) || "senza dettaglio")
        );
        clearTimeout(this.timer);
      });
    }
    async startHtml(url) {
      this.stop();
      const generation = this.generation;
      this.mode = "html5";
      this.pending = true;
      this.video.hidden = false;
      this.surface.hidden = false;
      this.finding("Test HTML5", "avvio richiesto");
      this.video.src = url;
      this.timer = window.setTimeout(() => {
        if (generation === this.generation && !this.progressed) {
          this.pending = false;
          this.finding(
            "Test HTML5",
            "nessun avanzamento entro 15 s; Stop per annullare"
          );
        }
      }, 15e3);
      try {
        await this.video.play();
      } catch (error) {
        if (generation !== this.generation) return;
        clearTimeout(this.timer);
        this.pending = false;
        this.finding("Test HTML5", "play fallito: " + describeError(error));
      }
    }
    startAvplay(url) {
      this.stop();
      const inspected = inspectAvplay(tv);
      if (!inspected.api)
        throw new Error("AVPlay non accessibile: " + inspected.result);
      const api = inspected.api;
      if (api.getState() !== "NONE")
        throw new Error("AVPlay gi\xE0 occupato: " + api.getState());
      const generation = this.generation;
      this.av = api;
      this.mode = "avplay";
      this.pending = true;
      this.surface.hidden = false;
      this.video.hidden = true;
      const active = () => generation === this.generation && this.av === api;
      const failure = (error) => {
        if (!active()) return;
        this.pending = false;
        this.finding("Test AVPlay", "fallito: " + describeError(error));
        this.stop();
      };
      try {
        api.open(url);
        const rect = this.surface.getBoundingClientRect();
        api.setDisplayRect(
          Math.round(rect.left * 1920 / window.innerWidth),
          Math.round(rect.top * 1080 / window.innerHeight),
          Math.round(rect.width * 1920 / window.innerWidth),
          Math.round(rect.height * 1080 / window.innerHeight)
        );
        api.setListener({
          onerror: failure,
          onerrormsg: (code, message) => failure(code + ": " + message),
          onbufferingstart: () => {
            if (active()) this.event("AVPlay: buffering");
          },
          onbufferingcomplete: () => {
            if (active()) this.event("AVPlay: buffering completo");
          },
          onstreamcompleted: () => {
            if (active()) {
              this.event("AVPlay: fine stream");
              this.stop();
            }
          },
          oncurrentplaytime: (time) => {
            if (!active() || this.progressed || time < 100) return;
            this.progressed = true;
            this.pending = false;
            this.finding(
              "Test AVPlay",
              "timeline avanzata; confermare immagine/audio e rettangolo"
            );
          }
        });
        this.finding("Test AVPlay", "preparazione in corso");
        this.timer = window.setTimeout(
          () => failure("timeout preparazione AVPlay (15 s)"),
          15e3
        );
        api.prepareAsync(() => {
          if (!active()) return;
          clearTimeout(this.timer);
          try {
            api.play();
            this.finding(
              "Test AVPlay",
              "prepareAsync riuscito; play chiamato, attendere timeline"
            );
            this.event("AVPlay: stato " + api.getState());
          } catch (error) {
            failure(error);
          }
        }, failure);
      } catch (error) {
        failure(error);
      }
    }
    async control(action) {
      if (this.mode === "html5") {
        const pause = action === "pause" || action === "toggle" && !this.video.paused;
        if (pause) this.video.pause();
        else await this.video.play();
        this.event("HTML5 comando: " + (pause ? "pausa" : "riprendi"));
      } else if (this.av) {
        const state = this.av.getState();
        if (state !== "PLAYING" && state !== "PAUSED")
          throw new Error("AVPlay non pronto: " + state);
        const pause = action === "pause" || action === "toggle" && state === "PLAYING";
        if (pause && state === "PLAYING") this.av.pause();
        if (!pause && state === "PAUSED") this.av.play();
        this.event(
          "AVPlay comando: " + (pause ? "pausa" : "riprendi") + ", stato " + this.av.getState()
        );
      } else this.event("Nessun player attivo");
    }
    stop() {
      this.generation += 1;
      clearTimeout(this.timer);
      const oldMode = this.mode;
      const interrupted = this.pending;
      this.pending = false;
      this.mode = null;
      this.htmlPlaying = false;
      this.progressed = false;
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.load();
      this.video.hidden = true;
      this.surface.hidden = true;
      const api = this.av;
      this.av = null;
      if (api) {
        try {
          const state = api.getState();
          if (state === "PLAYING" || state === "PAUSED" || state === "READY")
            api.stop();
        } catch (error) {
          this.event("AVPlay stop: " + describeError(error));
        } finally {
          try {
            api.close();
          } catch (error) {
            this.event("AVPlay close: " + describeError(error));
          }
        }
      }
      if (oldMode && interrupted)
        this.finding(
          oldMode === "html5" ? "Test HTML5" : "Test AVPlay",
          "interrotto prima di osservare avanzamento timeline"
        );
      if (oldMode) this.event(oldMode + ": risorse rilasciate");
    }
  };

  // src/main.ts
  function element(id) {
    const value = document.getElementById(id);
    if (!value) throw new Error("Elemento mancante: " + id);
    return value;
  }
  var details = element("details");
  var title = element("panel-title");
  var status = element("status");
  var surface = element("player-surface");
  var panel = surface.parentElement;
  var buttons = Array.from(
    document.querySelectorAll("nav button")
  );
  var findings = {
    ...probeBrowser(),
    "Test HTML5": "non eseguito",
    "Test AVPlay": "non eseguito"
  };
  var errors = (tv.__probeErrors || []).slice();
  var keys = [];
  var events = registerKeys(tv);
  var focus = 0;
  var originFocus = 0;
  var page = 0;
  var pages = [""];
  var view = "summary";
  var frozenReport = "";
  var storageBusy = false;
  var bridgeBusy = false;
  var player;
  function log(message) {
    panel.classList.toggle("playing", (player == null ? void 0 : player.mode) != null);
    document.documentElement.classList.toggle(
      "avplay-active",
      (player == null ? void 0 : player.mode) === "avplay"
    );
    element("av-object").hidden = (player == null ? void 0 : player.mode) !== "avplay";
    events.push(message);
    if (events.length > 40) events.shift();
    status.textContent = message;
    if (view === "logs") renderLogs();
  }
  tv.__probeOnError = (message) => {
    errors.push(message);
    if (errors.length > 40) errors.shift();
    log("Errore JavaScript: " + message);
  };
  function report() {
    return makeReport("0.1.1+cb1ad32e8caa", findings, keys, errors, events);
  }
  function showPages(heading, content, reset = true) {
    title.textContent = heading;
    pages = reportPages(content, 64, player.mode ? 5 : 13);
    if (reset) page = 0;
    page = Math.min(page, pages.length - 1);
    drawPage();
  }
  function drawPage() {
    details.textContent = pages[page] || "";
    element("page").textContent = "Pagina " + (page + 1) + "/" + pages.length + " \xB7 usare i pulsanti Pagina";
  }
  function refreshAvplay() {
    const inspected = inspectAvplay(tv);
    findings.AVPlay = inspected.result;
    element("avplay").disabled = !inspected.api;
  }
  function summary() {
    view = "summary";
    refreshAvplay();
    showPages(
      "Capacit\xE0 rilevate (dettagli anche nel rapporto)",
      Object.entries(findings).map(([k, v]) => k + ": " + v).join("\n")
    );
  }
  function renderLogs(reset = false) {
    showPages(
      "Tasti, errori e comandi osservati",
      [
        "TASTI:",
        ...keys.slice(-12),
        "ERRORI:",
        ...errors.length ? errors.slice(-12) : ["nessuno"],
        "EVENTI:",
        ...events.slice(-16)
      ].join("\n"),
      reset
    );
  }
  player = new Playback(
    element("video"),
    surface,
    log,
    (name, value) => {
      findings[name] = value;
      log(name + ": " + value);
      if (view === "playback")
        showPages(
          "Test video \u2014 verificare immagine e audio",
          value + "\nPausa/Riprendi \xB7 Stop/Home \xB7 Back interrompe sempre"
        );
    }
  );
  var mediaUrl = new URL("./media/probe.mp4", document.baseURI).href;
  function focusAt(index) {
    var _a;
    focus = index;
    (_a = buttons[focus]) == null ? void 0 : _a.focus();
  }
  function home() {
    player.stop();
    panel.classList.remove("playing");
    summary();
    focusAt(originFocus);
  }
  async function storage() {
    if (storageBusy) return;
    storageBusy = true;
    log("Test storage in corso (massimo 5 s per IndexedDB)\u2026");
    try {
      findings = { ...findings, ...await probeStorage() };
      log("Test storage completato; durata oltre la sessione non verificata");
      if (view === "summary") summary();
    } finally {
      storageBusy = false;
    }
  }
  async function run(id) {
    var _a;
    switch (id) {
      case "summary":
        summary();
        break;
      case "bridge":
        if (bridgeBusy) return;
        bridgeBusy = true;
        log("Prova del solo bridge Samsung locale\u2026");
        try {
          findings["Bridge Samsung"] = await loadSamsungBridge();
          Object.assign(findings, probeBrowser());
          log(findings["Bridge Samsung"]);
          summary();
        } finally {
          bridgeBusy = false;
        }
        break;
      case "html5":
      case "avplay":
        originFocus = buttons.findIndex((button) => button.id === id);
        view = "playback";
        panel.classList.add("playing");
        if (id === "html5") await player.startHtml(mediaUrl);
        else player.startAvplay(mediaUrl);
        break;
      case "toggle":
        await player.control("toggle");
        break;
      case "stop":
        home();
        break;
      case "storage":
        await storage();
        break;
      case "logs":
        view = "logs";
        renderLogs(true);
        break;
      case "report":
        player.stop();
        panel.classList.remove("playing");
        view = "report";
        frozenReport = report();
        showPages("Rapporto fotografabile / trascrivibile", frozenReport);
        break;
      case "copy": {
        const text = view === "report" && frozenReport ? frozenReport : report();
        if (!((_a = navigator.clipboard) == null ? void 0 : _a.writeText)) {
          log("Clipboard non disponibile: Apri rapporto e fotografa le pagine.");
          break;
        }
        try {
          await navigator.clipboard.writeText(text);
          log("Rapporto copiato negli appunti");
        } catch {
          log("Copia negata: Apri rapporto e fotografa le pagine.");
        }
        break;
      }
      case "previous":
        page = Math.max(0, page - 1);
        drawPage();
        break;
      case "next":
        page = Math.min(pages.length - 1, page + 1);
        drawPage();
        break;
    }
  }
  function safely(operation) {
    try {
      Promise.resolve(operation()).catch(
        (error) => log("Operazione fallita: " + describeError(error))
      );
    } catch (error) {
      log("Operazione fallita: " + describeError(error));
    }
  }
  buttons.forEach((button, index) => {
    button.addEventListener("focus", () => {
      focus = index;
    });
    button.addEventListener("click", () => safely(() => run(button.id)));
  });
  window.addEventListener("keydown", (event) => {
    const action = keyAction(event.key, event.keyCode);
    const message = "key=" + event.key + " code=" + event.keyCode + " \u2192 " + action;
    keys.push(message);
    if (keys.length > 12) keys.shift();
    if (view === "logs") renderLogs();
    status.textContent = message;
    if (action === "unknown") return;
    event.preventDefault();
    if (event.repeat && !["up", "down", "left", "right"].includes(action)) return;
    if (["up", "down", "left", "right"].includes(action))
      focusAt(
        moveFocus(
          focus,
          action,
          buttons.map((button) => !button.disabled)
        )
      );
    else if (action === "enter") safely(() => run(buttons[focus].id));
    else if (action === "back" || action === "stop") home();
    else if (action === "play" || action === "pause" || action === "toggle")
      safely(() => player.control(action));
    else log("Seek fuori ambito P01.1; tasto registrato: " + action);
  });
  window.addEventListener("pagehide", () => player.stop());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      player.stop();
      panel.classList.remove("playing");
      log("Documento nascosto: player arrestato");
    }
  });
  element("build").textContent = "0.1.1+cb1ad32e8caa";
  refreshAvplay();
  summary();
  focusAt(0);
  log(
    "Pronto. AVPlay richiede API accessibile; canPlayType non prova la riproduzione."
  );
  safely(storage);
})();
