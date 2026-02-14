// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // Core (singletons)
  c.register("config", () => window.ShopUpConfig, { singleton: true });
  c.register("logger", () => console, { singleton: true });

  // Supabase Client (singleton)
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

      const url = config?.SUPABASE_URL || config?.supabaseUrl;
      const anonKey = config?.SUPABASE_ANON_KEY || config?.supabaseAnonKey;

      if (!url || !anonKey) {
        logger.error("[ShopUp] Missing SUPABASE_URL / SUPABASE_ANON_KEY in ShopUpConfig", config);
        throw new Error("[ShopUp] Missing Supabase config (URL / anon key).");
      }

      return window.supabase.createClient(url, anonKey);
    },
    { singleton: true }
  );

  // ShopUp Core schema (locked)
  c.register("dbSchema", () => "shopup_core", { singleton: true });

  // DB adapter (requires window.ShopUpSupabaseDbAdapter loaded)
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

  // SellerService (requires window.ShopUpSellerService loaded)
  c.register(
    "sellerService",
    (cc) =>
      window.ShopUpSellerService.create({
        db: cc.resolve("dbAdapter"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );
})();
