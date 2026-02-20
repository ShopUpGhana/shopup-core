// /js/seller-login.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    c.register("configReady", () => window.ShopUpConfigReady);
    c.register("config", () => window.ShopUpConfig);

    // ✅ THIS is the key: authService will always await this before calling auth.getSession()
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);

    c.register("logger", () => console);

    c.register("authService", (cc) =>
      window.ShopUpAuthServiceFactory.createAuthService({
        logger: cc.resolve("logger"),
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );
  }

  // Example usage:
  (async function init() {
    try {
      const auth = c.resolve("authService");
      const session = await auth.getSession();
      console.log("[ShopUp] session:", session);
    } catch (e) {
      console.error("[ShopUp] Auth init failed:", e);
    }
  })();
})();
