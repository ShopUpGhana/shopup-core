// /js/infra/supabase/supabaseClientFactory.js
(function () {
  "use strict";

  function create() {
    const cfg = window.ShopUpSupabaseConfig;
    if (!cfg || !cfg.url || !cfg.anonKey) {
      throw new Error("[ShopUp] Missing ShopUpSupabaseConfig (url/anonKey).");
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("[ShopUp] Supabase CDN not loaded.");
    }

    return window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }

  window.ShopUpSupabaseClientFactory = {
    create,
  };
})();
