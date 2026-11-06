/* P02.3 standalone serviceFile. ES5 + Node built-ins only; no host dependency imports. */
(function () {
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
    if (active || Date.now() - lastProbe < 2000) {
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
    active = function () {
      finish("CANCELLED");
    };
    response.on("close", function () {
      if (!complete) finish("CLIENT_CLOSED");
    });
    deadline = setTimeout(function () {
      finish("TIMEOUT");
    }, 10000);
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
        function (incoming) {
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
          incoming.on("data", function (chunk) {
            if (complete) return;
            count += chunk.length;
            if (count > 65536) finish("RESPONSE_LIMIT");
          });
          incoming.on("end", function () {
            if (!complete) finish(null, incoming.statusCode, count);
          });
          incoming.on("error", function () {
            finish("REMOTE_READ");
          });
          incoming.on("aborted", function () {
            finish("REMOTE_READ");
          });
          incoming.on("close", function () {
            if (!complete) finish("REMOTE_READ");
          });
        }
      );
      request.setTimeout(5000, function () {
        finish("TIMEOUT");
      });
      request.on("error", function (error) {
        finish(
          error && /CERT|TLS|SSL/.test(error.code || "")
            ? "TLS_VERIFICATION"
            : "HTTPS_CONNECTION"
        );
      });
      request.end();
    } catch (requestError) {
      finish(
        requestError && requestError.code === "ETIMEDOUT"
          ? "TIMEOUT"
          : "HTTPS_CONNECTION"
      );
    }
  }
  var server = http.createServer(function (request, response) {
    if (
      request.headers.host !== "127.0.0.1:" + port ||
      request.headers.origin !== origin
    ) {
      error(response, 403, "ORIGIN_OR_HOST", false);
      return;
    }
    if (request.url !== "/health" && request.url !== "/probe") {
      error(response, 404, "PATH_NOT_ALLOWED", true);
      return;
    }
    if (
      request.headers["transfer-encoding"] ||
      (request.headers["content-length"] &&
        request.headers["content-length"] !== "0")
    ) {
      error(response, 413, "BODY_NOT_ALLOWED", true);
      return;
    }
    if (request.method === "OPTIONS") {
      if (
        request.headers["access-control-request-method"] !== "GET" ||
        request.headers["access-control-request-headers"]
      ) {
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
    probe(response);
  });
  server.maxHeadersCount = 32;
  server.setTimeout(15000, function (socket) {
    socket.destroy();
  });
  server.on("connection", function (socket) {
    if (sockets.length >= 8) {
      socket.destroy();
      return;
    }
    sockets.push(socket);
    socket.on("close", function () {
      var index = sockets.indexOf(socket);
      if (index >= 0) sockets.splice(index, 1);
    });
  });
  server.on("error", function () {
    console.log("P023: loopback listen failed; check port/host runtime");
  });
  server.listen(port, "127.0.0.1");
  module.exports = {
    stop: function (done) {
      if (stopped) {
        if (done) done();
        return;
      }
      stopped = true;
      if (active) active();
      server.close(done);
      sockets.slice().forEach(function (socket) {
        socket.destroy();
      });
    }
  };
})();
