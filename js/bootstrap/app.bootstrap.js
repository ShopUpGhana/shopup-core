// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  c.register("config", () => window.ShopUpConfig, { singleton: true });
  c.register("logger", () => console, { singleton: true });

  c.register(
    "supabaseClient",
    (cc) => {
      const config = cc.resolve("config");
      const logger = cc.resolve("logger");

      if (!window.supabase || !window.supabase.createClient) {
        throw new Error("[ShopUp] Supabase SDK not loaded.");
      }

      const url = config?.SUPABASE_URL;
      const anonKey = config?.SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        logger.error("[ShopUp] Missing SUPABASE_URL / SUPABASE_ANON_KEY", config);
        throw new Error("[ShopUp] Missing Supabase config.");
      }

      return window.supabase.createClient(url, anonKey);
    },
    { singleton: true }
  );

  c.register("dbSchema", () => "shopup_core", { singleton: true });

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
    "sellerService",
    (cc) =>
      window.ShopUpSellerService.create({
        db: cc.resolve("dbAdapter"),
        supabase: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );
})();
