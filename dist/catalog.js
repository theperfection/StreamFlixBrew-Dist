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
      var PROVIDER5 = "streamingcommunity-it";
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
      function parseRoute3(url) {
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
          providerId: PROVIDER5,
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
                  show: { providerId: PROVIDER5, id: title2.id, kind: "tv-show" },
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
                    show: { providerId: PROVIDER5, id: title2.id, kind: "tv-show" },
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
          if (!object(item) || item.providerId !== PROVIDER5 || !validId(item.id) || item.kind !== "movie" && item.kind !== "tv-show")
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
              if (!object(s) || !object(s.show) || s.show.providerId !== PROVIDER5 || s.show.id !== d.id || s.show.kind !== "tv-show")
                invalid();
              return { id: s.id, number: s.number, name: s.title };
            });
          if (value.loadedSeason !== null) {
            var loaded = value.loadedSeason;
            if (!object(loaded)) invalid();
            props.loadedSeason = {
              id: loaded.id,
              episodes: list(loaded.episodes, 500).map(function(ep) {
                if (!object(ep) || ep.seasonId !== loaded.id || !object(ep.show) || ep.show.providerId !== PROVIDER5 || ep.show.id !== d.id || ep.show.kind !== "tv-show")
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
      exports.PROVIDER = PROVIDER5;
      exports.LIVE_APPROVED = LIVE_APPROVED2;
      exports.requestDescriptor = requestDescriptor3;
      exports.parseRoute = parseRoute3;
      exports.parseMetadata = parseMetadata2;
      exports.validateData = validateData2;
    }
  });

  // service/stream-policy.cjs
  var require_stream_policy = __commonJS({
    "service/stream-policy.cjs"(exports) {
      "use strict";
      var STREAM_LIVE_APPROVED = false;
      function invalid() {
        throw new Error("INVALID_REQUEST");
      }
      function positive(value) {
        return typeof value === "string" && /^[1-9][0-9]{0,9}$/.test(value);
      }
      function targetKey2(target) {
        if (!target || typeof target !== "object" || Array.isArray(target) || typeof target.title !== "string" || !/^[1-9][0-9]{0,9}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target.title || "") || target.title.length > 180)
          invalid();
        if (target.kind === "movie") {
          if (Object.keys(target).sort().join(",") !== "kind,title") invalid();
          return "movie:" + target.title;
        }
        if (target.kind !== "episode" || Object.keys(target).sort().join(",") !== "episode,episodeNumber,kind,seasonId,seasonNumber,title" || !positive(target.episode) || !positive(target.seasonId) || !positive(target.seasonNumber) || !positive(target.episodeNumber))
          invalid();
        return [
          "episode",
          target.title,
          target.seasonId,
          target.seasonNumber,
          target.episode,
          target.episodeNumber
        ].join(":");
      }
      function parseRoute3(path) {
        if (typeof path !== "string" || path.length > 700 || /[\s#\\]/.test(path))
          invalid();
        var pieces = path.split("?"), operation = pieces[0] === "/stream/servers" ? "servers" : pieces[0] === "/stream/resolve" ? "resolve" : "";
        if (!operation || pieces.length !== 2) invalid();
        var parameters = /* @__PURE__ */ Object.create(null);
        pieces[1].split("&").forEach(function(pair) {
          var parts = pair.split("=");
          if (parts.length !== 2 || !/^[a-zA-Z]+$/.test(parts[0]) || Object.prototype.hasOwnProperty.call(parameters, parts[0]))
            invalid();
          parameters[parts[0]] = decodeURIComponent(parts[1]);
        });
        var server;
        if (operation === "resolve") {
          server = parameters.server;
          if (server !== "vixcloud" && server !== "vixsrc") invalid();
          delete parameters.server;
        }
        targetKey2(parameters);
        return { operation, target: parameters, server };
      }
      exports.STREAM_LIVE_APPROVED = STREAM_LIVE_APPROVED;
      exports.targetKey = targetKey2;
      exports.parseRoute = parseRoute3;
      exports.handle = function(request, response, reply) {
        try {
          parseRoute3(request.url);
        } catch (invalidRequestError) {
          void invalidRequestError;
          reply(
            response,
            400,
            { protocol: "p027-v1", ok: false, error: "INVALID_REQUEST" },
            true
          );
          return;
        }
        reply(
          response,
          403,
          { protocol: "p027-v1", ok: false, error: "STREAM_ACCESS_RESTRICTED" },
          true
        );
      };
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

  // src/catalog/provider.ts
  var import_catalog_metadata2 = __toESM(require_catalog_metadata(), 1);

  // src/resolution/identity.ts
  var import_catalog_metadata = __toESM(require_catalog_metadata(), 1);
  var import_stream_policy = __toESM(require_stream_policy(), 1);
  function playableIdentity(target) {
    if (target.kind === "live") throw new Error("Live unsupported");
    const content = target.kind === "episode" ? target.episode.show : target.content;
    if (content.providerId !== import_catalog_metadata.PROVIDER || (target.kind === "movie" ? content.kind !== "movie" : target.kind !== "episode" || content.kind !== "tv-show"))
      throw new Error("Invalid playable");
    const identity = target.kind === "movie" ? { kind: "movie", title: content.id } : {
      kind: "episode",
      title: content.id,
      episode: target.episode.id,
      seasonId: target.episode.seasonId,
      seasonNumber: String(target.episode.seasonNumber),
      episodeNumber: String(target.episode.number)
    };
    (0, import_stream_policy.targetKey)(identity);
    return identity;
  }
  function serverIdentifier(extractor, target) {
    return extractor + ":" + (0, import_stream_policy.targetKey)(playableIdentity(target));
  }
  function serverIdentity(server, target) {
    try {
      const extractor = server.id.split(":")[0];
      if (extractor !== "vixcloud" && extractor !== "vixsrc") return false;
      if (server.providerId !== import_catalog_metadata.PROVIDER || !server.name || server.name.length > 80 || server.id !== serverIdentifier(extractor, target) || (0, import_stream_policy.targetKey)(playableIdentity(server.target)) !== (0, import_stream_policy.targetKey)(playableIdentity(target)) || !server.resource || server.resource.http)
        return false;
      const url = new URL(server.resource.url);
      return url.protocol === "https:" && !url.port && !url.username && !url.password && !url.hash && url.hostname === (extractor === "vixcloud" ? "vixcloud.co" : "vixsrc.to") && (extractor === "vixcloud" ? /^\/embed\/[1-9]\d{0,9}$/.test(url.pathname) && (url.search === "" || url.search === "?canPlayFHD=1") : !url.search && /^\/api\/(?:movie\/[1-9]\d{0,9}|tv\/[1-9]\d{0,9}\/[1-9]\d{0,3}\/[1-9]\d{0,3})$/.test(
        url.pathname
      ));
    } catch {
      return false;
    }
  }

  // src/catalog/provider.ts
  var StreamingCommunityProvider = class {
    constructor(transport, serverTransport) {
      this.transport = transport;
      this.serverTransport = serverTransport;
      this.id = import_catalog_metadata2.PROVIDER;
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
        playback: true
      };
      this.issuedServers = /* @__PURE__ */ new Map();
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
    getServers(target, context = {}) {
      return attempt(context, async () => {
        var _a;
        try {
          playableIdentity(target);
        } catch {
          return failure("invalid-data", "Identit\xE0 riproducibile non valida");
        }
        if (!this.serverTransport)
          return failure("unsupported", "Trasporto server non configurato");
        const result = await this.serverTransport.getServers(target, context);
        if (!result.ok) return result;
        if ((_a = context.signal) == null ? void 0 : _a.aborted)
          return failure("cancelled", "Elenco server annullato");
        if (result.value.length > 8)
          return failure("invalid-data", "Troppi server");
        const identities = /* @__PURE__ */ new Set();
        for (const server of result.value) {
          if (!serverIdentity(server, target) || identities.has(server.id))
            return failure("invalid-data", "Identit\xE0 server non valida");
          identities.add(server.id);
        }
        for (const [identifier, issued] of this.issuedServers) {
          if (serverIdentity(issued, target))
            this.issuedServers.delete(identifier);
        }
        if (this.issuedServers.size + result.value.length > 32)
          this.issuedServers.clear();
        for (const server of result.value)
          this.issuedServers.set(
            server.id,
            JSON.parse(JSON.stringify(server))
          );
        return result;
      });
    }
    getVideo(server, context = {}) {
      return attempt(context, async () => {
        const issued = this.issuedServers.get(server.id);
        if (!issued || !serverIdentity(server, issued.target) || JSON.stringify(server) !== JSON.stringify(issued) || !issued.resource)
          return failure("invalid-data", "Server non emesso o modificato");
        return success({
          kind: "extract",
          resource: { url: issued.resource.url },
          extractorId: issued.id.split(":")[0]
        });
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
        return loaded && loaded.id === season.id ? success({
          items: loaded.episodes.map((episode) => ({
            ...episode,
            seasonNumber: season.number
          }))
        }) : failure(
          "unsupported",
          "Episodi della stagione non inclusi nel dettaglio; route separata non verificata"
        );
      });
    }
  };

  // src/catalog/fixtures.ts
  var import_catalog_metadata3 = __toESM(require_catalog_metadata(), 1);
  function fixtureResponse(input) {
    (0, import_catalog_metadata3.requestDescriptor)(input);
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
        return ((_b = context.signal) == null ? void 0 : _b.aborted) ? failure("cancelled", "Richiesta annullata") : success((0, import_catalog_metadata3.parseMetadata)(input, response.body, response.mime));
      } catch {
        return failure("invalid-data", "Fixture o richiesta non valida");
      }
    }
  };

  // src/catalog/transport.ts
  var import_catalog_metadata4 = __toESM(require_catalog_metadata(), 1);
  function localPath(input) {
    (0, import_catalog_metadata4.requestDescriptor)(input);
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
    (0, import_catalog_metadata4.parseRoute)(path);
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
        const value = (0, import_catalog_metadata4.validateData)(envelope.data);
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
  var import_catalog_metadata6 = __toESM(require_catalog_metadata(), 1);

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

  // src/resolution/transport.ts
  var import_stream_policy2 = __toESM(require_stream_policy(), 1);
  function serverPath(target) {
    const identity = playableIdentity(target);
    const path = "/stream/servers?" + Object.entries(identity).map(([name, value]) => name + "=" + encodeURIComponent(value)).join("&");
    (0, import_stream_policy2.parseRoute)(path);
    return path;
  }
  var LocalServerTransport = class {
    constructor(fetchResource = (url, init) => fetch(url, init), timeoutMs = 14e3) {
      this.fetchResource = fetchResource;
      this.timeoutMs = timeoutMs;
    }
    async getServers(target, context = {}) {
      var _a, _b, _c, _d, _e, _f;
      if ((_a = context.signal) == null ? void 0 : _a.aborted)
        return failure("cancelled", "Richiesta server annullata");
      let path;
      try {
        path = serverPath(target);
      } catch {
        return failure("invalid-data", "Identit\xE0 server non valida");
      }
      const controller2 = new AbortController();
      const cancel2 = () => controller2.abort();
      (_b = context.signal) == null ? void 0 : _b.addEventListener("abort", cancel2);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller2.abort();
      }, this.timeoutMs);
      let parsing = false;
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
          return failure("invalid-data", "MIME server locale non valido");
        const length = response.headers.get("content-length");
        if (length && (!/^\d+$/.test(length) || Number(length) > 65536))
          return failure("invalid-data", "Limite risposta server");
        reader = (_c = response.body) == null ? void 0 : _c.getReader();
        if (!reader)
          return failure("unsupported", "Streaming HTTP non disponibile");
        const parts = [];
        let size = 0;
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 65536)
            return failure("invalid-data", "Limite risposta server");
          parts.push(part.value);
        }
        const joined = new Uint8Array(size);
        let offset = 0;
        for (const part of parts) {
          joined.set(part, offset);
          offset += part.length;
        }
        parsing = true;
        const envelope = JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(joined)
        );
        if ((_d = context.signal) == null ? void 0 : _d.aborted)
          return failure("cancelled", "Richiesta server annullata");
        if (!envelope || typeof envelope !== "object")
          return failure("invalid-data", "Risposta server non valida");
        const value = envelope;
        if (value.protocol !== "p027-v1" || value.ok !== false || response.ok)
          return failure(
            "invalid-data",
            "Successo live non verificato: risposta rifiutata"
          );
        const allowed = [
          "STREAM_ACCESS_RESTRICTED",
          "INVALID_REQUEST",
          "BUSY",
          "TIMEOUT"
        ];
        return failure(
          "http",
          typeof value.error === "string" && allowed.includes(value.error) ? value.error : "HTTP_FAILURE",
          response.status === 429 || response.status >= 500,
          response.status
        );
      } catch {
        return ((_e = context.signal) == null ? void 0 : _e.aborted) ? failure("cancelled", "Richiesta server annullata") : timedOut ? failure("network", "Timeout server", true) : parsing ? failure("invalid-data", "Risposta server malformata") : failure("network", "Servizio server non disponibile", true);
      } finally {
        controller2.abort();
        clearTimeout(timer);
        (_f = context.signal) == null ? void 0 : _f.removeEventListener("abort", cancel2);
        try {
          await (reader == null ? void 0 : reader.cancel());
        } catch {
        }
      }
    }
    getDocument() {
      return Promise.resolve(
        failure(
          "unsupported",
          "Documenti extractor live bloccati: accesso non verificato"
        )
      );
    }
  };

  // src/resolution/fixtures.ts
  var import_catalog_metadata5 = __toESM(require_catalog_metadata(), 1);
  var FixtureServerTransport = class {
    constructor() {
      this.resources = /* @__PURE__ */ new Map();
    }
    getServers(target, context = {}) {
      return attempt(context, async () => {
        try {
          playableIdentity(target);
        } catch {
          return failure("invalid-data", "Target fixture non valido");
        }
        const resources = {
          vixcloud: "https://vixcloud.co/embed/900001?canPlayFHD=1",
          vixsrc: target.kind === "episode" ? "https://vixsrc.to/api/tv/900099/" + target.episode.seasonNumber + "/" + target.episode.number : "https://vixsrc.to/api/movie/900098"
        };
        return success(
          ["vixcloud", "vixsrc"].map((extractor) => {
            this.resources.set(resources[extractor], extractor);
            return {
              id: serverIdentifier(extractor, target),
              providerId: import_catalog_metadata5.PROVIDER,
              name: (extractor === "vixcloud" ? "Vixcloud" : "VixSrc") + " \u2014 FIXTURE",
              target,
              resource: { url: resources[extractor] }
            };
          })
        );
      });
    }
    getDocument(resource, extractor, context = {}) {
      return attempt(context, async () => {
        if (this.resources.get(resource.url) !== extractor || resource.http)
          return failure("invalid-data", "Risorsa fixture non emessa");
        const html = "<html><script>window.video = {id: '900001', filename: 'SYNTHETIC'}; window.masterPlaylist = {params: {'token': 'SYNTHETIC-NOT-A-CREDENTIAL', 'expires': '4070908800'}, url: '/playlist/900001?b=1'}; window.canPlayFHD = true;<\/script></html>";
        return success(
          extractor === "vixcloud" ? { html } : {
            html,
            api: JSON.stringify({ src: "/embed/900001" }),
            embedUrl: "https://vixsrc.to/embed/900001"
          }
        );
      });
    }
  };

  // src/resolution/literals.ts
  function assignment(html, name) {
    if (html.length > 2097152 || /Access denied|cf-chl-|challenge-platform/i.test(html))
      throw new Error("Restricted or oversized document");
    function matchesOf(expression2, text2) {
      const values = [];
      let match;
      while (match = expression2.exec(text2)) values.push(match);
      return values;
    }
    const scripts = matchesOf(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi, html).map((match) => match[1]).join("\n");
    const expression = new RegExp("\\bwindow\\." + name + "\\s*=\\s*", "g");
    const matches = matchesOf(expression, scripts);
    if (matches.length !== 1) throw new Error("Missing or ambiguous assignment");
    let position = matches[0].index + matches[0][0].length;
    let count = 0;
    function whitespace() {
      while (/\s/.test(scripts[position] || "") && position < scripts.length)
        position++;
    }
    function string() {
      const quote = scripts[position++];
      let value2 = "";
      while (position < scripts.length) {
        const character = scripts[position++];
        if (character === quote) return value2;
        if (character === "\\") {
          const escaped = scripts[position++];
          const simple = {
            "\\": "\\",
            '"': '"',
            "'": "'",
            "/": "/",
            n: "\n",
            r: "\r",
            t: "	",
            b: "\b",
            f: "\f"
          };
          if (escaped === "u") {
            const digits = scripts.slice(position, position + 4);
            if (!/^[a-f0-9]{4}$/i.test(digits)) throw new Error("Escape");
            value2 += String.fromCharCode(parseInt(digits, 16));
            position += 4;
          } else if (escaped && Object.prototype.hasOwnProperty.call(simple, escaped))
            value2 += simple[escaped];
          else throw new Error("Escape");
        } else {
          if (!character || character.charCodeAt(0) < 32)
            throw new Error("String");
          value2 += character;
        }
        if (value2.length > 4096) throw new Error("String limit");
      }
      throw new Error("Unclosed string");
    }
    function value(depth) {
      if (depth > 6 || ++count > 100) throw new Error("Literal limit");
      whitespace();
      const character = scripts[position];
      if (character === '"' || character === "'") return string();
      if (character === "{") {
        position++;
        const object = /* @__PURE__ */ Object.create(null);
        whitespace();
        while (scripts[position] !== "}") {
          whitespace();
          let key;
          if (scripts[position] === '"' || scripts[position] === "'")
            key = string();
          else {
            const match = /^[A-Za-z_$][\w$]*/.exec(scripts.slice(position));
            if (!match) throw new Error("Key");
            key = match[0];
            position += key.length;
          }
          if (["__proto__", "constructor", "prototype"].includes(key) || Object.prototype.hasOwnProperty.call(object, key))
            throw new Error("Key collision");
          whitespace();
          if (scripts[position++] !== ":") throw new Error("Colon");
          object[key] = value(depth + 1);
          whitespace();
          if (scripts[position] !== ",") break;
          position++;
          whitespace();
        }
        if (scripts[position++] !== "}") throw new Error("Object");
        return object;
      }
      const literal = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?|true|false|null)(?![\w$.])/.exec(
        scripts.slice(position)
      );
      if (!literal) throw new Error("Expressions are unsupported");
      position += literal[0].length;
      return JSON.parse(literal[0]);
    }
    const result = value(0);
    whitespace();
    if (scripts[position] !== ";" || !result || typeof result !== "object")
      throw new Error("Assignment terminator");
    return result;
  }

  // src/resolution/extractors.ts
  function vixsrcEmbed(api) {
    if (api.length > 16384) throw new Error("API limit");
    const parsed = JSON.parse(api);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || Object.keys(parsed).join() !== "src")
      throw new Error("API schema");
    const source2 = parsed.src;
    if (typeof source2 !== "string" || source2.length > 2048 || /[\s\\#]/.test(source2))
      throw new Error("Embed URL");
    const url = new URL(source2, "https://vixsrc.to/");
    if (url.origin !== "https://vixsrc.to" || url.username || url.password || !/^\/embed\/[1-9]\d{0,9}$/.test(url.pathname))
      throw new Error("Unverified embed route");
    url.searchParams.forEach((value, key) => {
      if (!["token", "expires", "canPlayFHD"].includes(key) || !/^[A-Za-z0-9_.~-]{1,512}$/.test(value) || url.searchParams.getAll(key).length !== 1)
        throw new Error("Embed parameters");
    });
    return url.href;
  }
  function playlistVideo(html, extractor, resource, embedUrl, now = Date.now()) {
    try {
      const origin = extractor === "vixcloud" ? "https://vixcloud.co" : "https://vixsrc.to";
      const embed = new URL(embedUrl);
      if (embed.origin !== origin || embed.username || embed.password || !/^\/embed\/[1-9]\d{0,9}$/.test(embed.pathname) || embed.hash || resource.http)
        throw new Error("Embed identity");
      const video = assignment(html, "video"), master = assignment(html, "masterPlaylist");
      const videoId = String(video.id);
      if (!/^[1-9]\d{0,9}$/.test(videoId) || !master.params || typeof master.params !== "object" || Array.isArray(master.params))
        throw new Error("Video/params schema");
      const parameters = master.params;
      if (Object.keys(parameters).some((key) => !["token", "expires"].includes(key)))
        return failure("unsupported", "Parametri playlist non verificati");
      const token = parameters.token, expires = String(parameters.expires);
      if (typeof token !== "string" || !/^[A-Za-z0-9_.~-]{1,512}$/.test(token) || !/^[1-9]\d{8,11}$/.test(expires))
        throw new Error("Token/expiry");
      const expiresAt = Number(expires) * 1e3;
      if (!Number.isSafeInteger(expiresAt)) throw new Error("Expiry limit");
      if (expiresAt <= now)
        return failure(
          "expired",
          "URL temporaneo scaduto: risolvere nuovamente, nessun retry automatico"
        );
      if (typeof master.url !== "string") throw new Error("Master URL");
      const masterUrl = new URL(master.url, origin);
      if (masterUrl.origin !== origin || masterUrl.pathname !== "/playlist/" + videoId || masterUrl.username || masterUrl.password || masterUrl.hash)
        throw new Error("Playlist destination");
      masterUrl.searchParams.forEach((value, key) => {
        if (key !== "b" || value !== "1" || masterUrl.searchParams.getAll(key).length !== 1)
          throw new Error("Playlist parameters");
      });
      const playlist = new URL("/playlist/" + videoId, origin);
      playlist.searchParams.set("token", token);
      playlist.searchParams.set("expires", expires);
      if (masterUrl.searchParams.get("b") === "1")
        playlist.searchParams.set("b", "1");
      const fullHd = extractor === "vixcloud" ? embed.searchParams.get("canPlayFHD") === "1" : /\bwindow\.canPlayFHD\s*=\s*true\s*;/.test(html);
      if (fullHd) playlist.searchParams.set("h", "1");
      playlist.searchParams.set(
        extractor === "vixcloud" ? "language" : "lang",
        "it"
      );
      return success({
        url: playlist.href,
        format: "hls",
        expiresAt,
        subtitles: [],
        audioTracks: [],
        http: {
          referer: extractor === "vixcloud" ? origin + "/" : embed.href,
          headers: {
            "User-Agent": extractor === "vixcloud" ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
          },
          ...extractor === "vixcloud" ? { cookies: { mode: "explicit", header: "language=it" } } : {},
          token: { value: token, location: "query", name: "token" },
          maintainToken: true
        }
      });
    } catch {
      return failure(
        "invalid-data",
        "Documento extractor non valido o schema non verificato"
      );
    }
  }
  var VixcloudExtractor = class {
    constructor(transport, clock = () => Date.now()) {
      this.transport = transport;
      this.clock = clock;
      this.id = "vixcloud";
      this.hosts = ["vixcloud.co"];
    }
    extract(resource, context = {}) {
      return attempt(context, async () => {
        const embed = new URL(resource.url);
        if (resource.http || embed.origin !== "https://vixcloud.co" || embed.username || embed.password || embed.hash || !/^\/embed\/[1-9]\d{0,9}$/.test(embed.pathname) || embed.search !== "" && embed.search !== "?canPlayFHD=1")
          return failure("invalid-data", "Risorsa Vixcloud non verificata");
        const document2 = await this.transport.getDocument(
          resource,
          "vixcloud",
          context
        );
        return document2.ok ? playlistVideo(
          document2.value.html,
          "vixcloud",
          resource,
          resource.url,
          this.clock()
        ) : document2;
      });
    }
  };
  var VixSrcExtractor = class {
    constructor(transport, clock = () => Date.now()) {
      this.transport = transport;
      this.clock = clock;
      this.id = "vixsrc";
      this.hosts = ["vixsrc.to"];
    }
    extract(resource, context = {}) {
      return attempt(context, async () => {
        const apiUrl = new URL(resource.url);
        if (resource.http || apiUrl.origin !== "https://vixsrc.to" || apiUrl.search || apiUrl.hash || apiUrl.username || apiUrl.password || !/^\/api\/(?:movie\/[1-9]\d{0,9}|tv\/[1-9]\d{0,9}\/[1-9]\d{0,3}\/[1-9]\d{0,3})$/.test(
          apiUrl.pathname
        ))
          return failure("invalid-data", "API VixSrc non verificata");
        const document2 = await this.transport.getDocument(
          resource,
          "vixsrc",
          context
        );
        if (!document2.ok) return document2;
        try {
          const embed = vixsrcEmbed(document2.value.api || "");
          if (document2.value.embedUrl !== embed)
            return failure(
              "invalid-data",
              "Embed non corrispondente alla risposta API"
            );
          return playlistVideo(
            document2.value.html,
            "vixsrc",
            resource,
            embed,
            this.clock()
          );
        } catch {
          return failure("invalid-data", "Risposta API VixSrc non valida");
        }
      });
    }
  };

  // src/catalog/ui.ts
  var root = document.getElementById("catalog-content");
  var title = document.getElementById("catalog-title");
  var status = document.getElementById("catalog-status");
  var source = "fixture";
  var registry;
  var catalog;
  var resolver;
  var stack = [];
  var controller;
  var sequence = 0;
  var query = "";
  function setup() {
    registry = new ProviderRegistry();
    const serverTransport = source === "fixture" ? new FixtureServerTransport() : new LocalServerTransport();
    registry.register(
      new StreamingCommunityProvider(
        source === "fixture" ? new FixtureCatalogTransport() : new LocalCatalogTransport(),
        serverTransport
      )
    );
    catalog = new CatalogService(registry);
    const extractors = new ExtractorRegistry();
    extractors.register(new VixcloudExtractor(serverTransport));
    extractors.register(new VixSrcExtractor(serverTransport));
    resolver = new StreamResolver(registry, extractors);
    document.getElementById("catalog-mode").textContent = source === "fixture" ? "FIXTURE SINTETICHE \u2014 nessun dato live. Permessi esterni non verificati." : import_catalog_metadata6.LIVE_APPROVED ? "SERVIZIO LOCALE \u2014 SOLO SVILUPPO: 20 richieste / 15 minuti, nessuna riproduzione." : "SERVIZIO LOCALE \u2014 recupero live disabilitato in attesa dei permessi.";
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
      import_catalog_metadata6.LIVE_APPROVED ? "Servizio locale (test sviluppo live)" : "Servizio locale (live bloccato)",
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
      (signal) => catalog.home(import_catalog_metadata6.PROVIDER, { signal }),
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
      (signal) => catalog.catalog(import_catalog_metadata6.PROVIDER, kind, { kind: "number", number }, { signal }),
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
      (signal) => catalog.search(import_catalog_metadata6.PROVIDER, term, { kind: "number", number }, { signal }),
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
        text(
          "Riproduzione esclusa: P02.7 separa disponibilit\xE0, risoluzione e compatibilit\xE0."
        );
        if (value.kind === "movie")
          button(
            "servers",
            "Scegli server",
            () => servers({ kind: "movie", content: value })
          );
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
                  text("Nessuna riproduzione live in questa fase.");
                  button(
                    "servers",
                    "Scegli server episodio",
                    () => servers({ kind: "episode", episode })
                  );
                }
              });
            }
          )
        );
      }
    );
  }
  function servers(target) {
    open(
      "Server disponibili",
      (signal) => catalog.servers(target, { signal }),
      (values) => {
        text(
          source === "fixture" ? "FIXTURE: server sintetici, nessuna disponibilit\xE0 live verificata." : "Elenco server live: nessuna prova di riproducibilit\xE0."
        );
        if (!values.length) text("Nessun server disponibile nella risposta.");
        values.forEach(
          (server) => button("server-" + server.id, server.name, () => resolveServer(server))
        );
      }
    );
  }
  function resolveServer(server) {
    open(
      "Risoluzione server",
      (signal) => resolver.resolve(server, { signal }),
      (video) => {
        text("Server selezionato: " + server.name);
        text(
          "Risoluzione URL: completata" + (source === "fixture" ? " su dati SINTETICI." : ".")
        );
        text(
          "Formato: " + video.format + ". URL e credenziali non mostrati n\xE9 salvati."
        );
        const compatible = adaptVideo(video);
        text(
          compatible.ok ? "Compatibilit\xE0 HTTP: ammessa dall'adapter; HTTP/CORS e media non ancora provati." : "Compatibilit\xE0 HTTP/player: " + compatible.error.code + " \u2014 " + compatible.error.message
        );
        text(
          "Riproduzione effettiva: NON AVVIATA. Tornare indietro per cambiare server."
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
  document.getElementById("catalog-build").textContent = "0.1.7-dev.2-dev-metadata+9008331b3ff6";
  setup();
  home();
})();
