// /js/bootstrap/seller-login.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found.");
    return;
  }

  c.register(
    "sellerLoginController",
    (cc) =>
      window.ShopUpSellerLoginController.create({
        authService: cc.resolve("authService"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.resolve("sellerLoginController").start();
})();
