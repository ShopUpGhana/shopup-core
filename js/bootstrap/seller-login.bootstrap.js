// /js/bootstrap/seller-login.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  c.register("logger", () => console, { singleton: true });

  c.register(
    "sellerLoginController",
    (cc) =>
      window.ShopUpSellerLoginController.create({
        supabaseClient: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.resolve("sellerLoginController").start();
})();
