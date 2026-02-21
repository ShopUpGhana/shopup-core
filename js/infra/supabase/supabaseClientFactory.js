// /js/infra/supabase/supabaseClientFactory.js
(function () {
  "use strict";

  window.ShopUpSupabaseClientFactory = {
    create: async function () {
      if (typeof window.ShopUpSupabaseWait !== "function") {
        throw new Error("[ShopUp] ShopUpSupabaseWait() missing. Load /js/supabase-config.js first.");
      }
      return window.ShopUpSupabaseWait(); // returns the client
    },
  };
})();
