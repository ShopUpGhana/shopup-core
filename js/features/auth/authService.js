// /js/features/auth/authService.js
(function () {
  "use strict";

  function create({ authAdapter, logger }) {
    async function login({ email, password }) {
      try {
        const { data, error } = await authAdapter.signInWithPassword({ email, password });
        if (error) return { ok: false, error };
        return { ok: true, data };
      } catch (err) {
        logger?.error?.("[ShopUp] authService.login error", err);
        return { ok: false, error: { message: "Login failed. Please try again." } };
      }
    }

    async function logout() {
      try {
        const { error } = await authAdapter.signOut();
        if (error) return { ok: false, error };
        return { ok: true };
      } catch (err) {
        logger?.error?.("[ShopUp] authService.logout error", err);
        return { ok: false, error: { message: "Logout failed. Please try again." } };
      }
    }

    async function session() {
      const { data, error } = await authAdapter.getSession();
      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    async function user() {
      const { data, error } = await authAdapter.getUser();
      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    return { login, logout, session, user };
  }

  window.ShopUpAuthService = { create };
})();
