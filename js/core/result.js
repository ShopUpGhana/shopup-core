// /js/core/result.js
(function () {
  function ok(data) { return { ok: true, data, error: null }; }
  function err(code, message, meta) {
    return { ok: false, data: null, error: { code, message, meta: meta || null } };
  }
  window.ShopUpResult = { ok, err };
})();
