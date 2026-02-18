// /js/bootstrap/seller-products-trash.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found.");
    return;
  }

  c.register(
    "sellerProductsTrashController",
    (cc) =>
      window.ShopUpSellerProductsTrashController.create({
        productService: cc.resolve("productService"),
        authService: cc.resolve("authService"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.resolve("sellerProductsTrashController").start();
})();
