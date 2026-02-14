// /js/bootstrap/seller-login.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // Ensure supabase client is available from app.bootstrap.js
  c.register("supabaseClient", (cc) => cc.resolve("supabaseClient"), { singleton: true });
  c.register("logger", () => console, { singleton: true });

  // Controller
  c.register(
    "sellerLoginController",
    (cc) =>
      window.ShopUpSellerLoginController.create({
        supabaseClient: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  // Start
  c.resolve("sellerLoginController").start();
})();
