// /js/services/authService.js
(function () {
  "use strict";

  function createAuthService(deps) {
    deps = deps || {};
    var logger = deps.logger || console;
    var supabaseWait = deps.supabaseWait || window.ShopUpSupabaseWait;

    if (typeof supabaseWait !== "function") {
      throw new Error("[ShopUp] supabaseWait not provided and window.ShopUpSupabaseWait not found.");
    }

    async function getClient() {
      var client = await supabaseWait();

      // Hard validation so getSession can never be called on a fake object
      if (!client || !client.auth || typeof client.auth.getSession !== "function") {
        logger.error("[ShopUp] Invalid Supabase client:", client);
        throw new Error(
          "[ShopUp] Supabase client is invalid. " +
            "Expected client.auth.getSession(). " +
            "Verify /js/vendor/supabase.js is the Supabase JS client (UMD) and loaded first."
        );
      }

      return client;
    }

    return {
      // ✅ safe session getter
      async getSession() {
        var client = await getClient();
        var res = await client.auth.getSession();
        return res && res.data ? res.data.session : null;
      },

      // ✅ safe user getter (more trustworthy than reading session user in some cases)
      async getUser() {
        var client = await getClient();
        var res = await client.auth.getUser();
        return res && res.data ? res.data.user : null;
      },

      async signInWithPassword(email, password) {
        var client = await getClient();
        return await client.auth.signInWithPassword({ email: email, password: password });
      },

      async signUp(email, password, meta) {
        var client = await getClient();
        return await client.auth.signUp({
          email: email,
          password: password,
          options: { data: meta || {} },
        });
      },

      async signOut() {
        var client = await getClient();
        return await client.auth.signOut();
      },

      onAuthStateChange(callback) {
        // callback: (event, session) => {}
        getClient().then(function (client) {
          client.auth.onAuthStateChange(function (event, session) {
            try {
              callback && callback(event, session);
            } catch (e) {
              logger.error("[ShopUp] onAuthStateChange callback error:", e);
            }
          });
        });
      },
    };
  }

  // Factory-style export for your DI container
  window.ShopUpAuthServiceFactory = {
    createAuthService: createAuthService,
  };
})();
