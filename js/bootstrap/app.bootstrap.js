// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;

  // Core
  c.register("config", () => window.ShopUpConfig, { singleton: true });
  c.register("logger", () => console, { singleton: true });

  // External deps wrapped
  c.register("authAdapter", (cc) => window.ShopUpSupabaseAuthAdapter.create({
    supabase: window.supabase, // from loaded SDK
    config: cc.resolve("config"),
    logger: cc.resolve("logger"),
  }), { singleton: true });

  c.register("dbAdapter", (cc) => window.ShopUpSupabaseDbAdapter.create({
    supabase: window.supabase,
    config: cc.resolve("config"),
    logger: cc.resolve("logger"),
  }), { singleton: true });

  // Services (pure business rules)
  c.register("authService", (cc) => window.ShopUpAuthService.create({
    authAdapter: cc.resolve("authAdapter"),
    logger: cc.resolve("logger"),
    role: "seller", // or "customer"
  }));

  c.register("sellerService", (cc) => window.ShopUpSellerService.create({
    db: cc.resolve("dbAdapter"),
    logger: cc.resolve("logger"),
  }));
})();
