// /js/features/seller/sellerService.js
(function () {
  "use strict";

  function ok(data) {
    return { ok: true, data };
  }

  function fail(message, extra) {
    return { ok: false, error: { message, ...(extra || {}) } };
  }

  function isAlreadyRegistered(err) {
    const msg = (err?.message || "").toLowerCase();
    return msg.includes("already registered") || msg.includes("already exists");
  }

  function create({ db, logger, supabase }) {
    // ✅ campuses
    async function listCampuses() {
      try {
        const campuses = await db.listCampuses();
        return ok(campuses || []);
      } catch (e) {
        logger.error("[SellerService] listCampuses error", e);
        return fail("Failed to load campuses.");
      }
    }

    // ✅ auth: signup OR login fallback
    async function ensureSignedIn(email, password) {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (!error) return ok({ user: data?.user, mode: "signup" });

        if (isAlreadyRegistered(error)) {
          const { data: sData, error: sErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (sErr) return fail("This email already exists. Please use the correct password.");
          return ok({ user: sData?.user, mode: "signin" });
        }

        return fail(error.message || "Signup failed.");
      } catch (e) {
        logger.error("[SellerService] ensureSignedIn error", e);
        return fail("Auth failed. Please try again.");
      }
    }

    async function upsertUserProfile(userId, campusId) {
      if (!campusId) return ok(true);
      try {
        await db.upsertUserProfile({ user_id: userId, campus_id: campusId });
        return ok(true);
      } catch (e) {
        // Not fatal (low friction)
        logger.warn?.("[SellerService] upsertUserProfile failed", e);
        return ok(true);
      }
    }

    async function getSellerByUserId(userId) {
      try {
        const seller = await db.getSellerByUserId(userId);
        return ok(seller);
      } catch (e) {
        logger.error("[SellerService] getSellerByUserId error", e);
        return fail("Failed to check seller profile.");
      }
    }

    async function createSellerDraft({ userId, campusId, displayName, whatsappPhone }) {
      try {
        const seller = await db.createSellerDraft({
          user_id: userId,
          campus_id: campusId,
          display_name: displayName,
          whatsapp_phone: whatsappPhone || null,
        });
        return ok(seller);
      } catch (e) {
        logger.error("[SellerService] createSellerDraft error", e);
        return fail("Failed to create seller profile.");
      }
    }

    // ✅ Main flow for register page
    async function registerSeller({ email, password, displayName, whatsappPhone, campusId }) {
      const authRes = await ensureSignedIn(email, password);
      if (!authRes.ok) return authRes;

      const userId = authRes.data?.user?.id;
      if (!userId) return fail("Auth succeeded but user ID missing.");

      await upsertUserProfile(userId, campusId);

      const existingRes = await getSellerByUserId(userId);
      if (!existingRes.ok) return existingRes;

      if (existingRes.data) {
        return ok({ seller: existingRes.data, mode: authRes.data.mode, existing: true });
      }

      const createdRes = await createSellerDraft({
        userId,
        campusId,
        displayName,
        whatsappPhone,
      });
      if (!createdRes.ok) return createdRes;

      return ok({ seller: createdRes.data, mode: authRes.data.mode, existing: false });
    }

    return {
      listCampuses,
      registerSeller,
    };
  }

  window.ShopUpSellerService = { create };
})();
