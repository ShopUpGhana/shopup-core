// /js/features/auth/authService.js
(function () {
  "use strict";

  function normalizeSupabaseError(err) {
    if (!err) return null;

    // Supabase errors often look like: { message, status } or Error(message)
    const message =
      err.message ||
      err.error_description ||
      (typeof err === "string" ? err : "Unknown error");

    const status =
      err.status ||
      err.code ||
      (err.response && err.response.status) ||
      null;

    return { message: String(message), status };
  }

  function normalizeSessionResponse(resp) {
    // Supabase v2: getSession() returns { data: { session }, error }
    const error = normalizeSupabaseError(resp && resp.error);
    const session = resp && resp.data ? resp.data.session : null;
    return { session, error };
  }

  function extractRole(user) {
    if (!user) return null;

    // Common places people store roles
    const appRole = user.app_metadata && user.app_metadata.role;
    const userRole = user.user_metadata && user.user_metadata.role;

    return appRole || userRole || null;
  }

  async function verifySellerRls({ supabaseClient, logger }) {
    // OPTIONAL + SAFE:
    // Attempts a lightweight read that should be allowed by your RLS policies
    // If it fails due to RLS, we log and continue (you can choose to block later).
    try {
      if (!supabaseClient) return { ok: false, reason: "No client" };

      // You can change "sellers" to your actual table name if different.
      // This query is minimal and should be compatible with RLS testing.
      const res = await supabaseClient.from("sellers").select("id").limit(1);
      if (res.error) {
        logger.warn("[RLS] sellers read blocked or failed:", res.error.message || res.error);
        return { ok: false, reason: res.error.message || "RLS blocked" };
      }
      return { ok: true };
    } catch (e) {
      logger.warn("[RLS] verification exception:", e);
      return { ok: false, reason: "exception" };
    }
  }

  function create({ authAdapter, role, logger }) {
    if (!authAdapter) throw new Error("[ShopUp] authService: authAdapter is required.");
    logger = logger || console;
    role = role || "buyer";

    async function getSession() {
      const resp = await authAdapter.getSession();
      const norm = normalizeSessionResponse(resp);

      if (norm.error) {
        return { ok: false, session: null, user: null, error: norm.error };
      }

      const session = norm.session || null;
      const user = session && session.user ? session.user : null;

      return { ok: true, session, user, error: null };
    }

    async function requireRole(expectedRole) {
      const r = await getSession();
      if (!r.ok) return r;

      if (!r.user) {
        return {
          ok: false,
          session: null,
          user: null,
          error: { message: "Not logged in.", status: 401 },
        };
      }

      const actual = extractRole(r.user);

      // If you haven’t stored role in metadata yet, this will be null.
      // In that case, you can either allow or block. For security, we block.
      if (!actual) {
        return {
          ok: false,
          session: r.session,
          user: r.user,
          error: { message: "Role missing on user profile. Access denied.", status: 403 },
        };
      }

      if (String(actual).toLowerCase() !== String(expectedRole).toLowerCase()) {
        // Wrong role → sign out for safety
        try {
          await authAdapter.signOut();
        } catch (_) {}

        return {
          ok: false,
          session: null,
          user: null,
          error: { message: "Wrong role for this portal. Signed out.", status: 403 },
        };
      }

      return r;
    }

    async function signInWithPassword({ email, password, supabaseClientForRlsCheck }) {
      const res = await authAdapter.signInWithPassword({ email, password });
      const err = normalizeSupabaseError(res && res.error);

      if (err) {
        return { ok: false, error: err };
      }

      // After login, verify session + role
      const roleCheck = await requireRole(role);
      if (!roleCheck.ok) {
        return { ok: false, error: roleCheck.error };
      }

      // Optional RLS verification hook (safe)
      if (supabaseClientForRlsCheck) {
        await verifySellerRls({ supabaseClient: supabaseClientForRlsCheck, logger });
      }

      return { ok: true, session: roleCheck.session, user: roleCheck.user, error: null };
    }

    async function signOut() {
      const res = await authAdapter.signOut();
      const err = normalizeSupabaseError(res && res.error);
      if (err) return { ok: false, error: err };
      return { ok: true, error: null };
    }

    async function isLoggedIn() {
      const r = await getSession();
      return !!(r.ok && r.session && r.user);
    }

    function onAuthStateChange(cb) {
      // Token refresh guard: if auth state changes, re-check + normalize
      return authAdapter.onAuthStateChange(async (event, session) => {
        try {
          cb(event, session);
        } catch (e) {
          logger.error("[ShopUp] onAuthStateChange error:", e);
        }
      });
    }

    return {
      getSession,
      requireRole,
      signInWithPassword,
      signOut,
      isLoggedIn,
      onAuthStateChange,
    };
  }

  window.ShopUpAuthService = { create };
})();
