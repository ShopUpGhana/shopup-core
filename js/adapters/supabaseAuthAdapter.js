// /js/adapters/supabaseAuthAdapter.js
(function () {
  "use strict";

  function create({ supabase, supabaseClientPromise, logger }) {
    logger = logger || console;

    // Memoized lazy client getter (prevents race conditions + avoids duplicate creation)
    let _clientPromise = null;

    function getClient() {
      if (supabase && supabase.auth) return Promise.resolve(supabase);

      if (supabaseClientPromise) {
        if (!_clientPromise) _clientPromise = Promise.resolve(supabaseClientPromise);
        return _clientPromise.then((c) => {
          if (!c || !c.auth) {
            throw new Error("[ShopUp] supabaseAuthAdapter: invalid supabase client from supabaseClientPromise.");
          }
          return c;
        });
      }

      return Promise.reject(
        new Error("[ShopUp] supabaseAuthAdapter: provide either { supabase } or { supabaseClientPromise }.")
      );
    }

    async function signInWithPassword({ email, password }) {
      const client = await getClient();
      return await client.auth.signInWithPassword({ email, password });
    }

    async function signOut() {
      const client = await getClient();
      return await client.auth.signOut();
    }

    async function getSession() {
      const client = await getClient();
      return await client.auth.getSession();
    }

    async function getUser() {
      const client = await getClient();
      return await client.auth.getUser();
    }

    async function onAuthStateChange(cb) {
      const client = await getClient();
      return client.auth.onAuthStateChange((event, session) => {
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
