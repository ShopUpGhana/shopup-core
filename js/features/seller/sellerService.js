// /js/features/seller/sellerService.js
(function () {
  "use strict";

  function ok(data) {
    return { ok: true, data };
  }

  function fail(message, extra) {
    return { ok: false, error: { message, ...(extra || {}) } };
  }

  function create({ db, logger }) {
    async function listCampuses() {
      try {
        const campuses = await db.listCampuses();
        return ok(campuses || []);
      } catch (e) {
        logger.error("[SellerService] listCampuses error", e);
        return fail("Failed to load campuses.");
      }
    }

    async function submitForReview({ sellerId }) {
      if (!sellerId) return fail("Missing seller ID.");
      try {
        await db.updateSellerStatus(sellerId, "pending");
        return ok(true);
      } catch (e) {
        logger.error("[SellerService] submitForReview error", e);
        return fail("Could not submit. Please try again.");
      }
    }

    return { listCampuses, submitForReview };
  }

  window.ShopUpSellerService = { create };
})();
