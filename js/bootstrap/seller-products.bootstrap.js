// /js/bootstrap/seller-products.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found.");
    return;
  }

  c.register(
    "sellerProductsController",
    (cc) =>
      window.ShopUpSellerProductsController.create({
        productService: cc.resolve("productService"),
        authService: cc.resolve("authService"),
        storageService: cc.resolve("storageService"), // ✅ add this
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.resolve("sellerProductsController").start();
})();
