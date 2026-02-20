// /js/supabase-config.js
(function () {
  "use strict";

  // ✅ Put your real values here (or keep using window.ShopUpConfig if you already have that)
  // If you already set window.ShopUpConfig elsewhere, you can remove this default object.
  window.ShopUpConfig = window.ShopUpConfig || {
    SUPABASE_URL: "https://brbewkxpvihnsrbrlpzq.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4",
  };

  /**
   * Find the Supabase UMD global in a resilient way.
   * Different builds sometimes attach differently.
   */
  function resolveSupabaseGlobal() {
    return (
      window.supabase ||        // common
      window.Supabase ||        // sometimes
      window.supabaseJs ||      // sometimes
      null
    );
  }

  /**
   * Wait for vendor supabase script to be present and have createClient()
   */
  function waitForSupabaseGlobal(timeoutMs) {
    timeoutMs = typeof timeoutMs === "number" ? timeoutMs : 8000;

    return new Promise(function (resolve, reject) {
      var started = Date.now();

      (function poll() {
        var g = resolveSupabaseGlobal();

        if (g && typeof g.createClient === "function") {
          resolve(g);
          return;
        }

        if (Date.now() - started > timeoutMs) {
          reject(
            new Error(
              "[ShopUp] Supabase vendor not ready. " +
                "Expected window.supabase.createClient(). " +
                "Check script order: /js/vendor/supabase.js must load before supabase-config.js. " +
                "Also verify your vendor file is the Supabase JS client UMD build."
            )
          );
          return;
        }

        setTimeout(poll, 50);
      })();
    });
  }

  // Expose a single promise so everything can await it
  window.ShopUpSupabaseWait = function () {
    return waitForSupabaseGlobal(8000).then(function (supabaseGlobal) {
      // Create client once
      if (!window.ShopUpSupabaseClient) {
        var cfg = window.ShopUpConfig || {};
        var url = cfg.SUPABASE_URL;
        var key = cfg.SUPABASE_ANON_KEY;

        if (!url || !key) {
          throw new Error(
            "[ShopUp] Missing SUPABASE_URL or SUPABASE_ANON_KEY in window.ShopUpConfig"
          );
        }

        window.ShopUpSupabaseClient = supabaseGlobal.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
      }

      return window.ShopUpSupabaseClient;
    });
  };

  // Optional: configReady helper (if your DI expects it)
  window.ShopUpConfigReady = window.ShopUpConfigReady || Promise.resolve(true);
})();
