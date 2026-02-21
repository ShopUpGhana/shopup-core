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

  // ✅ Wait helper: resolves when Supabase exists
  window.ShopUpSupabaseWait =
    window.ShopUpSupabaseWait ||
    (function () {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const timeoutMs = 8000;

        (function tick() {
          try {
            if (window.supabase && typeof window.supabase.createClient === "function") {
              return resolve(true);
            }
            if (Date.now() - start > timeoutMs) {
              return reject(new Error("Supabase CDN not loaded (timeout)."));
            }
            setTimeout(tick, 25);
          } catch (e) {
            reject(e);
          }
        })();
      });
    })();

  // ✅ register supabaseWait so auth can safely await
  c.register("supabaseWait", () => window.ShopUpSupabaseWait);

  // ✅ build supabase client using your factory
  c.register("supabaseClient", async () => {
    await c.resolve("supabaseWait");
    return window.ShopUpSupabaseClientFactory.create();
  });

  // ✅ adapters
  c.register("authAdapter", (cc) =>
    window.ShopUpSupabaseAuthAdapter.create({
      supabaseClientPromise: cc.resolve("supabaseClient"),
    })
  );

  // ✅ auth service (feature)
  c.register("authService", (cc) =>
    window.ShopUpAuthService.create({
      authAdapter: cc.resolve("authAdapter"),
      role: "seller",
    })
  );

  // ✅ controller init (if controller exposes init)
  if (window.ShopUpSellerLoginController && typeof window.ShopUpSellerLoginController.init === "function") {
    window.ShopUpSellerLoginController.init({ container: c });
  }
})();
