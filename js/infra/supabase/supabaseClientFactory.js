(function () {
  "use strict";

  function createSupabaseClient({ supabaseUrl, supabaseAnonKey, options }) {
    if (!window.supabase) throw new Error("Supabase CDN not loaded (window.supabase missing).");
    if (!supabaseUrl) throw new Error("Missing supabaseUrl.");
    if (!supabaseAnonKey) throw new Error("Missing supabaseAnonKey.");

    // Keep defaults safe; override only via options
    const defaultOptions = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        // Example: set extra headers if you want
        headers: {},
      },
    };

    return window.supabase.createClient(
      supabaseUrl,
      supabaseAnonKey,
      Object.assign({}, defaultOptions, options || {})
    );
  }

  window.ShopUpSupabaseClientFactory = { createSupabaseClient };
})();
