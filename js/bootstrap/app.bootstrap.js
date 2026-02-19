// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] Container not found.");
    return;
  }

  // -----------------------------
  // Logger (singleton)
  // -----------------------------
  c.register(
    "logger",
    () => ({
      error: (...args) => console.error(...args),
      warn: (...args) => console.warn(...args),
      log: (...args) => console.log(...args),
    }),
    { singleton: true }
  );

  // -----------------------------
  // Config (supports BOTH names)
  // -----------------------------
  c.register(
    "config",
    () => {
      // NEW style: window.ShopUpSupabase = { url, anonKey }
      if (window.ShopUpSupabase?.url && window.ShopUpSupabase?.anonKey) {
        return {
          SUPABASE_URL: window.ShopUpSupabase.url,
          SUPABASE_ANON_KEY: window.ShopUpSupabase.anonKey,
        };
      }

      // Existing style: window.ShopUpConfig = { SUPABASE_URL, SUPABASE_ANON_KEY }
      if (window.ShopUpConfig?.SUPABASE_URL && window.ShopUpConfig?.SUPABASE_ANON_KEY) {
        return window.ShopUpConfig;
      }

      // Sometimes: { supabaseUrl, supabaseAnonKey }
      if (window.ShopUpConfig?.supabaseUrl && window.ShopUpConfig?.supabaseAnonKey) {
        return {
          SUPABASE_URL: window.ShopUpConfig.supabaseUrl,
          SUPABASE_ANON_KEY: window.ShopUpConfig.supabaseAnonKey,
        };
      }

      throw new Error("[ShopUp] Missing Supabase config. Ensure supabase-config.js sets ShopUpConfig or ShopUpSupabase.");
    },
    { singleton: true }
  );

  // -----------------------------
  // Supabase client (singleton)
  // -----------------------------
  c.register(
    "supabaseClient",
    (cc) => {
      const logger = cc.resolve("logger");
      const cfg = cc.resolve("config");

      const url = cfg?.SUPABASE_URL;
      const anonKey = cfg?.SUPABASE_ANON_KEY;

      if (!window.supabase?.createClient) {
        throw new Error("[ShopUp] Supabase SDK not loaded. Include js/vendor/supabase.js first.");
      }

      if (!url || !anonKey) {
        logger.error("[ShopUp] Invalid config:", cfg);
        throw new Error("[ShopUp] Missing SUPABASE_URL / SUPABASE_ANON_KEY.");
      }

      return window.supabase.createClient(url, anonKey);
    },
    { singleton: true }
  );

  // -----------------------------
  // Auth service (singleton)
  // -----------------------------
  c.register(
    "authService",
    (cc) => {
      if (!window.ShopUpAuthService?.create) {
        throw new Error("[ShopUp] authService.js not loaded (ShopUpAuthService.create missing).");
      }

      return window.ShopUpAuthService.create({
        supabaseClient: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
      });
    },
    { singleton: true }
  );

  // -----------------------------
  // Product service (singleton)
  // -----------------------------
  c.register(
    "productService",
    (cc) => {
      if (!window.ShopUpProductService?.create) {
        throw new Error("[ShopUp] productService.js not loaded (ShopUpProductService.create missing).");
      }

      return window.ShopUpProductService.create({
        supabaseClient: cc.resolve("supabaseClient"),
        authService: cc.resolve("authService"),
        logger: cc.resolve("logger"),
      });
    },
    { singleton: true }
  );

  // -----------------------------
  // Storage service (STRICT) (singleton)
  // -----------------------------
  c.register(
    "storageService",
    (cc) => {
      if (!window.ShopUpStorageService?.create) {
        throw new Error("[ShopUp] storageService.js not loaded (ShopUpStorageService.create missing).");
      }

      return window.ShopUpStorageService.create({
        supabaseClient: cc.resolve("supabaseClient"),
        logger: cc.resolve("logger"),
        bucketName: "product-images",
      });
    },
    { singleton: true }
  );
})();
