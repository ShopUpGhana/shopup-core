// /js/bootstrap/campus-feed.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found.");
    return;
  }

  c.register(
    "campusFeedController",
    (cc) =>
      window.ShopUpCampusFeedController.create({
        productService: cc.resolve("productService"),
        storageService: cc.resolve("storageService"),
        supabaseClient: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.resolve("campusFeedController").start();
})();
