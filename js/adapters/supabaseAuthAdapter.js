// /js/adapters/supabaseAuthAdapter.js
(function () {
  "use strict";

  function create({ supabaseClientPromise, logger }) {
    if (!supabaseClientPromise) {
      throw new Error("[ShopUp] supabaseAuthAdapter: supabaseClientPromise not provided.");
    }

    async function getClient() {
      const client = await supabaseClientPromise;
      if (!client || !client.auth) {
        throw new Error("[ShopUp] Invalid Supabase client.");
      }
      return client;
    }

    async function signInWithPassword({ email, password }) {
      const supabase = await getClient();
      return await supabase.auth.signInWithPassword({ email, password });
    }

    async function signOut() {
      const supabase = await getClient();
      return await supabase.auth.signOut();
    }

    async function getSession() {
      const supabase = await getClient();
      return await supabase.auth.getSession();
    }

    async function getUser() {
      const supabase = await getClient();
      return await supabase.auth.getUser();
    }

    async function onAuthStateChange(cb) {
      const supabase = await getClient();
      return supabase.auth.onAuthStateChange((event, session) => {
        try {
          cb(event, session);
        } catch (e) {
          logger?.error?.("[ShopUp] onAuthStateChange callback error", e);
        }
      });
    }

    return {
      signInWithPassword,
      signOut,
      getSession,
      getUser,
      onAuthStateChange,
    };
  }

  window.ShopUpSupabaseAuthAdapter = { create };
})();
