// /js/bootstrap/seller-register.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // We rely on app.bootstrap.js to register:
  // - logger
  // - sellerService
  // - supabaseClient
  // - dbAdapter
  // - dbSchema
  // This file is page-specific: it wires the controller and starts it.

  c.register(
    "sellerRegisterController",
    (cc) =>
      window.ShopUpSellerRegisterController.create({
        sellerService: cc.resolve("sellerService"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.resolve("sellerRegisterController").start();
})();
