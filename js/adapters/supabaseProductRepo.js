// /js/adapters/supabaseProductRepo.js
(function () {
  "use strict";

  function create({ supabaseClient, logger }) {
    const SCHEMA = "shopup_core";

    function db() {
      return supabaseClient.schema(SCHEMA).from("products");
    }

    async function listMyProducts({ sellerId }) {
      const { data, error } = await db()
        .select(`
          id,
          title,
          price_ghs,
          currency,
          status,
          is_available,
          is_deleted,
          campus:campuses!left(name, city),
          created_at,
          updated_at
        `)
        .eq("seller_id", sellerId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [] };
    }

    async function createProduct({ sellerId, input }) {
      const payload = {
        seller_id: sellerId,
        campus_id: input.campus_id || null,
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        price_ghs: input.price_ghs,
        currency: input.currency || "GHS",
        status: input.status || "draft",
        is_available: typeof input.is_available === "boolean" ? input.is_available : true,
        image_urls: Array.isArray(input.image_urls) ? input.image_urls : [],
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await db().insert(payload).select("*").single();
      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    async function updateProduct({ sellerId, productId, input }) {
      const patch = {
        campus_id: input.campus_id || null,
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        price_ghs: input.price_ghs,
        currency: input.currency || "GHS",
        status: input.status || "draft",
        is_available: typeof input.is_available === "boolean" ? input.is_available : true,
        image_urls: Array.isArray(input.image_urls) ? input.image_urls : [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await db()
        .update(patch)
        .eq("id", productId)
        .eq("seller_id", sellerId)
        .eq("is_deleted", false)
        .select("*")
        .single();

      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    // ✅ SOFT DELETE (no hard delete)
    async function deleteProduct({ sellerId, productId }) {
      const { error } = await db()
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("seller_id", sellerId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    // Optional: restore
    async function restoreProduct({ sellerId, productId }) {
      const { error } = await db()
        .update({ is_deleted: false, deleted_at: null, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("seller_id", sellerId);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    return {
      listMyProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
    };
  }

  window.ShopUpSupabaseProductRepo = { create };
})();
