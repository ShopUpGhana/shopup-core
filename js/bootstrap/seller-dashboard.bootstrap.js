// /js/bootstrap/seller-dashboard.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // Controller: products
  c.register(
    "sellerProductsController",
    (cc) =>
      window.ShopUpSellerProductsController.create({
        productService: cc.resolve("productService"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  // Start
  c.resolve("sellerProductsController").start();
})();
