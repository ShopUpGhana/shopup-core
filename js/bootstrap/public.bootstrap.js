// /js/bootstrap/public.bootstrap.js
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
      const url = config?.SUPABASE_URL || config?.supabaseUrl;
      const anonKey = config?.SUPABASE_ANON_KEY || config?.supabaseAnonKey;
      if (!url || !anonKey) throw new Error("[ShopUp] Missing Supabase config.");
      return window.supabase.createClient(url, anonKey);
    },
    { singleton: true }
  );

  c.register("dbSchema", () => "shopup_core", { singleton: true });

  if (!window.ShopUpPublicProductService || !window.ShopUpPublicProductService.create) {
    throw new Error("[ShopUp] publicProductService not loaded.");
  }

  c.register(
    "publicProductService",
    (cc) =>
      window.ShopUpPublicProductService.create({
        supabaseClient: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
        schema: cc.resolve("dbSchema"),
      }),
    { singleton: true }
  );
})();
