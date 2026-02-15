// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // Core
  c.register("config", () => window.ShopUpConfig, { singleton: true });
  c.register("logger", () => console, { singleton: true });

  // Supabase client singleton
  c.register(
    "supabaseClient",
    (cc) => {
      const config = cc.resolve("config");
      const logger = cc.resolve("logger");

      if (!window.supabase || !window.supabase.createClient) {
        throw new Error("[ShopUp] Supabase SDK not loaded. Include supabase-js@2 before app.bootstrap.js");
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

  // Auth adapter (thin wrapper)
  if (window.ShopUpSupabaseAuthAdapter && window.ShopUpSupabaseAuthAdapter.create) {
    c.register(
      "authAdapter",
      (cc) =>
        window.ShopUpSupabaseAuthAdapter.create({
          supabase: cc.resolve("supabaseClient"),
          logger: cc.resolve("logger"),
        }),
      { singleton: true }
    );
  }

  // Auth service
  if (window.ShopUpAuthService && window.ShopUpAuthService.create) {
    c.register(
      "authService",
      (cc) =>
        window.ShopUpAuthService.create({
          authAdapter: cc.resolve("authAdapter"),
          logger: cc.resolve("logger"),
        }),
      { singleton: true }
    );
  }

  // Seller service (used already in register)
  if (window.ShopUpSellerService && window.ShopUpSellerService.create) {
    c.register(
      "sellerService",
      (cc) =>
        window.ShopUpSellerService.create({
          supabaseClient: cc.resolve("supabaseClient"),
          logger: cc.resolve("logger"),
        }),
      { singleton: true }
    );
  }

  // ✅ Product service (new)
  if (window.ShopUpProductService && window.ShopUpProductService.create) {
    c.register(
      "productService",
      (cc) =>
        window.ShopUpProductService.create({
          supabaseClient: cc.resolve("supabaseClient"),
          logger: cc.resolve("logger"),
        }),
      { singleton: true }
    );
  }
})();
