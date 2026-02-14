// /js/adapters/supabaseAuthAdapter.js
(function () {
  "use strict";

  function create({ supabase, logger }) {
    if (!supabase || !supabase.auth) {
      throw new Error("[ShopUp] supabaseAuthAdapter: supabase client not provided.");
    }

    async function signInWithPassword({ email, password }) {
      return await supabase.auth.signInWithPassword({ email, password });
    }

    async function signOut() {
      return await supabase.auth.signOut();
    }

    async function getSession() {
      return await supabase.auth.getSession();
    }

    async function getUser() {
      return await supabase.auth.getUser();
    }

    function onAuthStateChange(cb) {
      return supabase.auth.onAuthStateChange((event, session) => {
        try {
          cb(event, session);
        } catch (e) {
          logger?.error?.("[ShopUp] onAuthStateChange callback error", e);
        }
      });
    }

    return { signInWithPassword, signOut, getSession, getUser, onAuthStateChange };
  }

  window.ShopUpSupabaseAuthAdapter = { create };
})();
