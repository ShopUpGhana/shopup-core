// /js/core/logger.js
(function () {
  "use strict";

  function createLogger(opts) {
    opts = opts || {};
    const prefix = opts.prefix || "[ShopUp]";
    const debugEnabled =
      typeof opts.debugEnabled === "boolean"
        ? opts.debugEnabled
        : !!(window.ShopUpConfig && window.ShopUpConfig.DEBUG);

    function fmt(args) {
      return [prefix].concat(Array.prototype.slice.call(args));
    }

    return {
      debug: function () {
        if (!debugEnabled) return;
        console.debug.apply(console, fmt(arguments));
      },
      info: function () {
        console.info.apply(console, fmt(arguments));
      },
      warn: function () {
        console.warn.apply(console, fmt(arguments));
      },
      error: function () {
        console.error.apply(console, fmt(arguments));
      },
    };
  }

  window.ShopUpLogger = { createLogger };
})();
