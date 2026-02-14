// /js/features/product/productService.js
(function () {
  "use strict";

  function create({ productRepo, sellerService, logger }) {
    async function getMySellerId() {
      // We rely on sellerService (already exists) to find seller row for logged-in user
      const me = await sellerService.getMySellerProfile();
      if (!me || !me.ok) return { ok: false, error: me?.error || { message: "Could not load seller profile." } };
      if (!me.data?.id) return { ok: false, error: { message: "Seller profile missing id." } };
      return { ok: true, data: me.data.id };
    }

    async function listMyProducts() {
      const sid = await getMySellerId();
      if (!sid.ok) return sid;
      return productRepo.listMyProducts({ sellerId: sid.data });
    }

    async function createProduct({ name, price }) {
      const sid = await getMySellerId();
      if (!sid.ok) return sid;

      const cleanName = String(name || "").trim();
      const cleanPrice = Number(price);

      if (!cleanName) return { ok: false, error: { message: "Product name is required." } };
      if (!Number.isFinite(cleanPrice) || cleanPrice < 0) return { ok: false, error: { message: "Enter a valid price." } };

      return productRepo.createProduct({
        sellerId: sid.data,
        name: cleanName,
        price: cleanPrice,
      });
    }

    async function deleteProduct(productId) {
      const sid = await getMySellerId();
      if (!sid.ok) return sid;
      return productRepo.deleteProduct({ sellerId: sid.data, productId });
    }

    return { listMyProducts, createProduct, deleteProduct };
  }

  window.ShopUpProductService = { create };
})();

