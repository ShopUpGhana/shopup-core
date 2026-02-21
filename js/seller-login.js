// /js/seller-login.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // One-time registration
  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    c.register("configReady", () => window.ShopUpConfigReady);
    c.register("config", () => window.ShopUpConfig);

    // ✅ Key: Always await Supabase readiness before any auth/session call
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);

    // Production-friendly logger later; for now ok
    c.register("logger", () => console);

    // Auth Service
    c.register("authService", (cc) =>
      window.ShopUpAuthServiceFactory.createAuthService({
        logger: cc.resolve("logger"),
        supabaseWait: cc.resolve("supabaseWait"),
        // ✅ Add role if your factory supports it
        role: "seller",
      })
    );
  }

  // Example usage
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
