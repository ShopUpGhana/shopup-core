// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // -----------------------------
  // Core (singletons)
  // -----------------------------
  c.register("config", () => window.ShopUpConfig, { singleton: true });
  c.register("logger", () => console, { singleton: true });

  // -----------------------------
  // Supabase Client (singleton)
  // -----------------------------
  c.register(
    "supabaseClient",
    (cc) => {
      const config = cc.resolve("config");
      const logger = cc.resolve("logger");

      if (!window.supabase || !window.supabase.createClient) {
        throw new Error(
          "[ShopUp] Supabase SDK not loaded. Include supabase-js@2 before app.bootstrap.js"
        );
      }

      const url = config?.SUPABASE_URL;
      const anonKey = config?.SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        logger.error("[ShopUp] Missing SUPABASE_URL / SUPABASE_ANON_KEY in ShopUpConfig", config);
        throw new Error("[ShopUp] Missing Supabase config (URL / anon key).");
      }

      return window.supabase.createClient(url, anonKey);
    },
    { singleton: true }
  );

  // -----------------------------
  // ShopUp schema lock
  // -----------------------------
  c.register("dbSchema", () => "shopup_core", { singleton: true });

  // -----------------------------
  // Adapters
  // -----------------------------
  c.register(
    "dbAdapter",
    (cc) =>
      window.ShopUpSupabaseDbAdapter.create({
        supabase: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
        schema: cc.resolve("dbSchema"),
      }),
    { singleton: true }
  );

  c.register(
    "authAdapter",
    (cc) =>
      window.ShopUpSupabaseAuthAdapter.create({
        supabase: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  // -----------------------------
  // Services
  // -----------------------------
  c.register(
    "sellerService",
    (cc) =>
      window.ShopUpSellerService.create({
        db: cc.resolve("dbAdapter"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  c.register(
    "authService",
    (cc) =>
      window.ShopUpAuthService.create({
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );
})();
