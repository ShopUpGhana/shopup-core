// /js/adapters/supabaseProductRepo.js
(function () {
  "use strict";

  function create({ supabase, logger, schema }) {
    const db = schema ? supabase.schema(schema) : supabase;

    async function listMyProducts({ sellerId, limit = 50 }) {
      const { data, error } = await db
        .from("products")
        .select("id,name,price,status,created_at")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("[ProductRepo] listMyProducts error", error);
        return { ok: false, error };
      }
      return { ok: true, data: data || [] };
    }

    async function createProduct({ sellerId, name, price }) {
      const payload = {
        seller_id: sellerId,
        name,
        price,
        status: "draft",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await db
        .from("products")
        .insert(payload)
        .select("id,name,price,status,created_at")
        .single();

      if (error) {
        logger.error("[ProductRepo] createProduct error", error);
        return { ok: false, error };
      }
      return { ok: true, data };
    }

    async function deleteProduct({ sellerId, productId }) {
      const { error } = await db
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("seller_id", sellerId);

      if (error) {
        logger.error("[ProductRepo] deleteProduct error", error);
        return { ok: false, error };
      }
      return { ok: true };
    }

    return { listMyProducts, createProduct, deleteProduct };
  }

  window.ShopUpSupabaseProductRepo = { create };
})();

