"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = function(cb, mod) {
  return function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
};

// service/catalog-metadata.cjs
var require_catalog_metadata = __commonJS({
  "service/catalog-metadata.cjs": function(exports2) {
    "use strict";
    var PROVIDER = "streamingcommunity-it";
    var HOST = "streamingunity.fun";
    var LIVE_APPROVED = true;
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
    function requestDescriptor(input) {
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
        path: path,
        operation: input.op,
        html: input.op === "home" || input.op === "detail"
      };
    }
    function parseRoute(url) {
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
      requestDescriptor(input);
      return input;
    }
    var ARTWORK_BASE = "https://cdn.streamingunity.fun/images/";
    var ARTWORK_FILENAME = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;
    function artworkFilename(images, type) {
      if (!LIVE_APPROVED || images === void 0 || images === null)
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
      if (!LIVE_APPROVED) return void 0;
      var images = [];
      function add(value, type) {
        if (value === void 0) return;
        if (typeof value !== "string" || value.indexOf(ARTWORK_BASE) !== 0 || value.length !== ARTWORK_BASE.length + 41 || !ARTWORK_FILENAME.test(value.slice(ARTWORK_BASE.length)))
          invalid();
        images.push({ type: type, filename: value.slice(ARTWORK_BASE.length) });
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
        providerId: PROVIDER,
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
    function categories(sliders) {
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
    function parseMetadata(input, body, mime) {
      var descriptor = requestDescriptor(input);
      if (typeof body !== "string" || body.length > 2097152) invalid();
      if (descriptor.html) {
        if (!/^text\/html(?:;|$)/i.test(mime)) invalid();
        var props = bootstrap(body);
        if (input.op === "home")
          return { kind: "home", categories: categories(props.sliders) };
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
                  show: { providerId: PROVIDER, id: title.id, kind: "tv-show" },
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
                    seasonId: seasonId,
                    show: { providerId: PROVIDER, id: title.id, kind: "tv-show" },
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
          items: items,
          total: total,
          next: current < last ? { kind: "number", number: current + 1 } : void 0
        }
      };
    }
    function validateData(value) {
      function raw(item) {
        if (!object(item) || item.providerId !== PROVIDER || !validId(item.id) || item.kind !== "movie" && item.kind !== "tv-show")
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
            items: items,
            total: total,
            next: next ? { kind: "number", number: next.number } : void 0
          }
        };
      }
      if (value.kind === "detail") {
        var d = value.detail, r = raw(d), props = { locale: "it", title: r };
        if (r.type === "tv")
          r.seasons = list(d.seasons, 100).map(function(s) {
            if (!object(s) || !object(s.show) || s.show.providerId !== PROVIDER || s.show.id !== d.id || s.show.kind !== "tv-show")
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
              if (!object(ep) || ep.seasonId !== loaded.id || !object(ep.show) || ep.show.providerId !== PROVIDER || ep.show.id !== d.id || ep.show.kind !== "tv-show")
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
        var json = JSON.stringify({ props: props }).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        return parseMetadata(
          { op: "detail", id: d.id, type: r.type },
          '<div id="app" data-page="' + json + '"></div>',
          "text/html"
        );
      }
      invalid();
    }
    exports2.PROVIDER = PROVIDER;
    exports2.LIVE_APPROVED = LIVE_APPROVED;
    exports2.requestDescriptor = requestDescriptor;
    exports2.parseRoute = parseRoute;
    exports2.parseMetadata = parseMetadata;
    exports2.validateData = validateData;
  }
});

// service/catalog-network.cjs
var require_catalog_network = __commonJS({
  "service/catalog-network.cjs": function(exports2) {
    "use strict";
    function publicIPv4(address) {
      if (typeof address !== "string" || !/^(0|[1-9][0-9]{0,2})(\.(0|[1-9][0-9]{0,2})){3}$/.test(address))
        return false;
      var n = address.split(".").map(Number), a = n[0], b = n[1];
      if (n.some(function(x) {
        return x > 255;
      }))
        return false;
      return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && (b === 0 || b === 168) || a === 198 && (b === 18 || b === 19 || b === 51 && n[2] === 100) || a === 203 && b === 0 && n[2] === 113);
    }
    exports2.publicIPv4 = publicIPv4;
    exports2.lookup = function(dns) {
      return function(hostname, options, callback) {
        if (hostname !== "streamingunity.fun") {
          callback(new Error("DNS_POLICY"));
          return;
        }
        dns.lookup(hostname, { family: 4, all: true }, function(error, addresses) {
          if (error || !addresses || !addresses.length || addresses.some(function(item) {
            return item.family !== 4 || !publicIPv4(item.address);
          })) {
            callback(new Error("DNS_POLICY"));
            return;
          }
          if (options && options.all)
            callback(null, [{ address: addresses[0].address, family: 4 }]);
          else callback(null, addresses[0].address, 4);
        });
      };
    };
  }
});

