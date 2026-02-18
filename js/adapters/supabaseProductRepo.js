// /js/adapters/supabaseProductRepo.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, schema }) {
    const SCHEMA = schema || "shopup_core";

    function nowIso() {
      return new Date().toISOString();
    }

    async function listProductsBySeller({ sellerId, includeDeleted = false }) {
      try {
        const q = supabaseClient
          .schema(SCHEMA)
          .from("products")
          .select(
            `
            id,
            seller_id,
            campus_id,
            title,
            description,
            category,
            price_ghs,
            currency,
            status,
            is_available,
            image_urls,
            is_deleted,
            deleted_at,
            created_at,
            updated_at,
            campus:campuses!left(name, city)
          `
          )
          .eq("seller_id", sellerId)
          .eq("is_deleted", !!includeDeleted)
          .order(includeDeleted ? "deleted_at" : "created_at", { ascending: false });

        const { data, error } = await q;
        if (error) return { ok: false, error };
        return { ok: true, data: data || [] };
      } catch (e) {
        logger?.error?.("[supabaseProductRepo] listProductsBySeller error", e);
        return { ok: false, error: { message: "Failed to load products." } };
      }
    }

    // ✅ Soft delete (safe)
    async function deleteProduct({ sellerId, productId }) {
      try {
        const { error } = await supabaseClient
          .schema(SCHEMA)
          .from("products")
          .update({
            is_deleted: true,
            deleted_at: nowIso(),
            updated_at: nowIso(),
          })
          .eq("id", productId)
          .eq("seller_id", sellerId)
          .eq("is_deleted", false);

        if (error) return { ok: false, error };
        return { ok: true };
      } catch (e) {
        logger?.error?.("[supabaseProductRepo] deleteProduct error", e);
        return { ok: false, error: { message: "Soft delete failed." } };
      }
    }

    async function restoreProduct({ sellerId, productId }) {
      try {
        const { error } = await supabaseClient
          .schema(SCHEMA)
          .from("products")
          .update({
            is_deleted: false,
            deleted_at: null,
            updated_at: nowIso(),
          })
          .eq("id", productId)
          .eq("seller_id", sellerId)
          .eq("is_deleted", true);

        if (error) return { ok: false, error };
        return { ok: true };
      } catch (e) {
        logger?.error?.("[supabaseProductRepo] restoreProduct error", e);
        return { ok: false, error: { message: "Restore failed." } };
      }
    }

    // ✅ Permanent delete (BLOCKED by default unless confirm=true)
    async function deleteProductPermanently({ sellerId, productId, confirm }) {
      if (confirm !== true) {
        return {
          ok: false,
          error: {
            message:
              "Permanent delete is disabled by default. Pass { confirm: true } to enable.",
          },
        };
      }

      try {
        const { error } = await supabaseClient
          .schema(SCHEMA)
          .from("products")
          .delete()
          .eq("id", productId)
          .eq("seller_id", sellerId)
          .eq("is_deleted", true); // only delete if already in trash

        if (error) return { ok: false, error };
        return { ok: true };
      } catch (e) {
        logger?.error?.("[supabaseProductRepo] deleteProductPermanently error", e);
        return { ok: false, error: { message: "Permanent delete failed." } };
      }
    }

    return {
      listProductsBySeller,
      deleteProduct,
      restoreProduct,
      deleteProductPermanently,
    };
  }

  window.ShopUpSupabaseProductRepo = { create };
})();
