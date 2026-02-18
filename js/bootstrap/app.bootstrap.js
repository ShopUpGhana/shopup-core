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

  // -----------------------------
  // Schema lock (single source)
  // -----------------------------
  c.register("dbSchema", () => "shopup_core", { singleton: true });

  // -----------------------------
  // Storage Service (singleton)
  // -----------------------------
  if (window.ShopUpStorageService && window.ShopUpStorageService.create) {
    c.register(
      "storageService",
      (cc) =>
        window.ShopUpStorageService.create({
          supabaseClient: cc.resolve("supabaseClient"),
          logger: cc.resolve("logger"),
          bucketName: "product-images",
        }),
      { singleton: true }
    );
  }

  // -----------------------------
  // Auth Adapter (no extra file needed)
  // -----------------------------
  c.register(
    "authAdapter",
    (cc) => {
      const client = cc.resolve("supabaseClient");
      return {
        signInWithPassword: ({ email, password }) => client.auth.signInWithPassword({ email, password }),
        signOut: () => client.auth.signOut(),
        getSession: () => client.auth.getSession(),
        getUser: () => client.auth.getUser(),
        signUp: ({ email, password, options }) => client.auth.signUp({ email, password, options }),
      };
    },
    { singleton: true }
  );

  // -----------------------------
  // Auth Service
  // -----------------------------
  if (!window.ShopUpAuthService || !window.ShopUpAuthService.create) {
    throw new Error("[ShopUp] ShopUpAuthService not loaded. Include /js/features/auth/authService.js");
  }

  c.register(
    "authService",
    (cc) =>
      window.ShopUpAuthService.create({
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
      }),
    { singleton: true }
  );

  // -----------------------------
  // Seller Service (optional)
  // -----------------------------
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

  // -----------------------------
  // Product Service (required)
  // -----------------------------
  if (window.ShopUpProductService && window.ShopUpProductService.create) {
    c.register(
      "productService",
      (cc) =>
        window.ShopUpProductService.create({
          supabaseClient: cc.resolve("supabaseClient"),
          logger: cc.resolve("logger"),
          schemaName: cc.resolve("dbSchema"),
        }),
      { singleton: true }
    );
  }
})();