// service/catalog-handler.cjs
var require_catalog_handler = __commonJS({
  "service/catalog-handler.cjs": function(exports2, module2) {
    "use strict";
    var metadata = require_catalog_metadata();
    var lookup = require_catalog_network().lookup(require("dns"));
    module2.exports = function(https, reply) {
      var active = null, last = 0, developmentStart = null, developmentRequests = 0;
      function respond(response, status, code, data) {
        var value = { protocol: "p026-v1", ok: !code };
        if (code) value.error = code;
        else value.data = data;
        reply(response, status, value, true);
      }
      return {
        handle: function(incoming, response) {
          var input, descriptor;
          try {
            input = metadata.parseRoute(incoming.url);
            descriptor = metadata.requestDescriptor(input);
          } catch (_) {
            void _;
            respond(response, 400, "INVALID_REQUEST");
            return;
          }
          if (!metadata.LIVE_APPROVED) {
            respond(response, 403, "CATALOG_NOT_AUTHORIZED");
            return;
          }
          if (developmentStart === null) developmentStart = Date.now();
          if (developmentRequests >= 20 || Date.now() - developmentStart >= 9e5) {
            respond(response, 403, "DEVELOPMENT_LIMIT");
            return;
          }
          if (active || Date.now() - last < 1e3) {
            respond(response, 429, "BUSY");
            return;
          }
          last = Date.now();
          developmentRequests += 1;
          var request = null, remote = null, complete = false, chunks = [], bytes = 0;
          function finish(code, data) {
            if (complete) return;
            complete = true;
            clearTimeout(deadline);
            active = null;
            chunks = [];
            if (code) {
              respond(response, code === "TIMEOUT" ? 504 : 502, code);
              if (request) request.abort();
              if (remote) remote.destroy();
            } else respond(response, 200, null, data);
          }
          active = function() {
            finish("CANCELLED");
          };
          response.on("close", function() {
            if (!complete) finish("CLIENT_CLOSED");
          });
          var deadline = setTimeout(function() {
            finish("TIMEOUT");
          }, 12e3);
          try {
            request = https.request(
              {
                hostname: descriptor.hostname,
                port: 443,
                path: descriptor.path,
                method: "GET",
                rejectUnauthorized: true,
                lookup: lookup,
                headers: {
                  Accept: descriptor.html ? "text/html" : "application/json",
                  "Accept-Language": "it-IT,it;q=0.9",
                  "Accept-Encoding": "identity"
                }
              },
              function(res) {
                remote = res;
                if (complete) {
                  res.destroy();
                  return;
                }
                var headers = res.headers || {};
                var mime = headers["content-type"] || "";
                var length = headers["content-length"];
                if (res.statusCode !== 200 || headers.location) {
                  finish("REMOTE_STATUS");
                  return;
                }
                if ((descriptor.html ? !/^text\/html(?:;|$)/i.test(mime) : !/^application\/json(?:;|$)/i.test(mime)) || headers["content-encoding"] && headers["content-encoding"] !== "identity") {
                  finish("REMOTE_TYPE");
                  return;
                }
                if (length && (!/^[0-9]+$/.test(length) || Number(length) > 2097152)) {
                  finish("RESPONSE_LIMIT");
                  return;
                }
                if (res.rawHeaders && (res.rawHeaders.length > 64 || res.rawHeaders.join("").length > 16384)) {
                  finish("REMOTE_HEADERS");
                  return;
                }
                res.on("data", function(chunk) {
                  if (complete) return;
                  bytes += chunk.length;
                  if (bytes > 2097152) {
                    finish("RESPONSE_LIMIT");
                    return;
                  }
                  chunks.push(Buffer.from(chunk));
                });
                res.on("end", function() {
                  if (complete) return;
                  if (length && bytes !== Number(length)) {
                    finish("REMOTE_READ");
                    return;
                  }
                  try {
                    var buffer = Buffer.concat(chunks), body = buffer.toString("utf8");
                    if (!Buffer.from(body, "utf8").equals(buffer))
                      throw new Error("UTF8");
                    var data = metadata.parseMetadata(input, body, mime);
                    if (Buffer.byteLength(JSON.stringify(data)) > 1048576) {
                      finish("RESPONSE_LIMIT");
                      return;
                    }
                    finish(null, data);
                  } catch (_) {
                    void _;
                    finish("INVALID_DATA");
                  }
                });
                res.on("error", function() {
                  finish("REMOTE_READ");
                });
                res.on("aborted", function() {
                  finish("REMOTE_READ");
                });
                res.on("close", function() {
                  if (!complete) finish("REMOTE_READ");
                });
              }
            );
            request.setTimeout(5e3, function() {
              finish("TIMEOUT");
            });
            request.on("error", function(err) {
              finish(
                err && /CERT|TLS|SSL/.test(err.code || "") ? "TLS_VERIFICATION" : "HTTPS_CONNECTION"
              );
            });
            request.end();
          } catch (_) {
            void _;
            finish("HTTPS_CONNECTION");
          }
        },
        stop: function() {
          if (active) active();
        }
      };
    };
  }
});

