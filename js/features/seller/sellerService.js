// /js/features/seller/sellerService.js
(function () {
  function create({ db, logger }) {
    async function submitForReview({ sellerId }) {
      // enforce lifecycle
      const seller = await db.getSellerById(sellerId);
      if (!seller) throw new Error("Seller not found");
      if (seller.status !== "draft") throw new Error("Only draft can be submitted");

      await db.updateSellerStatus(sellerId, "pending");
      logger.info("[Seller] Submitted for review", sellerId);
      return { ok: true };
    }

    return { submitForReview };
  }

  window.ShopUpSellerService = { create };
})();
