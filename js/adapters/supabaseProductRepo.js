// /js/adapters/supabaseProductRepo.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, schemaName }) {
    const SCHEMA = schemaName || "shopup_core";

    function db() {
      return supabaseClient.schema(SCHEMA);
    }

    async function listProductsBySeller({ sellerId, includeDeleted }) {
      const q = db()
        .from("products")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (includeDeleted) q.eq("is_deleted", true);
      else q.eq("is_deleted", false);

      const { data, error } = await q;
      if (error) return { ok: false, error };
      return { ok: true, data: data || [] };
    }

    // ✅ Soft delete
    async function deleteProduct({ sellerId, productId }) {
      const { error } = await db()
        .from("products")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("seller_id", sellerId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function restoreProduct({ sellerId, productId }) {
      const { error } = await db()
        .from("products")
        .update({
          is_deleted: false,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("seller_id", sellerId)
        .eq("is_deleted", true);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function purgeProduct({ sellerId, productId }) {
      const { error } = await db()
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("seller_id", sellerId)
        .eq("is_deleted", true);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    return {
      listProductsBySeller,
      deleteProduct,
      restoreProduct,
      purgeProduct,
    };
  }

  window.ShopUpSupabaseProductRepo = { create };
})();
