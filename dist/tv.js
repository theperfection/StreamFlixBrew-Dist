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
      var PROVIDER4 = "streamingcommunity-it";
      var HOST = "streamingunity.fun";
      var LIVE_APPROVED3 = true;
      function invalid() {
        throw new Error("INVALID_DATA");
      }
      function object(value) {
        return value && typeof value === "object" && !Array.isArray(value);
      }
      function text(value, max, optional) {
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
          var q = text(input.q, 120, false);
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
      var ARTWORK_BASE = "https://cdn.streamingunity.fun/images/";
      var ARTWORK_FILENAME = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;
      function artworkFilename(images, type) {
        if (!LIVE_APPROVED3 || images === void 0 || images === null)
          return void 0;
        var selected;
        list(images, 100).forEach(function(image) {
          if (!object(image)) invalid();
          if (image.type !== type) return;
          if (typeof image.filename !== "string" || image.filename.length !== 41 || !ARTWORK_FILENAME.test(image.filename))
            invalid();
          if (selected === void 0) selected = image.filename;
        });
        return selected;
      }
      function withArtwork(target, images, posterType, includeBanner) {
        var poster = artworkFilename(images, posterType);
        var banner = includeBanner ? artworkFilename(images, "background") : void 0;
        if (poster !== void 0) target.poster = ARTWORK_BASE + poster;
        if (banner !== void 0) target.banner = ARTWORK_BASE + banner;
        return target;
      }
      function dtoImages(item, posterType, includeBanner) {
        if (!LIVE_APPROVED3) return void 0;
        var images = [];
        function add(value, type) {
          if (value === void 0) return;
          if (typeof value !== "string" || value.indexOf(ARTWORK_BASE) !== 0 || value.length !== ARTWORK_BASE.length + 41 || !ARTWORK_FILENAME.test(value.slice(ARTWORK_BASE.length)))
            invalid();
          images.push({ type, filename: value.slice(ARTWORK_BASE.length) });
        }
        add(item.poster, posterType);
        if (includeBanner) add(item.banner, "background");
        return images;
      }
      function summary(raw) {
        if (!object(raw)) invalid();
        var id = identity(raw.id), slug = text(raw.slug, 180, false);
        if (!validId(id + "-" + slug) || raw.type !== "movie" && raw.type !== "tv")
          invalid();
        var value = {
          providerId: PROVIDER4,
          id: id + "-" + slug,
          kind: raw.type === "movie" ? "movie" : "tv-show",
          title: text(raw.name, 300, false)
        };
        var plot = text(raw.plot, 6e3, true);
        if (plot !== void 0) value.overview = plot;
        return withArtwork(value, raw.images, "poster", true);
      }
      function unique(items) {
        var seen = /* @__PURE__ */ Object.create(null);
        items.forEach(function(item) {
          if (seen[item.id]) invalid();
          seen[item.id] = true;
        });
        return items;
      }
      function categories2(sliders) {
        return list(sliders, 30).map(function(slider, index) {
          if (!object(slider)) invalid();
          return {
            id: "slider-" + index,
            title: text(
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
            return { kind: "home", categories: categories2(props.sliders) };
          var title = summary(props.title);
          if (title.id !== input.id || (title.kind === "movie" ? "movie" : "tv") !== input.type)
            invalid();
          title.genres = [];
          title.directors = [];
          title.cast = [];
          title.recommendations = [];
          var seasons = [];
          if (title.kind === "tv-show")
            seasons = unique(
              list(props.title.seasons, 100).map(function(season) {
                if (!object(season)) invalid();
                if (season.title_id !== void 0 && identity(season.title_id) !== input.id.split("-")[0])
                  invalid();
                return withArtwork(
                  {
                    id: identity(season.id),
                    show: { providerId: PROVIDER4, id: title.id, kind: "tv-show" },
                    number: integer(season.number, 0, 1e4),
                    title: text(season.name, 300, true)
                  },
                  season.images,
                  "poster",
                  false
                );
              })
            );
          if (title.kind === "tv-show") title.seasons = seasons;
          var loaded = null;
          if (props.loadedSeason !== void 0 && props.loadedSeason !== null) {
            if (title.kind !== "tv-show" || !object(props.loadedSeason)) invalid();
            var seasonId = identity(props.loadedSeason.id);
            if (!seasons.some(function(s) {
              return s.id === seasonId;
            }))
              invalid();
            if (props.loadedSeason.title_id !== void 0 && identity(props.loadedSeason.title_id) !== input.id.split("-")[0])
              invalid();
            var matchedSeason = seasons.filter(function(s) {
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
                  return withArtwork(
                    {
                      id: identity(episode.id),
                      seasonId,
                      show: { providerId: PROVIDER4, id: title.id, kind: "tv-show" },
                      number: integer(episode.number, 0, 1e4),
                      title: text(episode.name, 300, true),
                      overview: text(episode.plot, 6e3, true)
                    },
                    episode.images,
                    "cover",
                    false
                  );
                })
              )
            };
          }
          return { kind: "detail", detail: title, loadedSeason: loaded };
        }
        if (!/^application\/json(?:;|$)/i.test(mime)) invalid();
        var raw = JSON.parse(body);
        if (!object(raw)) invalid();
        var current = integer(raw.current_page, 1, 1e4), last = integer(raw.last_page, 1, 1e4);
        var per = integer(raw.per_page, 1, 100), total = integer(raw.total, 0, 1e6);
        var items = unique(list(raw.data, per).map(summary));
        if (current !== input.page || current > last || total < items.length || last !== Math.max(1, Math.ceil(total / per)))
          invalid();
        if (input.op === "catalog" && items.some(function(item) {
          return item.kind !== (input.type === "movie" ? "movie" : "tv-show");
        }))
          invalid();
        return {
          kind: "page",
          pageNumber: current,
          page: {
            items,
            total,
            next: current < last ? { kind: "number", number: current + 1 } : void 0
          }
        };
      }
      function validateData2(value) {
        function raw(item) {
          if (!object(item) || item.providerId !== PROVIDER4 || !validId(item.id) || item.kind !== "movie" && item.kind !== "tv-show")
            invalid();
          var at = item.id.indexOf("-");
          return {
            id: item.id.slice(0, at),
            slug: item.id.slice(at + 1),
            name: item.title,
            type: item.kind === "movie" ? "movie" : "tv",
            plot: item.overview,
            images: dtoImages(item, "poster", true)
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
                title: text(cat.title, 300, false),
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
          var items = unique(
            list(value.page.items, 100).map(function(item) {
              return summary(raw(item));
            })
          );
          if (total < items.length) invalid();
          return {
            kind: "page",
            pageNumber: n,
            page: {
              items,
              total,
              next: next ? { kind: "number", number: next.number } : void 0
            }
          };
        }
        if (value.kind === "detail") {
          var d = value.detail, r = raw(d), props = { locale: "it", title: r };
          if (r.type === "tv")
            r.seasons = list(d.seasons, 100).map(function(s) {
              if (!object(s) || !object(s.show) || s.show.providerId !== PROVIDER4 || s.show.id !== d.id || s.show.kind !== "tv-show")
                invalid();
              return {
                id: s.id,
                number: s.number,
                name: s.title,
                images: dtoImages(s, "poster", false)
              };
            });
          if (value.loadedSeason !== null) {
            var loaded = value.loadedSeason;
            if (!object(loaded)) invalid();
            props.loadedSeason = {
              id: loaded.id,
              episodes: list(loaded.episodes, 500).map(function(ep) {
                if (!object(ep) || ep.seasonId !== loaded.id || !object(ep.show) || ep.show.providerId !== PROVIDER4 || ep.show.id !== d.id || ep.show.kind !== "tv-show")
                  invalid();
                return {
                  id: ep.id,
                  number: ep.number,
                  name: ep.title,
                  plot: ep.overview,
                  images: dtoImages(ep, "cover", false)
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
      exports.PROVIDER = PROVIDER4;
      exports.LIVE_APPROVED = LIVE_APPROVED3;
      exports.requestDescriptor = requestDescriptor3;
      exports.parseRoute = parseRoute2;
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
      function parseRoute2(path) {
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
      exports.parseRoute = parseRoute2;
      exports.handle = function(request, response, reply) {
        try {
          parseRoute2(request.url);
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
    detail(content2, context = {}) {
      return this.call(
        content2.providerId,
        context,
        (provider) => provider.capabilities.content.includes(content2.kind) ? provider.getDetail(content2, context) : Promise.resolve(failure("unsupported", "Content kind unavailable"))
      );
    }
    seasons(content2, context = {}) {
      if (content2.kind !== "tv-show")
        return Promise.resolve(
          failure("unsupported", "Seasons require a TV show")
        );
      return this.call(
        content2.providerId,
        context,
        (provider) => {
          var _a, _b;
          return (_b = (_a = provider.getSeasons) == null ? void 0 : _a.call(provider, content2, context)) != null ? _b : Promise.resolve(failure("unsupported", "Seasons unavailable"));
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
      const content2 = target.kind === "episode" ? target.episode.show : target.content;
      if ((target.kind === "episode" ? "tv-show" : target.kind) !== content2.kind)
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
  var import_catalog_metadata2 = __toESM(require_catalog_metadata(), 1);

  // src/resolution/identity.ts
  var import_catalog_metadata = __toESM(require_catalog_metadata(), 1);
  var import_stream_policy = __toESM(require_stream_policy(), 1);
  function playableIdentity(target) {
    if (target.kind === "live") throw new Error("Live unsupported");
    const content2 = target.kind === "episode" ? target.episode.show : target.content;
    if (content2.providerId !== import_catalog_metadata.PROVIDER || (target.kind === "movie" ? content2.kind !== "movie" : target.kind !== "episode" || content2.kind !== "tv-show"))
      throw new Error("Invalid playable");
    const identity = target.kind === "movie" ? { kind: "movie", title: content2.id } : {
      kind: "episode",
      title: content2.id,
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
      this.search = (query, page, context) => attempt(context, async () => {
        if (page.kind !== "number")
          return failure("unsupported", "Solo pagine numeriche");
        const result = await this.transport.read(
          { op: "search", q: query.trim(), page: page.number },
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
    valid(content2) {
      return content2.providerId === this.id && (content2.kind === "movie" || content2.kind === "tv-show");
    }
    getHome(context = {}) {
      return attempt(context, async () => {
        const result = await this.transport.read({ op: "home" }, context);
        return result.ok ? result.value.kind === "home" ? success(result.value.categories) : failure("invalid-data", "Home non valida") : result;
      });
    }
    detailData(content2, context) {
      if (!this.valid(content2))
        return Promise.resolve(
          failure("invalid-data", "Identit\xE0 provider non valida")
        );
      return this.transport.read(
        {
          op: "detail",
          id: content2.id,
          type: content2.kind === "movie" ? "movie" : "tv"
        },
        context
      );
    }
    getDetail(content2, context = {}) {
      return attempt(context, async () => {
        const result = await this.detailData(content2, context);
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
      const items = input.op === "catalog" ? input.type === "movie" ? [film, film2] : [serie] : [film, film2, serie].filter(
        (v) => v.name.toLowerCase().includes(input.q.toLowerCase())
      );
      const per = 1, page = input.page;
      return {
        mime: "application/json",
        body: JSON.stringify({
          current_page: page,
          last_page: Math.max(1, items.length),
          per_page: per,
          total: items.length,
          data: items.slice(page - 1, page)
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
      const controller = new AbortController();
      const cancel2 = () => controller.abort();
      (_b = context.signal) == null ? void 0 : _b.addEventListener("abort", cancel2);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.timeoutMs);
      let stage2 = "network";
      let reader;
      try {
        const response = await this.fetchResource(
          "http://127.0.0.1:17861" + path,
          {
            method: "GET",
            credentials: "omit",
            redirect: "error",
            cache: "no-store",
            signal: controller.signal
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
        stage2 = "data";
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
        return ((_e = context.signal) == null ? void 0 : _e.aborted) ? failure("cancelled", "Richiesta annullata") : timedOut ? failure("network", "Timeout catalogo", true) : stage2 === "network" ? failure("network", "Servizio catalogo non disponibile", true) : failure("invalid-data", "Risposta catalogo malformata");
      } finally {
        controller.abort();
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

  // src/tv/ui.ts
  var import_catalog_metadata6 = __toESM(require_catalog_metadata(), 1);

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

  // src/tv/layout.ts
  var TV_LOGICAL_WIDTH = 1120;
  var TV_LOGICAL_HEIGHT = 630;
  function fitTvViewport(width, height) {
    const scale2 = Math.min(width / TV_LOGICAL_WIDTH, height / TV_LOGICAL_HEIGHT);
    return {
      scale: scale2,
      left: (width - TV_LOGICAL_WIDTH * scale2) / 2,
      top: (height - TV_LOGICAL_HEIGHT * scale2) / 2
    };
  }

  // src/tv/artwork-policy.ts
  var import_catalog_metadata5 = __toESM(require_catalog_metadata(), 1);
  var artworkPolicy = { approvedHosts: [] };
  if (import_catalog_metadata5.LIVE_APPROVED) artworkPolicy.approvedHosts = ["cdn.streamingunity.fun"];
  function artworkUrl(value, policy = artworkPolicy) {
    if (typeof value !== "string" || !value || value.length > 2048 || /[\s\\]/.test(value) || value.includes("%") || /\/\.\.?\//.test(value))
      return;
    try {
      const url = new URL(value, policy.relativeBase);
      if (!policy.relativeBase && value !== url.href || url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || !policy.approvedHosts.includes(url.hostname) || !/^\/images\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(
        url.pathname
      ))
        return;
      return url.href;
    } catch {
      return;
    }
  }

  // src/tv/artwork.ts
  var TvArtwork = class {
    constructor(root, available, policy = artworkPolicy) {
      this.root = root;
      this.available = available;
      this.policy = policy;
      this.known = /* @__PURE__ */ new WeakMap();
      this.slots = /* @__PURE__ */ new Map();
      this.activeUrls = /* @__PURE__ */ new Set();
      this.scheduled = false;
      this.retainedPixels = 0;
      this.paused = false;
      this.refreshScheduled = false;
      this.refreshVisibility = () => {
        this.slots.forEach((slot) => {
          const rect = slot.target.getBoundingClientRect();
          let left = Math.max(0, rect.left), top = Math.max(0, rect.top);
          let right = Math.min(window.innerWidth, rect.right), bottom = Math.min(window.innerHeight, rect.bottom);
          for (let parent = slot.target.parentElement; parent; parent = parent.parentElement) {
            const style = window.getComputedStyle(parent);
            const bounds = parent.getBoundingClientRect();
            if (/(auto|scroll|hidden)/.test(style.overflowX)) {
              left = Math.max(left, bounds.left);
              right = Math.min(right, bounds.right);
            }
            if (/(auto|scroll|hidden)/.test(style.overflowY)) {
              top = Math.max(top, bounds.top);
              bottom = Math.min(bottom, bounds.bottom);
            }
          }
          slot.visible = right > left && bottom > top;
          if (!slot.visible) this.unload(slot);
        });
        this.schedule();
      };
      if (typeof IntersectionObserver !== "undefined")
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const slot = this.slots.get(entry.target);
              if (!slot) return;
              slot.visible = entry.isIntersecting && entry.intersectionRatio > 0;
              if (!slot.visible) this.unload(slot);
            });
            this.schedule();
          },
          { threshold: [0, 0.01] }
        );
      root.addEventListener("scroll", this.refreshVisibility, true);
      window.addEventListener("resize", this.refreshVisibility);
    }
    bind(target, value, priority = 2) {
      var _a, _b;
      const url = artworkUrl(value, this.policy);
      if (url && ((_a = this.known.get(target)) == null ? void 0 : _a.url) === url) return;
      const previous = this.slots.get(target);
      if (previous) {
        this.unload(previous);
        (_b = this.observer) == null ? void 0 : _b.unobserve(target);
        this.slots.delete(target);
      }
      this.known.delete(target);
      target.classList.remove("has-artwork");
      if (!url) {
        delete target.dataset.tvArtwork;
        return;
      }
      target.dataset.tvArtwork = "pending";
      this.known.set(target, { url, priority });
      if (!this.refreshScheduled) {
        this.refreshScheduled = true;
        void Promise.resolve().then(() => {
          this.refreshScheduled = false;
          this.refresh();
        });
      }
    }
    refresh() {
      this.slots.forEach((slot, target) => {
        var _a;
        if (!this.root.contains(target) || !this.available(target) || this.paused) {
          this.unload(slot);
          (_a = this.observer) == null ? void 0 : _a.unobserve(target);
          this.slots.delete(target);
        }
      });
      if (this.paused) return;
      this.root.querySelectorAll("[data-tv-artwork]").forEach((target) => {
        const data = this.known.get(target);
        if (!data || this.slots.has(target) || !this.available(target)) return;
        const slot = {
          target,
          ...data,
          visible: false,
          loading: false,
          failed: false
        };
        this.slots.set(target, slot);
        if (this.observer) this.observer.observe(target);
      });
      this.refreshVisibility();
    }
    schedule() {
      if (this.scheduled || this.paused) return;
      this.scheduled = true;
      void Promise.resolve().then(() => {
        this.scheduled = false;
        this.drain();
      });
    }
    drain() {
      if (this.paused) return;
      const waiting = Array.from(this.slots.values()).filter((slot) => slot.visible && !slot.image && !slot.failed).sort((first, second) => first.priority - second.priority);
      for (const slot of waiting) {
        if (this.activeUrls.size >= 4) break;
        if (this.activeUrls.has(slot.url)) continue;
        this.load(slot);
      }
    }
    load(slot) {
      const image = document.createElement("img");
      image.className = "tv-artwork-image";
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.referrerPolicy = "no-referrer";
      slot.image = image;
      slot.loading = true;
      this.activeUrls.add(slot.url);
      const complete = (success2) => {
        if (slot.image !== image || !slot.loading) return;
        slot.loading = false;
        this.activeUrls.delete(slot.url);
        window.clearTimeout(slot.timer);
        image.onload = null;
        image.onerror = null;
        if (success2 && image.naturalWidth > 0 && image.naturalWidth * image.naturalHeight <= 8388608 && this.retainedPixels + image.naturalWidth * image.naturalHeight <= 16777216) {
          slot.pixels = image.naturalWidth * image.naturalHeight;
          this.retainedPixels += slot.pixels;
          slot.target.classList.add("has-artwork");
          slot.target.dataset.tvArtwork = "loaded";
        } else {
          slot.failed = true;
          this.unload(slot);
          slot.target.dataset.tvArtwork = "error";
        }
        this.schedule();
      };
      image.onload = () => complete(true);
      image.onerror = () => complete(false);
      slot.timer = window.setTimeout(() => complete(false), 8e3);
      slot.target.appendChild(image);
      image.src = slot.url;
    }
    unload(slot) {
      this.retainedPixels -= slot.pixels || 0;
      slot.pixels = void 0;
      window.clearTimeout(slot.timer);
      if (slot.loading) this.activeUrls.delete(slot.url);
      slot.loading = false;
      if (slot.image) {
        slot.image.onload = null;
        slot.image.onerror = null;
        slot.image.removeAttribute("src");
        slot.image.remove();
        slot.image = void 0;
      }
      slot.target.classList.remove("has-artwork");
      slot.target.dataset.tvArtwork = slot.failed ? "error" : "pending";
    }
    pause() {
      this.paused = true;
      this.refresh();
    }
    resume() {
      this.paused = false;
      this.refresh();
    }
  };

  // src/tv/details.ts
  function detailMetadata(detail2) {
    var _a, _b;
    return [
      "\u2605 " + (detail2.rating === void 0 ? "N/A" : detail2.rating.toFixed(1)),
      (_a = detail2.quality) == null ? void 0 : _a.toUpperCase(),
      (_b = detail2.released) == null ? void 0 : _b.slice(0, 4),
      detail2.runtimeMinutes === void 0 ? void 0 : detail2.runtimeMinutes >= 60 ? Math.floor(detail2.runtimeMinutes / 60) + " h " + detail2.runtimeMinutes % 60 + " min" : detail2.runtimeMinutes + " min"
    ].filter((value) => value !== void 0 && value !== "");
  }
  function moveDetailFocus(rows, identifier, direction) {
    var _a, _b;
    const rowIndex = rows.findIndex((row) => row.includes(identifier));
    if (rowIndex < 0) return (_a = rows[0]) == null ? void 0 : _a[0];
    const columnIndex = rows[rowIndex].indexOf(identifier);
    const nextRowIndex = Math.max(
      0,
      Math.min(
        rows.length - 1,
        rowIndex + (direction === "up" ? -1 : direction === "down" ? 1 : 0)
      )
    );
    const nextColumnIndex = nextRowIndex === rowIndex ? Math.max(
      0,
      Math.min(
        rows[rowIndex].length - 1,
        columnIndex + (direction === "left" ? -1 : direction === "right" ? 1 : 0)
      )
    ) : Math.min(columnIndex, rows[nextRowIndex].length - 1);
    return (_b = rows[nextRowIndex]) == null ? void 0 : _b[nextColumnIndex];
  }
  var TvDetails = class {
    constructor(surface, catalog2, close, artwork2) {
      this.surface = surface;
      this.catalog = catalog2;
      this.close = close;
      this.artwork = artwork2;
      this.rows = [];
      this.history = [];
      this.requestSequence = 0;
      this.disposed = false;
    }
    dispose() {
      this.disposed = true;
      this.cancel();
      this.history = [];
      this.surface.classList.remove("tv-details");
      Object.keys(this.surface.dataset).forEach(
        (key) => delete this.surface.dataset[key]
      );
    }
    cancel() {
      var _a;
      this.requestSequence++;
      (_a = this.requestController) == null ? void 0 : _a.abort();
      this.requestController = void 0;
    }
    text(parent, tag, value, className = "") {
      const node = document.createElement(tag);
      node.textContent = value;
      node.className = className;
      parent.appendChild(node);
      return node;
    }
    button(parent, identifier, label, action, className = "tv-action") {
      const button = this.text(
        parent,
        "button",
        label,
        className
      );
      button.id = identifier;
      button.tabIndex = -1;
      button.addEventListener("click", action);
      button.addEventListener("focus", () => this.reveal(button));
      return button;
    }
    clear() {
      var _a;
      this.surface.textContent = "";
      this.surface.scrollTop = 0;
      this.surface.classList.add("tv-details");
      (_a = this.artwork) == null ? void 0 : _a.refresh();
      this.rows = [];
    }
    save() {
      var _a;
      this.history.push({
        nodes: Array.from(this.surface.childNodes),
        attributes: { ...this.surface.dataset },
        rows: this.rows,
        focusId: ((_a = document.activeElement) == null ? void 0 : _a.id) || "tv-overlay-back",
        scrollTop: this.surface.scrollTop,
        scrollPositions: Array.from(
          this.surface.querySelectorAll(".detail-horizontal")
        ).map((node) => [node, node.scrollLeft, node.scrollTop])
      });
    }
    back() {
      var _a;
      this.cancel();
      const previous = this.history.pop();
      if (!previous) {
        this.close();
        return;
      }
      this.surface.textContent = "";
      Object.keys(this.surface.dataset).forEach(
        (key) => delete this.surface.dataset[key]
      );
      Object.assign(this.surface.dataset, previous.attributes);
      previous.nodes.forEach((node) => this.surface.appendChild(node));
      this.rows = previous.rows;
      const button = document.getElementById(previous.focusId);
      button == null ? void 0 : button.focus({ preventScroll: true });
      previous.scrollPositions.forEach(([node, left, top]) => {
        node.scrollLeft = left;
        node.scrollTop = top;
      });
      this.surface.scrollTop = previous.scrollTop;
      (_a = this.artwork) == null ? void 0 : _a.refresh();
    }
    move(direction) {
      var _a, _b;
      const identifier = moveDetailFocus(
        this.rows,
        ((_a = document.activeElement) == null ? void 0 : _a.id) || "",
        direction
      );
      if (identifier)
        (_b = document.getElementById(identifier)) == null ? void 0 : _b.focus({ preventScroll: true });
    }
    reveal(button) {
      const scale2 = this.surface.getBoundingClientRect().height / this.surface.clientHeight;
      const clearance = 24 * scale2;
      const bounds = button.getBoundingClientRect();
      const viewport = this.surface.getBoundingClientRect();
      if (bounds.bottom > viewport.bottom - clearance)
        this.surface.scrollTop += (bounds.bottom - viewport.bottom + clearance) / scale2;
      else if (bounds.top < viewport.top + clearance)
        this.surface.scrollTop += (bounds.top - viewport.top - clearance) / scale2;
      const row = button.closest(".detail-horizontal");
      if (row) {
        const rowBounds = row.getBoundingClientRect();
        if (bounds.right > rowBounds.right - clearance)
          row.scrollLeft += (bounds.right - rowBounds.right + clearance) / scale2;
        else if (bounds.left < rowBounds.left + clearance)
          row.scrollLeft += (bounds.left - rowBounds.left - clearance) / scale2;
      }
    }
    backButton(parent = this.surface) {
      this.button(parent, "tv-overlay-back", "Indietro", () => this.back());
      this.rows.push(["tv-overlay-back"]);
    }
    render(detail2) {
      var _a, _b, _c, _d;
      this.clear();
      this.surface.dataset.contentId = detail2.id;
      this.surface.dataset.contentKind = detail2.kind;
      const backdrop = this.text(this.surface, "div", "", "detail-backdrop");
      (_a = this.artwork) == null ? void 0 : _a.bind(backdrop, detail2.banner, 0);
      this.text(
        this.surface,
        "span",
        "SFONDO NON DISPONIBILE",
        "detail-backdrop-label"
      );
      const header = this.text(this.surface, "section", "", "detail-header");
      const poster = this.text(
        header,
        "div",
        "POSTER NON DISPONIBILE",
        "detail-poster"
      );
      (_b = this.artwork) == null ? void 0 : _b.bind(poster, detail2.poster, 1);
      poster.setAttribute("role", "img");
      poster.setAttribute("aria-label", "Placeholder poster");
      const information = this.text(header, "div", "", "detail-information");
      this.text(information, "h1", detail2.title);
      const metadata2 = this.text(information, "div", "", "detail-metadata");
      detailMetadata(detail2).forEach(
        (value) => this.text(metadata2, "span", value)
      );
      if (detail2.genres.length)
        this.text(
          information,
          "p",
          detail2.genres.map((genre) => genre.name).join(", "),
          "detail-genres"
        );
      this.text(
        information,
        "p",
        detail2.overview || "Descrizione non disponibile.",
        "detail-overview"
      );
      const actions = this.text(information, "div", "", "detail-actions");
      this.button(
        actions,
        "tv-detail-watch",
        "Guarda ora",
        () => this.unavailable("Riproduzione VOD non disponibile in P03.1.")
      );
      this.button(
        actions,
        "tv-detail-trailer",
        "Trailer",
        () => this.unavailable("Trailer non disponibile in P03.1.")
      );
      this.button(
        actions,
        "tv-detail-favorite",
        "Preferiti",
        () => this.unavailable("Preferiti non ancora portati.")
      );
      actions.querySelectorAll("button").forEach((button) => {
        this.text(button, "small", "Non disponibile", "detail-unavailable-label");
      });
      this.rows.push([
        "tv-detail-watch",
        "tv-detail-trailer",
        "tv-detail-favorite"
      ]);
      if (detail2.kind === "tv-show") {
        const section = this.text(this.surface, "section", "", "detail-seasons");
        this.text(section, "h2", "Stagioni");
        const seasons = detail2.seasons || [];
        if (!seasons.length)
          this.text(
            section,
            "p",
            "Nessuna stagione disponibile nei dati ricevuti.",
            "detail-empty"
          );
        else {
          const row = this.text(
            section,
            "div",
            "",
            "detail-horizontal season-cards"
          );
          this.rows.push(
            seasons.map((season, index) => {
              var _a2;
              const identifier = "tv-season-" + index;
              const button = this.button(
                row,
                identifier,
                "",
                () => void this.openSeason(season),
                "season-card"
              );
              button.dataset.seasonId = season.id;
              const poster2 = this.text(
                button,
                "span",
                "POSTER NON DISPONIBILE",
                "season-poster"
              );
              (_a2 = this.artwork) == null ? void 0 : _a2.bind(poster2, season.poster);
              this.text(
                button,
                "span",
                season.title || "Stagione " + season.number,
                "season-title"
              );
              return identifier;
            })
          );
        }
      }
      if (detail2.directors.length)
        this.text(
          this.surface,
          "p",
          "Regia: " + detail2.directors.map((person) => person.name).join(", "),
          "detail-extra"
        );
      if (detail2.cast.length)
        this.text(
          this.surface,
          "p",
          "Cast: " + detail2.cast.map((person) => person.name).join(", "),
          "detail-extra"
        );
      this.backButton();
      (_c = this.artwork) == null ? void 0 : _c.refresh();
      (_d = document.getElementById("tv-detail-watch")) == null ? void 0 : _d.focus({ preventScroll: true });
    }
    unavailable(message, episode) {
      var _a;
      this.save();
      this.clear();
      this.text(
        this.surface,
        "h1",
        (episode == null ? void 0 : episode.title) || "Funzionalit\xE0 non disponibile",
        "detail-notice-title"
      );
      if (episode) {
        this.surface.dataset.episodeId = episode.id;
        this.text(
          this.surface,
          "p",
          "Episodio " + episode.number,
          "detail-extra"
        );
      }
      this.text(this.surface, "p", message, "detail-extra");
      this.backButton();
      (_a = document.getElementById("tv-overlay-back")) == null ? void 0 : _a.focus();
    }
    async openSeason(season) {
      var _a, _b, _c, _d;
      this.save();
      this.clear();
      this.surface.dataset.seasonId = season.id;
      this.text(
        this.surface,
        "h1",
        season.title || "Stagione " + season.number,
        "season-heading"
      );
      const body = this.text(
        this.surface,
        "div",
        "Caricamento episodi\u2026 Back annulla.",
        "episode-body"
      );
      this.backButton();
      (_a = document.getElementById("tv-overlay-back")) == null ? void 0 : _a.focus({ preventScroll: true });
      this.cancel();
      const sequence = this.requestSequence;
      const controller = new AbortController();
      this.requestController = controller;
      const result = await this.catalog.episodes(
        season,
        { kind: "number", number: 1 },
        { signal: controller.signal }
      );
      if (this.disposed || sequence !== this.requestSequence) return;
      this.requestController = void 0;
      body.textContent = "";
      if (!result.ok) {
        this.text(
          body,
          "p",
          result.error.code + ": " + result.error.message,
          "detail-error"
        );
        this.button(body, "tv-episodes-retry", "Riprova", () => {
          this.back();
          void this.openSeason(season);
        });
        this.rows = [["tv-episodes-retry"], ["tv-overlay-back"]];
        (_b = document.getElementById("tv-episodes-retry")) == null ? void 0 : _b.focus();
      } else if (!result.value.items.length)
        this.text(
          body,
          "p",
          "Nessun episodio incluso nei dati ricevuti.",
          "detail-empty"
        );
      else {
        const row = this.text(body, "div", "", "detail-horizontal episode-cards");
        const identifiers = result.value.items.map((episode, index) => {
          var _a2;
          const identifier = "tv-episode-" + index;
          const button = this.button(
            row,
            identifier,
            "",
            () => this.unavailable(
              "Riproduzione VOD non disponibile in P03.1. Nessun resolver viene chiamato.",
              episode
            ),
            "episode-card"
          );
          button.dataset.episodeId = episode.id;
          const poster = this.text(
            button,
            "span",
            "ANTEPRIMA NON DISPONIBILE",
            "episode-poster"
          );
          (_a2 = this.artwork) == null ? void 0 : _a2.bind(poster, episode.poster, 1);
          this.text(button, "span", "Episodio " + episode.number, "episode-info");
          this.text(
            button,
            "span",
            episode.title || "Episodio " + episode.number,
            "episode-title"
          );
          if (episode.released)
            this.text(button, "span", episode.released, "episode-released");
          if (episode.overview)
            this.text(button, "span", episode.overview, "episode-overview");
          return identifier;
        });
        this.rows = [identifiers, ["tv-overlay-back"]];
        (_c = document.getElementById(identifiers[0])) == null ? void 0 : _c.focus({ preventScroll: true });
      }
      (_d = this.artwork) == null ? void 0 : _d.refresh();
    }
  };

  // src/tv/model.ts
  function homeProjection(categories2) {
    var _a;
    const rows = categories2.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) => item.kind === "movie" || item.kind === "tv-show"
      )
    })).filter((category) => category.items.length);
    const featured = ((_a = rows.find((category) => category.title.toLowerCase() === "hero") || rows[0]) == null ? void 0 : _a.items.slice(0, 10)) || [];
    return { featured, rows };
  }

  // src/tv/navigation.ts
  function moveContent(current, action, rowLengths) {
    const maximum = rowLengths[current.row] || 0;
    if (!maximum) return "menu";
    if (action === "left")
      return current.column === 0 || current.row === 0 ? "menu" : { ...current, column: current.column - 1 };
    if (action === "right")
      return {
        ...current,
        column: current.row === 0 ? (current.column + 1) % maximum : Math.min(current.column + 1, maximum - 1)
      };
    const row = action === "up" ? Math.max(0, current.row - 1) : action === "down" ? Math.min(rowLengths.length - 1, current.row + 1) : current.row;
    return { row, column: Math.min(current.column, (rowLengths[row] || 1) - 1) };
  }

  // src/tv/ui.ts
  var element = (identifier) => document.getElementById(identifier);
  var stage = element("tv-stage");
  var rail = element("tv-rail");
  var main = element("tv-main");
  var content = element("tv-content");
  var overlay = element("tv-overlay");
  var status = element("tv-status");
  var artwork = new TvArtwork(
    stage,
    (target) => overlay.hidden || overlay.contains(target)
  );
  var destinations = [
    { id: "search", label: "Cerca", icon: "search" },
    { id: "home", label: "Home", icon: "home" },
    { id: "movies", label: "Film", icon: "movies" },
    { id: "series", label: "Serie TV", icon: "series" },
    { id: "favorites", label: "Preferiti", icon: "favorites" },
    { id: "settings", label: "Impostazioni", icon: "settings" }
  ];
  var detailsView;
  var source = "fixture";
  var catalog;
  var categories = [];
  var projection = homeProjection(categories);
  var focus = { row: 0, column: 0 };
  var selectedDestination = "home";
  var heroIndex = 0;
  var requestController;
  var requestSequence = 0;
  var isLoading = false;
  var restoreFocus = "tv-hero-action";
  var lastRotation = Date.now();
  function setStatus(message = "") {
    status.textContent = "P03 \xB7 " + (source === "fixture" ? "FIXTURE SINTETICHE" : import_catalog_metadata6.LIVE_APPROVED ? "SOLO SVILUPPO \xB7 LIVE" : "SERVIZIO LIVE BLOCCATO") + (message ? " \xB7 " + message : "");
    status.title = "0.1.7-dev.5-dev-metadata+bc3f9490d417";
  }
  function setupCatalog() {
    const registry = new ProviderRegistry();
    registry.register(
      new StreamingCommunityProvider(
        source === "fixture" ? new FixtureCatalogTransport() : new LocalCatalogTransport()
      )
    );
    catalog = new CatalogService(registry);
  }
  function scale() {
    const viewport = fitTvViewport(window.innerWidth, window.innerHeight);
    stage.style.setProperty("--tv-logical-width", TV_LOGICAL_WIDTH + "px");
    stage.style.setProperty("--tv-logical-height", TV_LOGICAL_HEIGHT + "px");
    stage.style.transform = "scale(" + viewport.scale + ")";
    stage.style.left = viewport.left + "px";
    stage.style.top = viewport.top + "px";
  }
  function setRail(open) {
    rail.classList.toggle("open", open);
    const viewport = fitTvViewport(window.innerWidth, window.innerHeight);
    stage.style.setProperty(
      "--tv-rail-width",
      rail.getBoundingClientRect().width / viewport.scale + "px"
    );
  }
  function makeText(parent, tag, text, className = "") {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    parent.appendChild(node);
    return node;
  }
  function makeButton(parent, identifier, label, action, className = "tv-action") {
    const button = document.createElement("button");
    button.id = identifier;
    button.className = className;
    button.textContent = label;
    button.tabIndex = -1;
    button.addEventListener("click", action);
    parent.appendChild(button);
    return button;
  }
  function cancel() {
    requestSequence++;
    requestController == null ? void 0 : requestController.abort();
    requestController = void 0;
    isLoading = false;
  }
  function selectedButton() {
    return element(restoreFocus);
  }
  function revealCardFocus(button) {
    const viewport = fitTvViewport(window.innerWidth, window.innerHeight);
    const clearance = 12 * viewport.scale;
    const bounds = button.getBoundingClientRect();
    const mainBounds = main.getBoundingClientRect();
    if (bounds.bottom > mainBounds.bottom - clearance)
      main.scrollTop += (bounds.bottom - mainBounds.bottom + clearance) / viewport.scale;
    else if (bounds.top < mainBounds.top + clearance)
      main.scrollTop += (bounds.top - mainBounds.top - clearance) / viewport.scale;
    const row = button.parentElement;
    const rowBounds = row.getBoundingClientRect();
    if (bounds.right > rowBounds.right - clearance)
      row.scrollLeft += (bounds.right - rowBounds.right + clearance) / viewport.scale;
    else if (bounds.left < rowBounds.left + clearance)
      row.scrollLeft += (bounds.left - rowBounds.left - clearance) / viewport.scale;
  }
  function focusContent() {
    setRail(false);
    const identifier = focus.row === 0 ? "tv-hero-action" : "tv-card-" + focus.row + "-" + focus.column;
    const button = document.getElementById(
      identifier
    );
    if (!button) {
      (document.getElementById("tv-retry") || element("tv-nav-home")).focus();
      return;
    }
    restoreFocus = identifier;
    button.focus();
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (focus.row === 0) main.scrollTop = 0;
    else revealCardFocus(button);
  }
  function focusMenu() {
    setRail(true);
    element("tv-nav-" + selectedDestination).focus();
  }
  function rememberFocus() {
    if (document.activeElement instanceof HTMLElement)
      restoreFocus = document.activeElement.id;
  }
  function closeOverlay() {
    cancel();
    detailsView == null ? void 0 : detailsView.dispose();
    detailsView = void 0;
    overlay.hidden = true;
    overlay.textContent = "";
    artwork.refresh();
    const button = selectedButton();
    if (button) {
      button.focus();
      setRail(rail.contains(button));
    } else focusContent();
    setStatus();
  }
  function openOverlay(title) {
    detailsView == null ? void 0 : detailsView.dispose();
    detailsView = void 0;
    rememberFocus();
    const wasLoading = isLoading;
    cancel();
    if (wasLoading) renderHome();
    overlay.textContent = "";
    overlay.hidden = false;
    artwork.refresh();
    makeText(overlay, "h1", title);
    makeButton(overlay, "tv-overlay-back", "Indietro", closeOverlay).focus();
  }
  function note(title, message) {
    openOverlay(title);
    makeText(overlay, "p", message);
  }
  function tools() {
    openOverlay("Sorgente e strumenti");
    makeText(
      overlay,
      "p",
      "Home Android TV \xB7 prototipo P03. Le immagini sono placeholder espliciti."
    );
    makeText(overlay, "p", "Build 0.1.7-dev.5-dev-metadata+bc3f9490d417");
    makeButton(
      overlay,
      "tv-source-fixture",
      "Usa fixture sintetiche",
      () => changeSource("fixture")
    );
    makeButton(
      overlay,
      "tv-source-service",
      import_catalog_metadata6.LIVE_APPROVED ? "Servizio locale \u2014 test sviluppo live" : "Servizio locale \u2014 live bloccato",
      () => changeSource("service")
    );
    makeButton(
      overlay,
      "tv-open-p02",
      "Apri UI sperimentale P02",
      () => leave("catalog.html")
    );
    makeButton(
      overlay,
      "tv-open-diagnostic",
      "Apri diagnostica P01",
      () => leave("index.html")
    );
  }
  function leave(path) {
    cancel();
    location.href = new URL(
      "./" + path + (path === "index.html" ? "#tv" : ""),
      document.baseURI
    ).href;
  }
  function changeSource(value) {
    cancel();
    source = value;
    categories = [];
    projection = homeProjection([]);
    overlay.hidden = true;
    overlay.textContent = "";
    setupCatalog();
    void load("home");
  }
  async function load(destination) {
    cancel();
    overlay.hidden = true;
    overlay.textContent = "";
    selectedDestination = destination;
    heroIndex = 0;
    focus = { row: 0, column: 0 };
    for (const item of destinations) {
      element("tv-nav-" + item.id).setAttribute(
        "aria-current",
        item.id === destination ? "page" : "false"
      );
    }
    content.textContent = "";
    artwork.bind(element("tv-background"), void 0, 0);
    artwork.refresh();
    makeText(content, "p", "Caricamento\u2026 Back annulla.", "loading");
    setStatus("Caricamento\u2026");
    isLoading = true;
    requestController = new AbortController();
    const sequence = requestSequence;
    const result = destination === "home" ? await catalog.home(import_catalog_metadata6.PROVIDER, { signal: requestController.signal }) : await catalog.catalog(
      import_catalog_metadata6.PROVIDER,
      destination === "movies" ? "movie" : "tv-show",
      { kind: "number", number: 1 },
      { signal: requestController.signal }
    );
    if (sequence !== requestSequence) return;
    isLoading = false;
    requestController = void 0;
    if (!result.ok) {
      content.textContent = "";
      const panel = makeText(content, "section", "", "loading");
      makeText(panel, "h1", "Caricamento non riuscito");
      makeText(panel, "p", result.error.code + ": " + result.error.message);
      makeButton(panel, "tv-retry", "Riprova", () => void load(destination));
      element("tv-retry").focus();
      setStatus(result.error.message);
      return;
    }
    categories = Array.isArray(result.value) ? result.value : [
      {
        id: "catalog-" + destination,
        title: destination === "movies" ? "Film" : "Serie TV",
        items: result.value.items
      }
    ];
    projection = homeProjection(categories);
    renderHome();
    focusContent();
    lastRotation = Date.now();
    setStatus(
      destination === "home" ? "" : "Filtro catalogo \xB7 layout provvisorio"
    );
  }
  function metadata(item) {
    var _a;
    return [
      item.quality,
      (_a = item.released) == null ? void 0 : _a.slice(0, 4),
      item.rating === void 0 ? void 0 : "\u2605 " + item.rating.toFixed(1)
    ].filter(Boolean).join("   ");
  }
  function drawHero() {
    const hero = element("tv-hero");
    hero.textContent = "";
    const item = projection.featured[heroIndex];
    artwork.bind(element("tv-background"), item == null ? void 0 : item.banner, 0);
    if (!item) return;
    makeText(hero, "p", "", "hero-label");
    makeText(hero, "h1", item.title);
    makeText(hero, "p", metadata(item), "hero-meta");
    makeText(
      hero,
      "p",
      item.overview || "Descrizione non disponibile.",
      "hero-overview"
    );
    const button = makeButton(
      hero,
      "tv-hero-action",
      "Guarda Ora",
      () => void detail(item)
    );
    button.addEventListener("focus", () => {
      artwork.bind(element("tv-background"), item.banner, 0);
      focus = { row: 0, column: heroIndex };
      lastRotation = Date.now();
    });
    const dots = makeText(hero, "div", "", "hero-dots");
    dots.setAttribute("aria-hidden", "true");
    projection.featured.forEach(
      (_item, index) => makeText(dots, "span", "", index === heroIndex ? "selected" : "")
    );
  }
  function renderHome() {
    content.textContent = "";
    if (!projection.rows.length) {
      const panel = makeText(content, "section", "", "loading");
      makeText(panel, "h1", "Nessun contenuto disponibile");
      makeButton(panel, "tv-retry", "Ricarica", () => void load("home"));
      return;
    }
    const hero = makeText(content, "section", "", "hero");
    hero.id = "tv-hero";
    drawHero();
    projection.rows.forEach((category, rowIndex) => {
      const section = makeText(content, "section", "", "category");
      section.setAttribute("aria-label", category.title);
      makeText(section, "h2", category.title);
      const cards = makeText(section, "div", "", "cards");
      category.items.forEach((item, column) => {
        const button = makeButton(
          cards,
          "tv-card-" + (rowIndex + 1) + "-" + column,
          "",
          () => void detail(item),
          "card"
        );
        button.setAttribute(
          "aria-label",
          (item.kind === "movie" ? "Film: " : "Serie: ") + item.title
        );
        const poster = makeText(
          button,
          "span",
          item.kind === "movie" ? "FILM" : "SERIE TV",
          "poster"
        );
        poster.setAttribute("aria-hidden", "true");
        artwork.bind(poster, item.poster);
        makeText(poster, "small", "POSTER NON DISPONIBILE");
        makeText(button, "span", metadata(item), "card-meta");
        makeText(button, "span", item.title, "card-title");
        button.addEventListener("focus", () => {
          artwork.bind(element("tv-background"), item.banner, 0);
          focus = { row: rowIndex + 1, column };
          lastRotation = Date.now();
        });
      });
    });
    artwork.refresh();
  }
  async function detail(item) {
    openOverlay("Caricamento dettagli\u2026");
    const heading = overlay.querySelector("h1");
    const sequence = requestSequence;
    requestController = new AbortController();
    setStatus("Caricamento dettagli\u2026");
    const result = await catalog.detail(item, {
      signal: requestController.signal
    });
    if (sequence !== requestSequence) return;
    requestController = void 0;
    if (!result.ok) {
      heading.textContent = "Dettagli non disponibili";
      makeText(overlay, "p", result.error.code + ": " + result.error.message);
      setStatus(result.error.message);
      return;
    }
    detailsView = new TvDetails(overlay, catalog, closeOverlay, artwork);
    detailsView.render(result.value);
    setStatus();
  }
  function activateDestination(identifier) {
    if (identifier === "home" || identifier === "movies" || identifier === "series") {
      void load(identifier);
      return;
    }
    if (identifier === "settings") {
      tools();
      return;
    }
    note(
      identifier === "search" ? "Cerca" : "Preferiti",
      identifier === "search" ? "La ricerca \xE8 disponibile nella UI sperimentale P02. La schermata Android TV sar\xE0 portata in una fase successiva." : "Preferiti e cronologia originali non sono ancora portati."
    );
    if (identifier === "search")
      makeButton(
        overlay,
        "tv-search-p02",
        "Apri ricerca nella UI P02",
        () => leave("catalog.html")
      );
  }
  function back() {
    if (!overlay.hidden) {
      if (detailsView) detailsView.back();
      else closeOverlay();
      return;
    }
    if (isLoading) {
      cancel();
      renderHome();
      setStatus("Richiesta annullata");
      focusMenu();
      return;
    }
    if (rail.contains(document.activeElement)) {
      leave("index.html");
      return;
    }
    if (selectedDestination !== "home") {
      const transition = load("home");
      const sequence = requestSequence;
      void transition.then(() => {
        if (sequence === requestSequence) focusMenu();
      });
      return;
    }
    focusMenu();
  }
  function move(action) {
    var _a, _b;
    if (!overlay.hidden) {
      if (detailsView) {
        detailsView.move(action);
        return;
      }
      const buttons = Array.from(overlay.querySelectorAll("button"));
      const index = buttons.indexOf(document.activeElement);
      (_a = buttons[Math.max(
        0,
        Math.min(
          buttons.length - 1,
          index + (action === "up" || action === "left" ? -1 : 1)
        )
      )]) == null ? void 0 : _a.focus();
      return;
    }
    if (rail.contains(document.activeElement)) {
      if (action === "right") {
        focusContent();
        return;
      }
      if (action === "up" || action === "down") {
        const buttons = Array.from(rail.querySelectorAll("button"));
        const index = buttons.indexOf(
          document.activeElement
        );
        (_b = buttons[Math.max(
          0,
          Math.min(buttons.length - 1, index + (action === "up" ? -1 : 1))
        )]) == null ? void 0 : _b.focus();
      }
      return;
    }
    const next = moveContent(focus, action, [
      projection.featured.length,
      ...projection.rows.map((category) => category.items.length)
    ]);
    if (next === "menu") {
      focusMenu();
      return;
    }
    if (next.row === 0 && focus.row !== 0) next.column = heroIndex;
    focus = next;
    if (focus.row === 0 && heroIndex !== focus.column) {
      heroIndex = focus.column;
      drawHero();
    }
    focusContent();
  }
  destinations.forEach((destination) => {
    const button = makeButton(
      element("tv-menu"),
      "tv-nav-" + destination.id,
      "",
      () => activateDestination(destination.id),
      "menu-item"
    );
    const icon = document.createElement("img");
    icon.src = "./tv-icons/" + destination.icon + ".svg";
    icon.alt = "";
    button.appendChild(icon);
    makeText(button, "span", destination.label, "rail-label");
    button.setAttribute("aria-label", destination.label);
    button.setAttribute(
      "aria-current",
      destination.id === "home" ? "page" : "false"
    );
  });
  element("tv-provider").addEventListener("click", tools);
  element("tv-profile").addEventListener(
    "click",
    () => note("Profilo", "I profili Android TV non sono ancora portati.")
  );
  rail.addEventListener("focusin", () => setRail(true));
  window.addEventListener("keydown", (event) => {
    var _a;
    const action = keyAction(event.key, event.keyCode);
    if (action === "unknown") return;
    event.preventDefault();
    if (event.repeat && !["up", "down", "left", "right"].includes(action)) return;
    if (action === "back") back();
    else if (action === "enter")
      (_a = document.activeElement) == null ? void 0 : _a.click();
    else if (["up", "down", "left", "right"].includes(action)) move(action);
  });
  window.addEventListener("resize", scale);
  window.addEventListener("pagehide", () => {
    if (!overlay.hidden) closeOverlay();
    else cancel();
    stopRotation();
    artwork.pause();
  });
  document.addEventListener("visibilitychange", () => {
    lastRotation = Date.now();
    if (document.hidden) {
      stopRotation();
      artwork.pause();
    } else {
      startRotation();
      artwork.resume();
    }
    if (document.hidden && detailsView) closeOverlay();
    if (document.hidden && requestController) {
      if (!overlay.hidden) {
        closeOverlay();
        setStatus("Richiesta annullata");
      } else {
        cancel();
        renderHome();
        focusMenu();
        setStatus("Richiesta annullata");
      }
    }
  });
  function rotateFeatured() {
    var _a;
    if (document.hidden || !overlay.hidden || isLoading || document.activeElement instanceof HTMLElement && document.activeElement.classList.contains("card") || projection.featured.length < 2 || Date.now() - lastRotation < 8e3)
      return;
    const heroHadFocus = ((_a = document.activeElement) == null ? void 0 : _a.id) === "tv-hero-action";
    heroIndex = (heroIndex + 1) % projection.featured.length;
    drawHero();
    if (heroHadFocus) {
      focus.column = heroIndex;
      focusContent();
    }
    lastRotation = Date.now();
  }
  var rotationTimer;
  function stopRotation() {
    window.clearInterval(rotationTimer);
    rotationTimer = void 0;
  }
  function startRotation() {
    if (rotationTimer === void 0 && !document.hidden)
      rotationTimer = window.setInterval(rotateFeatured, 500);
  }
  window.addEventListener("pageshow", () => {
    startRotation();
    artwork.resume();
  });
  startRotation();
  scale();
  setRail(false);
  setupCatalog();
  setStatus();
  void load("home");
})();
