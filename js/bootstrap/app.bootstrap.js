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

  // -----------------------------
  // ShopUp Core schema (locked)
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

  // Auth adapter (needed for login/logout/session)
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

  // Product repo
  if (window.ShopUpSupabaseProductRepo && window.ShopUpSupabaseProductRepo.create) {
    c.register(
      "productRepo",
      (cc) =>
        window.ShopUpSupabaseProductRepo.create({
          supabase: cc.resolve("supabaseClient"),
          logger: cc.resolve("logger"),
          schema: cc.resolve("dbSchema"),
        }),
      { singleton: true }
    );
  }

  // -----------------------------
  // Services
  // -----------------------------
  // Seller service
  c.register(
    "sellerService",
    (cc) =>
      window.ShopUpSellerService.create({
        db: cc.resolve("dbAdapter"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  // Auth service
  if (window.ShopUpAuthService && window.ShopUpAuthService.create) {
    c.register(
      "authService",
      (cc) =>
        window.ShopUpAuthService.create({
          authAdapter: cc.resolve("authAdapter"),
          logger: cc.resolve("logger"),
          role: "seller",
        }),
      { singleton: true }
    );
  }

  // Product service
  if (window.ShopUpProductService && window.ShopUpProductService.create) {
    c.register(
      "productService",
      (cc) =>
        window.ShopUpProductService.create({
          productRepo: cc.resolve("productRepo"),
          sellerService: cc.resolve("sellerService"),
          logger: cc.resolve("logger"),
        }),
      { singleton: true }
    );
  }
})();
