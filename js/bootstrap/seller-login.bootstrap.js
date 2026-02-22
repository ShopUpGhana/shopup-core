// /js/bootstrap/seller-login.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] Container not found. Check script order.");
    return;
  }

  if (c.__seller_login_bootstrapped) return;
  c.__seller_login_bootstrapped = true;

  // Wait helper
  window.ShopUpSupabaseWait =
    window.ShopUpSupabaseWait ||
    (function () {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const timeoutMs = 8000;

        (function tick() {
          const g = window.supabase || window.Supabase || window.supabaseJs;
          if (g && typeof g.createClient === "function") return resolve(true);
          if (Date.now() - start > timeoutMs) {
            return reject(new Error("[ShopUp] Supabase CDN not loaded (timeout)."));
          }
          setTimeout(tick, 25);
        })();
      });
    })();

  // Logger (production-safe)
  c.register("logger", () => {
    if (window.ShopUpLogger && typeof window.ShopUpLogger.createLogger === "function") {
      return window.ShopUpLogger.createLogger({
        prefix: "[ShopUp Seller Login]",
        debugEnabled: !!(window.ShopUpConfig && window.ShopUpConfig.DEBUG),
      });
    }
    return console;
  });

  c.register("supabaseWait", () => window.ShopUpSupabaseWait);

  c.register("supabaseClient", async (cc) => {
    await cc.resolve("supabaseWait");
    return window.ShopUpSupabaseClientFactory.create();
  });

  // Adapter (updated signature)
  c.register("authAdapter", (cc) =>
    window.ShopUpSupabaseAuthAdapter.create({
      supabaseClientPromise: cc.resolve("supabaseClient"),
      logger: cc.resolve("logger"),
    })
  );

  // Auth service (seller)
  c.register("authService", (cc) =>
    window.ShopUpAuthService.create({
      authAdapter: cc.resolve("authAdapter"),
      role: "seller",
      logger: cc.resolve("logger"),
    })
  );

  // Controller init
  if (
    window.ShopUpSellerLoginController &&
    typeof window.ShopUpSellerLoginController.init === "function"
  ) {
    window.ShopUpSellerLoginController.init({ container: c });
  }
})();
