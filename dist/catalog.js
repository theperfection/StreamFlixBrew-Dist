"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // service/catalog-metadata.cjs
  var require_catalog_metadata = __commonJS({
    "service/catalog-metadata.cjs"(exports) {
      "use strict";
      var PROVIDER3 = "streamingcommunity-it";
      var HOST = "streamingunity.fun";
      var LIVE_APPROVED2 = true;
      function invalid() {
        throw new Error("INVALID_DATA");
      }
      function object(value) {
        return value && typeof value === "object" && !Array.isArray(value);
      }
      function text2(value, max, optional) {
        if ((value === void 0 || value === null) && optional) return void 0;
        if (typeof value !== "string" || value.length > max || !optional && !value.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
          invalid();
        return value;
      }
      function integer(value, min, max) {
        if (typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value))
          value = Number(value);
        if (typeof value !== "number" || !isFinite(value) || Math.floor(value) !== value || value < min || value > max)
          invalid();
        return value;
      }
      function list(value, max) {
        if (!Array.isArray(value) || value.length > max) invalid();
        return value;
      }
      function identity(value) {
        return String(integer(value, 1, 1e12));
      }
      function validId(value) {
        return typeof value === "string" && /^[1-9][0-9]{0,11}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 200;
      }
      function requestDescriptor3(input) {
        if (!object(input)) invalid();
        var keys = Object.keys(input).sort().join(",");
        var path, page;
        if (input.op === "home" && keys === "op") path = "/it/";
        else if (input.op === "catalog" && keys === "op,page,type" && (input.type === "movie" || input.type === "tv")) {
          page = integer(input.page, 1, 1e4);
          path = "/it/archive?type=" + input.type + "&page=" + page;
        } else if (input.op === "search" && keys === "op,page,q") {
          page = integer(input.page, 1, 1e4);
          var q = text2(input.q, 120, false);
          if (q !== q.trim() || /[\u0000-\u001f\u007f]/.test(q)) invalid();
          path = "/it/search?q=" + encodeURIComponent(q) + "&page=" + page + "&lang=it";
        } else if (input.op === "detail" && keys === "id,op,type" && validId(input.id) && (input.type === "movie" || input.type === "tv"))
          path = "/it/titles/" + input.id;
        else invalid();
        return {
          hostname: HOST,
          port: 443,
          method: "GET",
          path,
          operation: input.op,
          html: input.op === "home" || input.op === "detail"
        };
      }
      function parseRoute2(url) {
        if (typeof url !== "string" || url.length > 1800 || url.indexOf("/catalog/") !== 0 || /[#\r\n]/.test(url))
          invalid();
        var split = url.split("?");
        if (split.length > 2) invalid();
        var input = { op: split[0].slice(9) };
        if (split[1])
          split[1].split("&").forEach(function(pair) {
            var parts = pair.split("=");
            if (parts.length !== 2 || !/^(type|page|q|id)$/.test(parts[0]) || Object.prototype.hasOwnProperty.call(input, parts[0]))
              invalid();
            var val = decodeURIComponent(parts[1].replace(/\+/g, " "));
            if (parts[0] === "page") {
              if (!/^[1-9][0-9]{0,3}$/.test(val) && val !== "10000") invalid();
              val = Number(val);
            }
            input[parts[0]] = val;
          });
        requestDescriptor3(input);
        return input;
      }
      function summary(raw) {
        if (!object(raw)) invalid();
        var id = identity(raw.id), slug = text2(raw.slug, 180, false);
        if (!validId(id + "-" + slug) || raw.type !== "movie" && raw.type !== "tv")
          invalid();
        var value = {
          providerId: PROVIDER3,
          id: id + "-" + slug,
          kind: raw.type === "movie" ? "movie" : "tv-show",
          title: text2(raw.name, 300, false)
        };
        var plot = text2(raw.plot, 6e3, true);
        if (plot !== void 0) value.overview = plot;
        return value;
      }
      function unique(items2) {
        var seen = /* @__PURE__ */ Object.create(null);
        items2.forEach(function(item) {
          if (seen[item.id]) invalid();
          seen[item.id] = true;
        });
        return items2;
      }
      function categories(sliders) {
        return list(sliders, 30).map(function(slider, index) {
          if (!object(slider)) invalid();
          return {
            id: "slider-" + index,
            title: text2(
              slider.label || slider.name || "Categoria " + (index + 1),
              300,
              false
            ),
            items: unique(list(slider.titles, 100).map(summary))
          };
        });
      }
      function decodeAttribute(value) {
        return value.replace(
          /&(?:quot|apos|amp|lt|gt|#\d+|#x[0-9a-f]+);/gi,
          function(entity) {
            var map = {
              "&quot;": '"',
              "&apos;": "'",
              "&amp;": "&",
              "&lt;": "<",
              "&gt;": ">"
            };
            if (map[entity.toLowerCase()]) return map[entity.toLowerCase()];
            var hex = /^&#x/i.test(entity), code = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
            if (code <= 0 || code > 65535 || code >= 55296 && code <= 57343)
              invalid();
            return String.fromCharCode(code);
          }
        );
      }
      function bootstrap(body) {
        var found = [];
        var tags = [], pos = 0;
        while (pos < body.length) {
          var begin = body.indexOf("<", pos);
          if (begin < 0) break;
          if (body.slice(begin, begin + 4) === "<!--") {
            var commentEnd = body.indexOf("-->", begin + 4);
            if (commentEnd < 0) invalid();
            pos = commentEnd + 3;
            continue;
          }
          var quote = "", finish = begin + 1;
          for (; finish < body.length; finish++) {
            var ch = body.charAt(finish);
            if (quote) {
              if (ch === quote) quote = "";
            } else if (ch === '"' || ch === "'") quote = ch;
            else if (ch === ">") break;
          }
          if (finish === body.length) invalid();
          var tag = body.slice(begin, finish + 1);
          var raw = /^<(script|style|template)\b/i.exec(tag);
          if (raw) {
            var endPattern = new RegExp("</" + raw[1] + "\\s*>", "gi");
            endPattern.lastIndex = finish + 1;
            var endTag = endPattern.exec(body);
            if (!endTag) invalid();
            if (raw[1].toLowerCase() === "template" && /<template\b/i.test(body.slice(finish + 1, endTag.index)))
              invalid();
            pos = endTag.index + endTag[0].length;
            continue;
          }
          if (/^<div\b/i.test(tag)) tags.push(tag);
          pos = finish + 1;
        }
        tags.forEach(function(tag2) {
          var attrs = /* @__PURE__ */ Object.create(null), match, regex = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
          while (match = regex.exec(tag2)) {
            var key = match[1].toLowerCase();
            if (Object.prototype.hasOwnProperty.call(attrs, key)) invalid();
            attrs[key] = match[2] === void 0 ? match[3] : match[2];
          }
          if (attrs.id === "app") found.push(attrs["data-page"]);
        });
        if (found.length !== 1 || typeof found[0] !== "string") invalid();
        var value = JSON.parse(decodeAttribute(found[0]));
        if (!object(value) || !object(value.props) || value.props.locale !== "it")
          invalid();
        return value.props;
      }
      function parseMetadata2(input, body, mime) {
        var descriptor = requestDescriptor3(input);
        if (typeof body !== "string" || body.length > 2097152) invalid();
        if (descriptor.html) {
          if (!/^text\/html(?:;|$)/i.test(mime)) invalid();
          var props = bootstrap(body);
          if (input.op === "home")
            return { kind: "home", categories: categories(props.sliders) };
          var title2 = summary(props.title);
          if (title2.id !== input.id || (title2.kind === "movie" ? "movie" : "tv") !== input.type)
            invalid();
          title2.genres = [];
          title2.directors = [];
          title2.cast = [];
          title2.recommendations = [];
          var seasons2 = [];
          if (title2.kind === "tv-show")
            seasons2 = unique(
              list(props.title.seasons, 100).map(function(season) {
                if (!object(season)) invalid();
                if (season.title_id !== void 0 && identity(season.title_id) !== input.id.split("-")[0])
                  invalid();
                return {
                  id: identity(season.id),
                  show: { providerId: PROVIDER3, id: title2.id, kind: "tv-show" },
                  number: integer(season.number, 0, 1e4),
                  title: text2(season.name, 300, true)
                };
              })
            );
          if (title2.kind === "tv-show") title2.seasons = seasons2;
          var loaded = null;
          if (props.loadedSeason !== void 0 && props.loadedSeason !== null) {
            if (title2.kind !== "tv-show" || !object(props.loadedSeason)) invalid();
            var seasonId = identity(props.loadedSeason.id);
            if (!seasons2.some(function(s) {
              return s.id === seasonId;
            }))
              invalid();
            if (props.loadedSeason.title_id !== void 0 && identity(props.loadedSeason.title_id) !== input.id.split("-")[0])
              invalid();
            var matchedSeason = seasons2.filter(function(s) {
              return s.id === seasonId;
            })[0];
            if (props.loadedSeason.number !== void 0 && integer(props.loadedSeason.number, 0, 1e4) !== matchedSeason.number)
              invalid();
            loaded = {
              id: seasonId,
              episodes: unique(
                list(props.loadedSeason.episodes, 500).map(function(episode) {
                  if (!object(episode)) invalid();
                  if (episode.season_id !== void 0 && identity(episode.season_id) !== seasonId)
                    invalid();
                  return {
                    id: identity(episode.id),
                    seasonId,
                    show: { providerId: PROVIDER3, id: title2.id, kind: "tv-show" },
                    number: integer(episode.number, 0, 1e4),
                    title: text2(episode.name, 300, true),
                    overview: text2(episode.plot, 6e3, true)
                  };
                })
              )
            };
          }
          return { kind: "detail", detail: title2, loadedSeason: loaded };
        }
        if (!/^application\/json(?:;|$)/i.test(mime)) invalid();
        var raw = JSON.parse(body);
        if (!object(raw)) invalid();
        var current = integer(raw.current_page, 1, 1e4), last = integer(raw.last_page, 1, 1e4);
        var per = integer(raw.per_page, 1, 100), total = integer(raw.total, 0, 1e6);
        var items2 = unique(list(raw.data, per).map(summary));
        if (current !== input.page || current > last || total < items2.length || last !== Math.max(1, Math.ceil(total / per)))
          invalid();
        if (input.op === "catalog" && items2.some(function(item) {
          return item.kind !== (input.type === "movie" ? "movie" : "tv-show");
        }))
          invalid();
        return {
          kind: "page",
          pageNumber: current,
          page: {
            items: items2,
            total,
            next: current < last ? { kind: "number", number: current + 1 } : void 0
          }
        };
      }
      function validateData2(value) {
        function raw(item) {
          if (!object(item) || item.providerId !== PROVIDER3 || !validId(item.id) || item.kind !== "movie" && item.kind !== "tv-show")
            invalid();
          var at = item.id.indexOf("-");
          return {
            id: item.id.slice(0, at),
            slug: item.id.slice(at + 1),
            name: item.title,
            type: item.kind === "movie" ? "movie" : "tv",
            plot: item.overview
          };
        }
        if (!object(value)) invalid();
        if (value.kind === "home")
          return {
            kind: "home",
            categories: list(value.categories, 30).map(function(cat, i) {
              if (!object(cat) || cat.id !== "slider-" + i) invalid();
              return {
                id: cat.id,
                title: text2(cat.title, 300, false),
                items: unique(
                  list(cat.items, 100).map(function(item) {
                    return summary(raw(item));
                  })
                )
              };
            })
          };
        if (value.kind === "page") {
          if (!object(value.page)) invalid();
          var n = integer(value.pageNumber, 1, 1e4), total = integer(value.page.total, 0, 1e6), next = value.page.next;
          if (next !== void 0 && (!object(next) || next.kind !== "number" || next.number !== n + 1 || next.number > 1e4))
            invalid();
          var items2 = unique(
            list(value.page.items, 100).map(function(item) {
              return summary(raw(item));
            })
          );
          if (total < items2.length) invalid();
          return {
            kind: "page",
            pageNumber: n,
            page: {
              items: items2,
              total,
              next: next ? { kind: "number", number: next.number } : void 0
            }
          };
        }
        if (value.kind === "detail") {
          var d = value.detail, r = raw(d), props = { locale: "it", title: r };
          if (r.type === "tv")
            r.seasons = list(d.seasons, 100).map(function(s) {
              if (!object(s) || !object(s.show) || s.show.providerId !== PROVIDER3 || s.show.id !== d.id || s.show.kind !== "tv-show")
                invalid();
              return { id: s.id, number: s.number, name: s.title };
            });
          if (value.loadedSeason !== null) {
            var loaded = value.loadedSeason;
            if (!object(loaded)) invalid();
            props.loadedSeason = {
              id: loaded.id,
              episodes: list(loaded.episodes, 500).map(function(ep) {
                if (!object(ep) || ep.seasonId !== loaded.id || !object(ep.show) || ep.show.providerId !== PROVIDER3 || ep.show.id !== d.id || ep.show.kind !== "tv-show")
                  invalid();
                return {
                  id: ep.id,
                  number: ep.number,
                  name: ep.title,
                  plot: ep.overview
                };
              })
            };
          }
          var json = JSON.stringify({ props }).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
          return parseMetadata2(
            { op: "detail", id: d.id, type: r.type },
            '<div id="app" data-page="' + json + '"></div>',
            "text/html"
          );
        }
        invalid();
      }
      exports.PROVIDER = PROVIDER3;
      exports.LIVE_APPROVED = LIVE_APPROVED2;
      exports.requestDescriptor = requestDescriptor3;
      exports.parseRoute = parseRoute2;
      exports.parseMetadata = parseMetadata2;
      exports.validateData = validateData2;
    }
  });

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

  // src/foundation/domain.ts
  function success(value) {
    return { ok: true, value };
  }
  function failure(code, message, retryable = false, status2) {
    return { ok: false, error: { code, message, retryable, status: status2 } };
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

  // src/foundation/catalog.ts
  var CatalogService = class {
    constructor(registry2) {
      this.registry = registry2;
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
    search(providerId, query2, page = { kind: "number", number: 1 }, context = {}) {
      return this.call(
        providerId,
        context,
        (provider) => {
          var _a, _b;
          return !validPage(page) ? Promise.resolve(failure("invalid-data", "Invalid page")) : (_b = (_a = provider.search) == null ? void 0 : _a.call(provider, query2, page, context)) != null ? _b : Promise.resolve(failure("unsupported", "Search unavailable"));
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

  // src/catalog/provider.ts
  var import_catalog_metadata = __toESM(require_catalog_metadata(), 1);
  var StreamingCommunityProvider = class {
    constructor(transport) {
      this.transport = transport;
      this.id = import_catalog_metadata.PROVIDER;
      this.name = "StreamingCommunity IT";
      this.language = "it";
      this.capabilities = {
        content: ["movie", "tv-show"],
        home: true,
        search: true,
        catalogs: true,
        genres: false,
        people: false,
        seasons: true,
        playback: false
      };
      this.getCatalog = (kind, page, context) => attempt(context, async () => {
        if (!this.valid({ providerId: this.id, id: "", kind }) || page.kind !== "number")
          return failure("unsupported", "Tipo o paginazione non supportati");
        const result = await this.transport.read(
          {
            op: "catalog",
            type: kind === "movie" ? "movie" : "tv",
            page: page.number
          },
          context
        );
        return result.ok ? result.value.kind === "page" ? success(result.value.page) : failure("invalid-data", "Catalogo non valido") : result;
      });
      this.search = (query2, page, context) => attempt(context, async () => {
        if (page.kind !== "number")
          return failure("unsupported", "Solo pagine numeriche");
        const result = await this.transport.read(
          { op: "search", q: query2.trim(), page: page.number },
          context
        );
        return result.ok ? result.value.kind === "page" ? success(result.value.page) : failure("invalid-data", "Ricerca non valida") : result;
      });
    }
    valid(content) {
      return content.providerId === this.id && (content.kind === "movie" || content.kind === "tv-show");
    }
    getHome(context = {}) {
      return attempt(context, async () => {
        const result = await this.transport.read({ op: "home" }, context);
        return result.ok ? result.value.kind === "home" ? success(result.value.categories) : failure("invalid-data", "Home non valida") : result;
      });
    }
    detailData(content, context) {
      if (!this.valid(content))
        return Promise.resolve(
          failure("invalid-data", "Identit\xE0 provider non valida")
        );
      return this.transport.read(
        {
          op: "detail",
          id: content.id,
          type: content.kind === "movie" ? "movie" : "tv"
        },
        context
      );
    }
    getDetail(content, context = {}) {
      return attempt(context, async () => {
        const result = await this.detailData(content, context);
        return result.ok ? result.value.kind === "detail" ? success(result.value.detail) : failure("invalid-data", "Dettaglio non valido") : result;
      });
    }
    getSeasons(show, context = {}) {
      return attempt(context, async () => {
        if (show.kind !== "tv-show")
          return failure("unsupported", "Stagioni solo per serie");
        const result = await this.getDetail(show, context);
        return result.ok ? success(result.value.seasons || []) : result;
      });
    }
    getEpisodes(season, page, context = {}) {
      return attempt(context, async () => {
        var _a;
        if (page.kind !== "number" || page.number !== 1 || season.show.kind !== "tv-show")
          return failure("unsupported", "Paginazione episodi non verificata");
        const result = await this.detailData(season.show, context);
        if (!result.ok) return result;
        if (result.value.kind !== "detail")
          return failure("invalid-data", "Dettaglio serie non valido");
        const actual = (_a = result.value.detail.seasons) == null ? void 0 : _a.find(
          (item) => item.id === season.id && item.number === season.number
        );
        if (!actual)
          return failure("invalid-data", "Stagione non appartenente alla serie");
        const loaded = result.value.loadedSeason;
        return loaded && loaded.id === season.id ? success({ items: loaded.episodes }) : failure(
          "unsupported",
          "Episodi della stagione non inclusi nel dettaglio; route separata non verificata"
        );
      });
    }
  };

  // src/catalog/fixtures.ts
  var import_catalog_metadata2 = __toESM(require_catalog_metadata(), 1);
  function fixtureResponse(input) {
    (0, import_catalog_metadata2.requestDescriptor)(input);
    const film = {
      id: 900001,
      slug: "film-fixture",
      name: "Film dimostrativo italiano \u2014 FIXTURE",
      type: "movie",
      plot: "Dati sintetici: nessun recupero esterno."
    };
    const film2 = {
      id: 900002,
      slug: "secondo-film-fixture",
      name: "Secondo film \u2014 FIXTURE",
      type: "movie"
    };
    const serie = {
      id: 900003,
      slug: "serie-fixture",
      name: "Serie dimostrativa italiana \u2014 FIXTURE",
      type: "tv",
      plot: "Contenuto fittizio per navigazione TV."
    };
    if (input.op === "catalog" || input.op === "search") {
      const items2 = input.op === "catalog" ? input.type === "movie" ? [film, film2] : [serie] : [film, film2, serie].filter(
        (v) => v.name.toLowerCase().includes(input.q.toLowerCase())
      );
      const per = 1, page = input.page;
      return {
        mime: "application/json",
        body: JSON.stringify({
          current_page: page,
          last_page: Math.max(1, items2.length),
          per_page: per,
          total: items2.length,
          data: items2.slice(page - 1, page)
        })
      };
    }
    let props;
    if (input.op === "home")
      props = {
        locale: "it",
        sliders: [
          { name: "Film \u2014 fixture", titles: [film, film2] },
          { name: "Serie \u2014 fixture", titles: [serie] }
        ]
      };
    else {
      const item = [film, film2, serie].find(
        (v) => v.id + "-" + v.slug === input.id && v.type === input.type
      );
      if (!item) throw new Error("INVALID_DATA");
      props = {
        locale: "it",
        title: {
          ...item,
          seasons: item.type === "tv" ? [
            { id: 910001, number: 1, name: "Stagione 1" },
            { id: 910002, number: 2, name: "Stagione non caricata" }
          ] : []
        },
        loadedSeason: item.type === "tv" ? {
          id: 910001,
          number: 1,
          title_id: item.id,
          episodes: [
            {
              id: 920001,
              number: 1,
              name: "Primo episodio sintetico",
              plot: "Nessun pulsante di riproduzione."
            },
            { id: 920002, number: 2, name: "Secondo episodio sintetico" }
          ]
        } : null
      };
    }
    const encoded = JSON.stringify({ props }).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return {
      mime: "text/html",
      body: '<div id="app" data-page="' + encoded + '"></div>'
    };
  }
  var FixtureCatalogTransport = class {
    async read(input, context = {}) {
      var _a, _b;
      if ((_a = context.signal) == null ? void 0 : _a.aborted)
        return failure("cancelled", "Richiesta annullata");
      try {
        const response = fixtureResponse(input);
        await Promise.resolve();
        return ((_b = context.signal) == null ? void 0 : _b.aborted) ? failure("cancelled", "Richiesta annullata") : success((0, import_catalog_metadata2.parseMetadata)(input, response.body, response.mime));
      } catch {
        return failure("invalid-data", "Fixture o richiesta non valida");
      }
    }
  };

  // src/catalog/transport.ts
  var import_catalog_metadata3 = __toESM(require_catalog_metadata(), 1);
  function localPath(input) {
    (0, import_catalog_metadata3.requestDescriptor)(input);
    let path;
    switch (input.op) {
      case "home":
        path = "/catalog/home";
        break;
      case "catalog":
        path = "/catalog/catalog?type=" + input.type + "&page=" + input.page;
        break;
      case "search":
        path = "/catalog/search?q=" + encodeURIComponent(input.q) + "&page=" + input.page;
        break;
      case "detail":
        path = "/catalog/detail?type=" + input.type + "&id=" + input.id;
        break;
    }
    (0, import_catalog_metadata3.parseRoute)(path);
    return path;
  }
  var LocalCatalogTransport = class {
    constructor(fetchResource = (url, init) => fetch(url, init), timeoutMs = 14e3) {
      this.fetchResource = fetchResource;
      this.timeoutMs = timeoutMs;
    }
    async read(input, context = {}) {
      var _a, _b, _c, _d, _e, _f;
      if ((_a = context.signal) == null ? void 0 : _a.aborted)
        return failure("cancelled", "Richiesta annullata");
      let path;
      try {
        path = localPath(input);
      } catch {
        return failure("invalid-data", "Richiesta catalogo non valida");
      }
      const controller2 = new AbortController();
      const cancel2 = () => controller2.abort();
      (_b = context.signal) == null ? void 0 : _b.addEventListener("abort", cancel2);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller2.abort();
      }, this.timeoutMs);
      let stage = "network";
      let reader;
      try {
        const response = await this.fetchResource(
          "http://127.0.0.1:17861" + path,
          {
            method: "GET",
            credentials: "omit",
            redirect: "error",
            cache: "no-store",
            signal: controller2.signal
          }
        );
        if (!/^application\/json(?:;|$)/i.test(
          response.headers.get("content-type") || ""
        ))
          return failure("invalid-data", "MIME locale non valido");
        const declared = response.headers.get("content-length");
        if (declared && (!/^\d+$/.test(declared) || Number(declared) > 11e5))
          return failure("invalid-data", "Risposta locale troppo grande");
        reader = (_c = response.body) == null ? void 0 : _c.getReader();
        if (!reader)
          return failure("unsupported", "Streaming HTTP non disponibile");
        const parts = [];
        let size = 0;
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 11e5) {
            await reader.cancel();
            return failure("invalid-data", "Limite risposta locale");
          }
          parts.push(part.value);
        }
        const joined = new Uint8Array(size);
        let offset = 0;
        for (const part of parts) {
          joined.set(part, offset);
          offset += part.length;
        }
        stage = "data";
        const data = JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(joined)
        );
        if (!data || typeof data !== "object")
          return failure("invalid-data", "Schema locale non valido");
        const envelope = data;
        if (envelope.protocol !== "p026-v1")
          return failure("invalid-data", "Protocollo catalogo non valido");
        if (!response.ok) {
          const permitted = [
            "CATALOG_NOT_AUTHORIZED",
            "DEVELOPMENT_LIMIT",
            "INVALID_REQUEST",
            "BUSY",
            "TIMEOUT",
            "CANCELLED",
            "CLIENT_CLOSED",
            "REMOTE_STATUS",
            "REMOTE_TYPE",
            "REMOTE_HEADERS",
            "REMOTE_READ",
            "RESPONSE_LIMIT",
            "INVALID_DATA",
            "TLS_VERIFICATION",
            "HTTPS_CONNECTION"
          ];
          const code = typeof envelope.error === "string" && permitted.includes(envelope.error) ? envelope.error : "HTTP_FAILURE";
          return failure(
            "http",
            code,
            response.status === 429 || response.status >= 500,
            response.status
          );
        }
        if (envelope.ok !== true)
          return failure("invalid-data", "Esito catalogo non valido");
        const value = (0, import_catalog_metadata3.validateData)(envelope.data);
        if (value.kind !== (input.op === "home" ? "home" : input.op === "detail" ? "detail" : "page"))
          return failure("invalid-data", "Operazione risposta non coerente");
        if (value.kind === "page" && "page" in input && value.pageNumber !== input.page)
          return failure("invalid-data", "Pagina risposta non coerente");
        if (value.kind === "page" && input.op === "catalog" && value.page.items.some(
          (item) => item.kind !== (input.type === "movie" ? "movie" : "tv-show")
        ))
          return failure("invalid-data", "Tipo catalogo non coerente");
        if (value.kind === "detail" && input.op === "detail" && (value.detail.id !== input.id || value.detail.kind !== (input.type === "movie" ? "movie" : "tv-show")))
          return failure("invalid-data", "Identit\xE0 dettaglio non coerente");
        return ((_d = context.signal) == null ? void 0 : _d.aborted) ? failure("cancelled", "Richiesta annullata") : success(value);
      } catch {
        return ((_e = context.signal) == null ? void 0 : _e.aborted) ? failure("cancelled", "Richiesta annullata") : timedOut ? failure("network", "Timeout catalogo", true) : stage === "network" ? failure("network", "Servizio catalogo non disponibile", true) : failure("invalid-data", "Risposta catalogo malformata");
      } finally {
        controller2.abort();
        if (reader) {
          try {
            await reader.cancel();
          } catch {
          }
        }
        clearTimeout(timer);
        (_f = context.signal) == null ? void 0 : _f.removeEventListener("abort", cancel2);
      }
    }
  };

  // src/catalog/ui.ts
  var import_catalog_metadata4 = __toESM(require_catalog_metadata(), 1);
  var root = document.getElementById("catalog-content");
  var title = document.getElementById("catalog-title");
  var status = document.getElementById("catalog-status");
  var source = "fixture";
  var registry;
  var catalog;
  var stack = [];
  var controller;
  var sequence = 0;
  var query = "";
  function setup() {
    registry = new ProviderRegistry();
    registry.register(
      new StreamingCommunityProvider(
        source === "fixture" ? new FixtureCatalogTransport() : new LocalCatalogTransport()
      )
    );
    catalog = new CatalogService(registry);
    document.getElementById("catalog-mode").textContent = source === "fixture" ? "FIXTURE SINTETICHE \u2014 nessun dato live. Permessi esterni non verificati." : import_catalog_metadata4.LIVE_APPROVED ? "SERVIZIO LOCALE \u2014 SOLO SVILUPPO: 20 richieste / 15 minuti, nessuna riproduzione." : "SERVIZIO LOCALE \u2014 recupero live disabilitato in attesa dei permessi.";
  }
  function text(message) {
    const p = document.createElement("p");
    p.textContent = message;
    root.appendChild(p);
  }
  function button(id, label, action) {
    const node = document.createElement("button");
    node.id = id;
    node.textContent = label;
    node.addEventListener("click", () => {
      try {
        action();
      } catch {
        status.textContent = "Operazione non riuscita";
      }
    });
    root.appendChild(node);
    return node;
  }
  function cancel() {
    sequence++;
    controller == null ? void 0 : controller.abort();
    controller = void 0;
  }
  function remember() {
    const top = stack[stack.length - 1];
    if (top && document.activeElement instanceof HTMLElement)
      top.focus = document.activeElement.id;
  }
  function render() {
    root.textContent = "";
    const view = stack[stack.length - 1];
    if (!view) return;
    title.textContent = view.title;
    button("nav-home", "Home", () => home());
    button("nav-search", "Ricerca", searchKeyboard);
    button("nav-movies", "Film", () => browse("movie", 1));
    button("nav-series", "Serie", () => browse("tv-show", 1));
    button("nav-back", "Indietro", back);
    button("nav-diagnostic", "Torna alla diagnostica", diagnostic);
    button("nav-fixture", "Usa fixture sintetiche", () => mode("fixture"));
    button(
      "nav-service",
      import_catalog_metadata4.LIVE_APPROVED ? "Servizio locale (test sviluppo live)" : "Servizio locale (live bloccato)",
      () => mode("service")
    );
    view.draw();
    const target = document.getElementById(view.focus || "") || root.querySelector("button");
    target == null ? void 0 : target.focus();
  }
  function push(view) {
    remember();
    stack.push(view);
    if (stack.length > 30) stack.shift();
    render();
  }
  function diagnostic() {
    cancel();
    location.href = new URL("./index.html#catalog", document.baseURI).href;
  }
  function back() {
    cancel();
    if (stack.length <= 1) {
      diagnostic();
      return;
    }
    stack.pop();
    render();
    status.textContent = "Indietro \u2014 focus ripristinato";
  }
  function mode(value) {
    cancel();
    source = value;
    setup();
    stack = [];
    home();
  }
  function open(heading, load, draw) {
    remember();
    cancel();
    const current = sequence;
    controller = new AbortController();
    push({
      title: heading,
      draw: () => text("Caricamento\u2026 Back annulla la richiesta.")
    });
    status.textContent = "Caricamento\u2026";
    void (async () => {
      let result;
      try {
        result = await load(controller.signal);
      } catch {
        result = failure("provider", "Operazione catalogo non riuscita");
      }
      if (current !== sequence) return;
      controller = void 0;
      const view = stack[stack.length - 1];
      if (result.ok) {
        const value = result.value;
        view.draw = () => draw(value);
        status.textContent = "Caricamento completato";
      } else {
        const message = result.error.code + ": " + result.error.message;
        view.draw = () => text(message);
        status.textContent = message;
      }
      render();
    })();
  }
  function items(values) {
    if (!values.length) text("Nessun risultato.");
    values.forEach((item) => {
      if (item.kind !== "movie" && item.kind !== "tv-show") return;
      button(
        "item-" + item.kind + "-" + item.id,
        (item.kind === "movie" ? "Film: " : "Serie: ") + item.title,
        () => detail(item)
      );
    });
  }
  function home() {
    open(
      "Home italiana",
      (signal) => catalog.home(import_catalog_metadata4.PROVIDER, { signal }),
      (categories) => {
        categories.forEach((category) => {
          text(category.title);
          items(category.items);
        });
      }
    );
  }
  function pages(value, number, next) {
    var _a;
    text(
      "Pagina " + number + (value.total === void 0 ? "" : " \xB7 " + value.total + " contenuti")
    );
    if (number > 1)
      button("previous-page", "Pagina precedente", () => next(number - 1));
    if (((_a = value.next) == null ? void 0 : _a.kind) === "number") {
      const n = value.next.number;
      button("next-page", "Pagina successiva", () => next(n));
    }
  }
  function browse(kind, number) {
    open(
      kind === "movie" ? "Catalogo film" : "Catalogo serie",
      (signal) => catalog.catalog(import_catalog_metadata4.PROVIDER, kind, { kind: "number", number }, { signal }),
      (value) => {
        items(value.items);
        pages(value, number, (n) => browse(kind, n));
      }
    );
  }
  function search(number = 1) {
    const term = query.trim();
    open(
      "Ricerca: " + term,
      (signal) => catalog.search(import_catalog_metadata4.PROVIDER, term, { kind: "number", number }, { signal }),
      (value) => {
        items(value.items);
        pages(value, number, search);
      }
    );
  }
  function searchKeyboard() {
    remember();
    cancel();
    push({
      title: "Ricerca con telecomando",
      draw: () => {
        const output = document.createElement("output");
        output.id = "search-query";
        output.textContent = query || "Scrivi con i tasti a schermo";
        root.appendChild(output);
        button("search-submit", "Cerca", () => {
          if (query.trim()) search();
          else status.textContent = "Inserire un testo";
        });
        button("search-clear", "Cancella tutto", () => {
          query = "";
          output.textContent = "Scrivi con i tasti a schermo";
        });
        button("search-space", "Spazio", () => {
          if (query.length < 120) query += " ";
          output.textContent = query;
        });
        button("search-delete", "Elimina ultimo", () => {
          query = query.slice(0, -1);
          output.textContent = query;
        });
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").forEach(
          (char) => button("key-" + char, char, () => {
            if (query.length < 120) query += char;
            output.textContent = query;
          })
        );
      }
    });
  }
  function detail(content) {
    open(
      "Dettaglio",
      (signal) => catalog.detail(content, { signal }),
      (value) => {
        var _a;
        text(value.title);
        text(((_a = value.overview) == null ? void 0 : _a.slice(0, 600)) || "Descrizione non disponibile.");
        text("Identit\xE0: " + value.providerId + "/" + value.kind + "/" + value.id);
        text("Riproduzione esclusa da P02.6.");
        if (value.kind === "tv-show")
          button("seasons", "Scegli stagione", () => seasons(value));
      }
    );
  }
  function seasons(show) {
    open(
      "Stagioni",
      (signal) => catalog.seasons(show, { signal }),
      (values) => {
        if (!values.length) text("Nessuna stagione disponibile.");
        values.forEach(
          (season) => button(
            "season-" + season.id,
            "Stagione " + season.number + " \xB7 " + (season.title || ""),
            () => episodes(season)
          )
        );
      }
    );
  }
  function episodes(season) {
    open(
      "Episodi \u2014 stagione " + season.number,
      (signal) => catalog.episodes(season, { kind: "number", number: 1 }, { signal }),
      (value) => {
        if (!value.items.length) text("Nessun episodio incluso nel dettaglio.");
        text(
          "Solo episodi inclusi nel dettaglio; completezza e paginazione non verificate."
        );
        value.items.forEach(
          (episode) => button(
            "episode-" + episode.id,
            episode.number + " \xB7 " + (episode.title || "Episodio"),
            () => {
              cancel();
              push({
                title: "Episodio " + episode.number,
                draw: () => {
                  var _a;
                  text(episode.title || "Episodio");
                  text(
                    ((_a = episode.overview) == null ? void 0 : _a.slice(0, 600)) || "Descrizione non disponibile."
                  );
                  text("Nessuna riproduzione in questa fase.");
                }
              });
            }
          )
        );
      }
    );
  }
  function move(action) {
    const current = document.activeElement;
    if (!current) return;
    const r = current.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best, score = Infinity;
    for (const node of Array.from(root.querySelectorAll("button"))) {
      if (node === current || node.disabled) continue;
      const b = node.getBoundingClientRect(), dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy;
      const primary = action === "left" ? -dx : action === "right" ? dx : action === "up" ? -dy : dy;
      const secondary = action === "left" || action === "right" ? Math.abs(dy) : Math.abs(dx);
      if (primary < 1) continue;
      const value = primary + secondary * 4;
      if (value < score) {
        score = value;
        best = node;
      }
    }
    if (best) {
      best.focus();
      best.scrollIntoView({ block: "nearest" });
    }
  }
  window.addEventListener("keydown", (event) => {
    var _a;
    const action = keyAction(event.key, event.keyCode);
    if (action === "unknown") return;
    event.preventDefault();
    if (event.repeat && !["up", "down", "left", "right"].includes(action)) return;
    if (["up", "down", "left", "right"].includes(action)) move(action);
    else if (action === "enter")
      (_a = document.activeElement) == null ? void 0 : _a.click();
    else if (action === "back") back();
    else
      status.textContent = "Catalogo metadati: nessun comando di riproduzione.";
  });
  window.addEventListener("pagehide", cancel);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && controller) {
      cancel();
      const view = stack[stack.length - 1];
      if (view)
        view.draw = () => text("Richiesta annullata: tornare indietro e riprovare.");
      render();
    }
  });
  document.getElementById("catalog-build").textContent = "0.1.7-dev.1-dev-metadata+f9f24857fb97";
  setup();
  home();
})();
