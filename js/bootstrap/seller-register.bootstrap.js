// /js/bootstrap/seller-register.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // Ensure app.bootstrap.js ran first (creates supabaseClient, authService, dbAdapter, etc.)
  // We only add page-specific controller wiring here.

  // Page controller (seller register)
  c.register(
    "sellerRegisterController",
    (cc) =>
      window.ShopUpSellerRegisterController.create({
        supabase: cc.resolve("supabaseClient"),
        schema: cc.resolve("dbSchema"), // "shopup_core"
        logger: cc.resolve("logger"),
        config: cc.resolve("config"),
      }),
    { singleton: true }
  );

  c.resolve("sellerRegisterController").start();
})();