// service/stream-policy.cjs
var require_stream_policy = __commonJS({
  "service/stream-policy.cjs": function(exports2) {
    "use strict";
    var STREAM_LIVE_APPROVED = false;
    function invalid() {
      throw new Error("INVALID_REQUEST");
    }
    function positive(value) {
      return typeof value === "string" && /^[1-9][0-9]{0,9}$/.test(value);
    }
    function targetKey(target) {
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
    function parseRoute(path) {
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
      targetKey(parameters);
      return { operation: operation, target: parameters, server: server };
    }
    exports2.STREAM_LIVE_APPROVED = STREAM_LIVE_APPROVED;
    exports2.targetKey = targetKey;
    exports2.parseRoute = parseRoute;
    exports2.handle = function(request, response, reply) {
      try {
        parseRoute(request.url);
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

// service/local-diagnostic.cjs
(function() {
  "use strict";
  var http = require("http");
  var https = require("https");
  var crypto = require("crypto");
  var port = 17861;
  var origin = "http://127.0.0.1:8081";
  var target = "https://example.com/";
  var instance = crypto.randomBytes(8).toString("hex");
  var started = Date.now();
  var active = null;
  var lastProbe = 0;
  var sockets = [];
  var stopped = false;
  function reply(response, status, value, allowed) {
    if (response.finished || response.destroyed) return;
    var body = JSON.stringify(value);
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Content-Length", Buffer.byteLength(body));
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Connection", "close");
    response.setHeader("Vary", "Origin");
    if (allowed) response.setHeader("Access-Control-Allow-Origin", origin);
    response.writeHead(status);
    response.end(body);
  }
  function error(response, status, code, allowed) {
    reply(
      response,
      status,
      { protocol: "p023-v1", ok: false, error: code },
      allowed
    );
  }
  function probe(response) {
    if (active || Date.now() - lastProbe < 2e3) {
      error(response, 429, "BUSY", true);
      return;
    }
    lastProbe = Date.now();
    var began = Date.now();
    var complete = false;
    var request = null;
    var deadline = null;
    var remote = null;
    function finish(code, status, bytes) {
      if (complete) return;
      complete = true;
      clearTimeout(deadline);
      active = null;
      if (code) {
        error(response, code === "TIMEOUT" ? 504 : 502, code, true);
        if (request) request.abort();
        if (remote) remote.destroy();
      } else
        reply(
          response,
          200,
          {
            protocol: "p023-v1",
            ok: true,
            target: target,
            remoteStatus: status,
            bytes: bytes,
            durationMs: Date.now() - began
          },
          true
        );
    }
    active = function() {
      finish("CANCELLED");
    };
    response.on("close", function() {
      if (!complete) finish("CLIENT_CLOSED");
    });
    deadline = setTimeout(function() {
      finish("TIMEOUT");
    }, 1e4);
    try {
      request = https.request(
        {
          hostname: "example.com",
          port: 443,
          path: "/",
          method: "GET",
          rejectUnauthorized: true,
          headers: { Accept: "text/html" }
        },
        function(incoming) {
          remote = incoming;
          if (complete) {
            incoming.destroy();
            return;
          }
          if (incoming.statusCode < 200 || incoming.statusCode >= 300) {
            finish("REMOTE_STATUS");
            return;
          }
          var count = 0;
          incoming.on("data", function(chunk) {
            if (complete) return;
            count += chunk.length;
            if (count > 65536) finish("RESPONSE_LIMIT");
          });
          incoming.on("end", function() {
            if (!complete) finish(null, incoming.statusCode, count);
          });
          incoming.on("error", function() {
            finish("REMOTE_READ");
          });
          incoming.on("aborted", function() {
            finish("REMOTE_READ");
          });
          incoming.on("close", function() {
            if (!complete) finish("REMOTE_READ");
          });
        }
      );
      request.setTimeout(5e3, function() {
        finish("TIMEOUT");
      });
      request.on("error", function(error2) {
        finish(
          error2 && /CERT|TLS|SSL/.test(error2.code || "") ? "TLS_VERIFICATION" : "HTTPS_CONNECTION"
        );
      });
      request.end();
    } catch (requestError) {
      finish(
        requestError && requestError.code === "ETIMEDOUT" ? "TIMEOUT" : "HTTPS_CONNECTION"
      );
    }
  }
  var catalog = require_catalog_handler()(https, reply);
  var streamPolicy = require_stream_policy();
  var server = http.createServer(function(request, response) {
    if (request.headers.host !== "127.0.0.1:" + port || request.headers.origin !== origin) {
      error(response, 403, "ORIGIN_OR_HOST", false);
      return;
    }
    if (request.url !== "/health" && request.url !== "/probe" && request.url.indexOf("/catalog/") !== 0 && request.url.indexOf("/stream/") !== 0) {
      error(response, 404, "PATH_NOT_ALLOWED", true);
      return;
    }
    if (request.headers["transfer-encoding"] || request.headers["content-length"] && request.headers["content-length"] !== "0") {
      error(response, 413, "BODY_NOT_ALLOWED", true);
      return;
    }
    if (request.method === "OPTIONS") {
      if (request.headers["access-control-request-method"] !== "GET" || request.headers["access-control-request-headers"]) {
        error(response, 403, "PREFLIGHT_NOT_ALLOWED", true);
        return;
      }
      response.setHeader("Access-Control-Allow-Methods", "GET");
      reply(response, 200, { protocol: "p023-v1", ok: true }, true);
      return;
    }
    if (request.method !== "GET") {
      error(response, 405, "METHOD_NOT_ALLOWED", true);
      return;
    }
    if (request.url === "/health") {
      reply(
        response,
        200,
        {
          protocol: "p023-v1",
          ok: true,
          service: "streamflixbrew-diagnostic",
          nodeVersion: process.version,
          instance: instance,
          uptimeMs: Date.now() - started
        },
        true
      );
      return;
    }
    if (request.url.indexOf("/stream/") === 0) {
      streamPolicy.handle(request, response, reply);
      return;
    }
    if (request.url.indexOf("/catalog/") === 0) {
      catalog.handle(request, response);
      return;
    }
    probe(response);
  });
  server.maxHeadersCount = 32;
  server.setTimeout(15e3, function(socket) {
    socket.destroy();
  });
  server.on("connection", function(socket) {
    if (sockets.length >= 8) {
      socket.destroy();
      return;
    }
    sockets.push(socket);
    socket.on("close", function() {
      var index = sockets.indexOf(socket);
      if (index >= 0) sockets.splice(index, 1);
    });
  });
  server.on("error", function() {
    console.log("P023: loopback listen failed; check port/host runtime");
  });
  server.listen(port, "127.0.0.1");
  module.exports = {
    stop: function(done) {
      if (stopped) {
        if (done) done();
        return;
      }
      stopped = true;
      catalog.stop();
      if (active) active();
      server.close(done);
      sockets.slice().forEach(function(socket) {
        socket.destroy();
      });
    }
  };
})();
