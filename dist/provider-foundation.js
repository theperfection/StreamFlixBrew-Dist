"use strict";
var StreamFlixBrewProviders = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/foundation/index.ts
  var index_exports = {};
  __export(index_exports, {
    BrowserHttpTransport: () => BrowserHttpTransport,
    CatalogService: () => CatalogService,
    ExtractorRegistry: () => ExtractorRegistry,
    LocalDiagnosticTransport: () => LocalDiagnosticTransport,
    PlaybackAdapter: () => PlaybackAdapter,
    ProviderRegistry: () => ProviderRegistry,
    StreamResolver: () => StreamResolver,
    adaptVideo: () => adaptVideo,
    attempt: () => attempt,
    browserHttpLimitation: () => browserHttpLimitation,
    failure: () => failure,
    isContentItem: () => isContentItem,
    previousContent: () => previousContent,
    selectContent: () => selectContent,
    success: () => success,
    validPage: () => validPage
  });

  // src/foundation/domain.ts
  function success(value) {
    return { ok: true, value };
  }
  function failure(code, message, retryable = false, status) {
    return { ok: false, error: { code, message, retryable, status } };
  }
  function isContentItem(item) {
    return item.kind === "movie" || item.kind === "tv-show" || item.kind === "live";
  }
  async function attempt(context, operation) {
    var _a, _b, _c;
    if ((_a = context.signal) == null ? void 0 : _a.aborted)
      return failure("cancelled", "Operation cancelled");
    try {
      const result = await operation();
      return ((_b = context.signal) == null ? void 0 : _b.aborted) ? failure("cancelled", "Operation cancelled") : result;
    } catch {
      return ((_c = context.signal) == null ? void 0 : _c.aborted) ? failure("cancelled", "Operation cancelled") : failure("provider", "Provider operation failed");
    }
  }
  function validPage(page) {
    return page.kind === "number" ? Number.isInteger(page.number) && page.number > 0 : page.cursor === void 0 || page.cursor.length > 0;
  }

  // src/foundation/registry.ts
  var ProviderRegistry = class {
    constructor() {
      this.providers = /* @__PURE__ */ new Map();
    }
    register(provider) {
      if (!provider.id.trim())
        return failure("invalid-data", "Empty provider ID");
      if (this.providers.has(provider.id))
        return failure("ambiguous", "Duplicate provider ID");
      const capabilities = provider.capabilities;
      const methods = [
        ["home", provider.getHome],
        ["search", provider.search],
        ["catalogs", provider.getCatalog],
        ["genres", provider.getGenre],
        ["people", provider.getPerson]
      ];
      for (const [capability, method] of methods)
        if (capabilities[capability] !== (typeof method === "function"))
          return failure(
            "invalid-data",
            "Capability/method mismatch: " + capability
          );
      if (!!provider.getSeasons !== !!provider.getEpisodes || !!provider.getServers !== !!provider.getVideo)
        return failure("invalid-data", "Partial capability implementation");
      if (capabilities.seasons !== (typeof provider.getSeasons === "function" && typeof provider.getEpisodes === "function"))
        return failure("invalid-data", "Season capability mismatch");
      if (capabilities.playback !== (typeof provider.getServers === "function" && typeof provider.getVideo === "function"))
        return failure("invalid-data", "Playback capability mismatch");
      this.providers.set(provider.id, provider);
      return success(provider);
    }
    get(id) {
      const provider = this.providers.get(id);
      return provider ? success(provider) : failure("not-found", "Provider not registered");
    }
    list() {
      return Array.from(this.providers.values());
    }
  };
  var ExtractorRegistry = class {
    constructor() {
      this.extractors = /* @__PURE__ */ new Map();
    }
    register(extractor) {
      if (!extractor.id.trim() || !extractor.hosts.length || extractor.hosts.some(
        (host) => !host || host !== host.toLowerCase() || /[:/\s]/.test(host)
      ))
        return failure(
          "invalid-data",
          "Extractor requires normalized exact hosts"
        );
      if (this.extractors.has(extractor.id))
        return failure("ambiguous", "Duplicate extractor ID");
      this.extractors.set(extractor.id, extractor);
      return success(extractor);
    }
    select(resource, id) {
      let host;
      try {
        const url = new URL(resource.url);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
          return failure("invalid-data", "Invalid extractor URL");
        host = url.hostname;
      } catch {
        return failure("invalid-data", "Invalid extractor URL");
      }
      const matches = Array.from(this.extractors.values()).filter(
        (extractor) => (!id || extractor.id === id) && extractor.hosts.includes(host)
      );
      return matches.length === 1 ? success(matches[0]) : failure(
        matches.length ? "ambiguous" : "unsupported",
        "No unique extractor for exact host"
      );
    }
  };

  // src/foundation/catalog.ts
  var CatalogService = class {
    constructor(registry) {
      this.registry = registry;
    }
    call(providerId, context, operation) {
      const found = this.registry.get(providerId);
      return found.ok ? attempt(context, () => operation(found.value)) : Promise.resolve(found);
    }
    home(providerId, context = {}) {
      return this.call(
        providerId,
        context,
        (provider) => {
          var _a, _b;
          return (_b = (_a = provider.getHome) == null ? void 0 : _a.call(provider, context)) != null ? _b : Promise.resolve(failure("unsupported", "Home unavailable"));
        }
      );
    }
    search(providerId, query, page = { kind: "number", number: 1 }, context = {}) {
      return this.call(
        providerId,
        context,
        (provider) => {
          var _a, _b;
          return !validPage(page) ? Promise.resolve(failure("invalid-data", "Invalid page")) : (_b = (_a = provider.search) == null ? void 0 : _a.call(provider, query, page, context)) != null ? _b : Promise.resolve(failure("unsupported", "Search unavailable"));
        }
      );
    }
    catalog(providerId, kind, page = { kind: "number", number: 1 }, context = {}) {
      return this.call(
        providerId,
        context,
        (provider) => {
          var _a, _b;
          return !validPage(page) ? Promise.resolve(failure("invalid-data", "Invalid page")) : !provider.capabilities.content.includes(kind) ? Promise.resolve(failure("unsupported", "Content kind unavailable")) : (_b = (_a = provider.getCatalog) == null ? void 0 : _a.call(provider, kind, page, context)) != null ? _b : Promise.resolve(failure("unsupported", "Catalog unavailable"));
        }
      );
    }
    detail(content, context = {}) {
      return this.call(
        content.providerId,
        context,
        (provider) => provider.capabilities.content.includes(content.kind) ? provider.getDetail(content, context) : Promise.resolve(failure("unsupported", "Content kind unavailable"))
      );
    }
    seasons(content, context = {}) {
      if (content.kind !== "tv-show")
        return Promise.resolve(
          failure("unsupported", "Seasons require a TV show")
        );
      return this.call(
        content.providerId,
        context,
        (provider) => {
          var _a, _b;
          return (_b = (_a = provider.getSeasons) == null ? void 0 : _a.call(provider, content, context)) != null ? _b : Promise.resolve(failure("unsupported", "Seasons unavailable"));
        }
      );
    }
    episodes(season, page = { kind: "number", number: 1 }, context = {}) {
      return this.call(
        season.show.providerId,
        context,
        (provider) => {
          var _a, _b;
          return !validPage(page) ? Promise.resolve(failure("invalid-data", "Invalid page")) : (_b = (_a = provider.getEpisodes) == null ? void 0 : _a.call(provider, season, page, context)) != null ? _b : Promise.resolve(failure("unsupported", "Episodes unavailable"));
        }
      );
    }
    genre(providerId, id, page = { kind: "number", number: 1 }, context = {}) {
      return this.call(
        providerId,
        context,
        (provider) => {
          var _a, _b;
          return !validPage(page) ? Promise.resolve(failure("invalid-data", "Invalid page")) : (_b = (_a = provider.getGenre) == null ? void 0 : _a.call(provider, id, page, context)) != null ? _b : Promise.resolve(failure("unsupported", "Genres unavailable"));
        }
      );
    }
    person(providerId, id, page = { kind: "number", number: 1 }, context = {}) {
      return this.call(
        providerId,
        context,
        (provider) => {
          var _a, _b;
          return !validPage(page) ? Promise.resolve(failure("invalid-data", "Invalid page")) : (_b = (_a = provider.getPerson) == null ? void 0 : _a.call(provider, id, page, context)) != null ? _b : Promise.resolve(failure("unsupported", "People unavailable"));
        }
      );
    }
    servers(target, context = {}) {
      const content = target.kind === "episode" ? target.episode.show : target.content;
      if ((target.kind === "episode" ? "tv-show" : target.kind) !== content.kind)
        return Promise.resolve(failure("invalid-data", "Playable kind mismatch"));
      return this.call(
        target.kind === "episode" ? target.episode.show.providerId : target.content.providerId,
        context,
        (provider) => {
          var _a, _b;
          return (_b = (_a = provider.getServers) == null ? void 0 : _a.call(provider, target, context)) != null ? _b : Promise.resolve(failure("unsupported", "Playback unavailable"));
        }
      );
    }
  };

  // src/foundation/http.ts
  function browserHttpLimitation(metadata) {
    var _a;
    if (!metadata) return;
    if (metadata.referer || ((_a = metadata.cookies) == null ? void 0 : _a.mode) === "explicit" || metadata.token || metadata.maintainToken)
      return "Explicit referer/cookies/token requires a capable transport";
    for (const header of Object.keys(metadata.headers || {})) {
      const name = header.toLowerCase();
      if ([
        "referer",
        "cookie",
        "cookie2",
        "host",
        "origin",
        "user-agent",
        "accept-encoding",
        "content-length",
        "connection",
        "date",
        "dnt",
        "expect",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "via",
        "permissions-policy",
        "access-control-request-method",
        "access-control-request-headers"
      ].includes(name) || name.startsWith("sec-") || name.startsWith("proxy-"))
        return "Browser cannot guarantee the required HTTP header";
    }
  }
  var BrowserHttpTransport = class {
    constructor(fetchResource = fetch) {
      this.fetchResource = fetchResource;
    }
    async request(request, context = {}) {
      var _a, _b, _c, _d, _e, _f;
      if ((_a = context.signal) == null ? void 0 : _a.aborted)
        return failure("cancelled", "HTTP request cancelled");
      if (browserHttpLimitation(request.http))
        return failure(
          "http-requirements",
          "Required HTTP metadata cannot be guaranteed by browser transport"
        );
      try {
        const url = new URL(request.url);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
          return failure(
            "invalid-data",
            "HTTP URL must be absolute HTTP(S) without credentials"
          );
        const response = await this.fetchResource(url.href, {
          method: request.method,
          body: request.body,
          headers: (_b = request.http) == null ? void 0 : _b.headers,
          signal: context.signal,
          credentials: ((_d = (_c = request.http) == null ? void 0 : _c.cookies) == null ? void 0 : _d.mode) === "browser-session" ? "include" : "omit"
        });
        if (!response.ok)
          return failure(
            "http",
            "HTTP response failed",
            response.status >= 500,
            response.status
          );
        const body = await response.text();
        if ((_e = context.signal) == null ? void 0 : _e.aborted)
          return failure("cancelled", "HTTP request cancelled");
        const headers = {};
        response.headers.forEach((value, name) => {
          headers[name] = value;
        });
        return success({
          status: response.status,
          url: response.url,
          headers,
          body
        });
      } catch {
        return ((_f = context.signal) == null ? void 0 : _f.aborted) ? failure("cancelled", "HTTP request cancelled") : failure("network", "Network/CORS request failed", true);
      }
    }
  };

  // src/foundation/resolver.ts
  var StreamResolver = class {
    constructor(providers, extractors) {
      this.providers = providers;
      this.extractors = extractors;
    }
    resolve(server, context = {}) {
      return attempt(context, async () => {
        var _a;
        const content = server.target.kind === "episode" ? server.target.episode.show : server.target.content;
        if ((server.target.kind === "episode" ? "tv-show" : server.target.kind) !== content.kind)
          return failure("invalid-data", "Playable kind mismatch");
        const targetProvider = server.target.kind === "episode" ? server.target.episode.show.providerId : server.target.content.providerId;
        if (targetProvider !== server.providerId)
          return failure("invalid-data", "Server provider mismatch");
        const provider = this.providers.get(server.providerId);
        if (!provider.ok) return provider;
        if (!provider.value.getVideo)
          return failure("unsupported", "Stream resolution unavailable");
        const resolution = await provider.value.getVideo(server, context);
        if (!resolution.ok) return resolution;
        if ((_a = context.signal) == null ? void 0 : _a.aborted)
          return failure("cancelled", "Resolution cancelled");
        if (resolution.value.kind === "direct")
          return success(resolution.value.video);
        const selected = this.extractors.select(
          resolution.value.resource,
          resolution.value.extractorId
        );
        return selected.ok ? selected.value.extract(resolution.value.resource, context) : selected;
      });
    }
  };

  // src/foundation/playback-adapter.ts
  function adaptVideo(video, now = Date.now(), baseUrl) {
    var _a, _b;
    if (video.expiresAt !== void 0 && (!Number.isFinite(video.expiresAt) || video.expiresAt <= now))
      return failure("expired", "Resolve a fresh video URL");
    if (video.drm) return failure("unsupported", "DRM not supported by baseline");
    const metadata = video.http;
    if (metadata && (Object.keys(metadata.headers || {}).length || metadata.referer || metadata.cookies || metadata.token || metadata.maintainToken))
      return failure(
        "http-requirements",
        "Playback HTTP requirements cannot be guaranteed; nothing discarded"
      );
    if (video.subtitles.length || video.audioTracks.some((track) => track.resource) || ((_a = video.hints) == null ? void 0 : _a.extraBuffering) || ((_b = video.hints) == null ? void 0 : _b.useServerSubtitleSetting))
      return failure(
        "unsupported",
        "External tracks or playback hints need an explicit adapter extension"
      );
    if (!["mp4", "hls"].includes(video.format))
      return failure("unsupported", "Unsupported video format");
    if (video.codecs && !/^avc1\.[0-9a-f]{6}\s*,\s*mp4a\.40\.2$/i.test(video.codecs))
      return failure(
        "unsupported",
        "Codec combination outside verified H264/AAC baseline"
      );
    try {
      const url = new URL(video.url, baseUrl);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
        return failure("invalid-data", "Invalid playback URL");
      return success({
        player: video.format === "hls" ? "hls-js" : "html5",
        url: url.href
      });
    } catch {
      return failure("invalid-data", "Invalid playback URL");
    }
  }
  var PlaybackAdapter = class {
    constructor(playback, baseUrl) {
      this.playback = playback;
      this.baseUrl = baseUrl;
    }
    async play(video, diagnostics = false) {
      const source = adaptVideo(video, Date.now(), this.baseUrl);
      if (!source.ok) return source;
      try {
        if (source.value.player === "html5")
          await this.playback.startHtml(source.value.url);
        else this.playback.startHls(source.value.url, true, diagnostics);
        return source;
      } catch {
        this.playback.stop();
        return failure("provider", "Playback command failed");
      }
    }
    stop() {
      this.playback.stop();
    }
  };

  // src/foundation/state.ts
  function selectContent(state, content, focusId) {
    const identity = {
      providerId: content.providerId,
      id: content.id,
      kind: content.kind
    };
    return {
      selected: identity,
      history: [...state.history, { content: identity, focusId }].slice(-30)
    };
  }
  function previousContent(state) {
    var _a;
    const history = state.history.slice(0, -1);
    return { history, selected: (_a = history[history.length - 1]) == null ? void 0 : _a.content };
  }

  // src/foundation/local-diagnostic-transport.ts
  var base = "http://127.0.0.1:17861";
  function object(value) {
    return typeof value === "object" && value !== null;
  }
  function number(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  }
  var LocalDiagnosticTransport = class {
    constructor(fetchResource = (resource, options) => fetch(resource, options), deadlineMs = 12e3) {
      this.fetchResource = fetchResource;
      this.deadlineMs = deadlineMs;
    }
    async read(path, context) {
      var _a, _b, _c, _d, _e, _f, _g;
      if ((_a = context.signal) == null ? void 0 : _a.aborted)
        return failure("cancelled", "Local diagnostic cancelled");
      const controller = new AbortController();
      let timedOut = false;
      const cancel = () => controller.abort();
      (_b = context.signal) == null ? void 0 : _b.addEventListener("abort", cancel);
      const timer = setTimeout(
        () => {
          timedOut = true;
          controller.abort();
        },
        path === "/health" ? Math.min(2e3, this.deadlineMs) : this.deadlineMs
      );
      try {
        const response = await this.fetchResource(base + path, {
          method: "GET",
          credentials: "omit",
          redirect: "error",
          cache: "no-store",
          signal: controller.signal
        });
        if (!((_c = response.headers.get("content-type")) == null ? void 0 : _c.startsWith("application/json")))
          return failure("invalid-data", "Local diagnostic MIME mismatch");
        const declared = response.headers.get("content-length");
        if (declared && Number(declared) > 2048)
          return failure("invalid-data", "Local diagnostic response too large");
        const reader = (_d = response.body) == null ? void 0 : _d.getReader();
        if (!reader)
          return failure(
            "invalid-data",
            "Local diagnostic streaming response unavailable"
          );
        const parts = [];
        let length = 0;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          length += chunk.value.length;
          if (length > 2048) {
            await reader.cancel();
            return failure("invalid-data", "Local diagnostic response too large");
          }
          parts.push(chunk.value);
        }
        const joined = new Uint8Array(length);
        let offset = 0;
        for (const part of parts) {
          joined.set(part, offset);
          offset += part.length;
        }
        const parsed = JSON.parse(new TextDecoder().decode(joined));
        if (!response.ok) {
          const permitted = [
            "BUSY",
            "TIMEOUT",
            "HTTPS_CONNECTION",
            "TLS_VERIFICATION",
            "REMOTE_READ",
            "REMOTE_STATUS",
            "RESPONSE_LIMIT",
            "CANCELLED",
            "CLIENT_CLOSED",
            "ORIGIN_OR_HOST",
            "PATH_NOT_ALLOWED",
            "BODY_NOT_ALLOWED",
            "METHOD_NOT_ALLOWED",
            "PREFLIGHT_NOT_ALLOWED"
          ];
          return failure(
            "http",
            object(parsed) && parsed.protocol === "p023-v1" && typeof parsed.error === "string" && permitted.includes(parsed.error) ? "Local diagnostic: " + parsed.error : "Local diagnostic HTTP failure",
            response.status === 429 || response.status >= 500,
            response.status
          );
        }
        return ((_e = context.signal) == null ? void 0 : _e.aborted) ? failure("cancelled", "Local diagnostic cancelled") : success(parsed);
      } catch {
        return ((_f = context.signal) == null ? void 0 : _f.aborted) ? failure("cancelled", "Local diagnostic cancelled") : timedOut ? failure("network", "Local diagnostic timeout", true) : failure(
          "network",
          "Local diagnostic unavailable, blocked by CORS, or malformed response",
          true
        );
      } finally {
        clearTimeout(timer);
        (_g = context.signal) == null ? void 0 : _g.removeEventListener("abort", cancel);
      }
    }
    async health(context = {}) {
      const result = await this.read("/health", context);
      if (!result.ok) return result;
      const value = result.value;
      if (!object(value) || value.protocol !== "p023-v1" || value.ok !== true || value.service !== "streamflixbrew-diagnostic" || typeof value.nodeVersion !== "string" || !/^v\d+\.\d+\.\d+/.test(value.nodeVersion) || typeof value.instance !== "string" || !/^[0-9a-f]{16}$/.test(value.instance) || !number(value.uptimeMs))
        return failure("invalid-data", "Invalid local health schema");
      return success({
        protocol: "p023-v1",
        ok: true,
        service: "streamflixbrew-diagnostic",
        nodeVersion: value.nodeVersion,
        instance: value.instance,
        uptimeMs: value.uptimeMs
      });
    }
    async request(request, context = {}) {
      if (request.url !== "https://example.com/" || request.method !== "GET" || request.body !== void 0 || request.http && (Object.keys(request.http.headers || {}).length || request.http.cookies || request.http.referer || request.http.token || request.http.maintainToken))
        return failure(
          "http-requirements",
          "Diagnostic transport permits only GET https://example.com/ without metadata"
        );
      const result = await this.read("/probe", context);
      if (!result.ok) return result;
      const value = result.value;
      if (!object(value) || value.protocol !== "p023-v1" || value.ok !== true || value.target !== "https://example.com/" || !number(value.remoteStatus) || !Number.isInteger(value.remoteStatus) || value.remoteStatus < 200 || value.remoteStatus >= 300 || !number(value.bytes) || !Number.isInteger(value.bytes) || value.bytes > 65536 || !number(value.durationMs))
        return failure("invalid-data", "Invalid local probe schema");
      const summary = {
        protocol: "p023-v1",
        ok: true,
        target: "https://example.com/",
        remoteStatus: value.remoteStatus,
        bytes: value.bytes,
        durationMs: value.durationMs
      };
      return success({
        status: 200,
        url: base + "/probe",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(summary)
      });
    }
  };
  return __toCommonJS(index_exports);
})();
