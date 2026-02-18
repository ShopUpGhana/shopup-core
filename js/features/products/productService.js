// /js/features/products/productService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, schemaName }) {
    const SCHEMA = schemaName || "shopup_core";

    async function getAuthUid() {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) return { ok: false, error };
      const uid = data?.user?.id || null;
      if (!uid) return { ok: false, error: { message: "Not logged in." } };
      return { ok: true, uid };
    }

    // ✅ ENTERPRISE-SAFE:
    // Tries sellers.user_id == auth.uid() first (recommended)
    // If your sellers table uses sellers.id == auth.uid(), it falls back automatically.
    async function getMySellerRow() {
      try {
        const u = await getAuthUid();
        if (!u.ok) return u;

        const uid = u.uid;

        // 1) Preferred: sellers.user_id
        {
          const { data, error } = await supabaseClient
            .schema(SCHEMA)
            .from("sellers")
            .select("id, user_id, name, email")
            .eq("user_id", uid)
            .maybeSingle();

          // If this fails because user_id column doesn't exist, PostgREST returns 400.
          // We'll fall back to sellers.id below.
          if (!error && data) return { ok: true, seller: data };
        }

        // 2) Fallback: sellers.id == auth.uid()
        {
          const { data, error } = await supabaseClient
            .schema(SCHEMA)
            .from("sellers")
            .select("id, user_id, name, email")
            .eq("id", uid)
            .maybeSingle();

          if (error) return { ok: false, error };
          if (!data) return { ok: false, error: { message: "Seller profile not found." } };

          return { ok: true, seller: data };
        }
      } catch (e) {
        logger?.error?.("[ShopUp] getMySellerRow error", e);
        return { ok: false, error: { message: "Could not identify seller." } };
      }
    }

    async function listCampuses() {
      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("campuses")
        .select("id, name, city")
        .order("name", { ascending: true });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [] };
    }

    async function listMyProducts() {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .select(
          `
          id,
          title,
          description,
          category,
          price_ghs,
          currency,
          status,
          is_available,
          campus_id,
          image_urls,
          image_paths,
          created_at,
          updated_at,
          campus:campuses!left(name, city)
        `
        )
        .eq("seller_id", seller.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [], seller };
    }

    async function listMyDeletedProducts() {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .select(
          `
          id,
          title,
          description,
          category,
          price_ghs,
          currency,
          status,
          is_available,
          campus_id,
          image_urls,
          image_paths,
          deleted_at,
          created_at,
          updated_at,
          campus:campuses!left(name, city)
        `
        )
        .eq("seller_id", seller.id)
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [], seller };
    }

    async function createProduct(payload) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const insert = {
        seller_id: seller.id,
        campus_id: payload.campus_id || null,
        title: payload.title,
        description: payload.description || null,
        category: payload.category || null,
        price_ghs: payload.price_ghs,
        currency: payload.currency || "GHS",
        status: payload.status || "draft",
        is_available: !!payload.is_available,
        image_urls: Array.isArray(payload.image_urls) ? payload.image_urls : [],
        image_paths: Array.isArray(payload.image_paths) ? payload.image_paths : [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .insert(insert)
        .select("id")
        .single();

      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    async function updateProduct(productId, payload) {
      const patch = {
        campus_id: payload.campus_id || null,
        title: payload.title,
        description: payload.description || null,
        category: payload.category || null,
        price_ghs: payload.price_ghs,
        currency: payload.currency || "GHS",
        status: payload.status || "draft",
        is_available: !!payload.is_available,
        image_urls: Array.isArray(payload.image_urls) ? payload.image_urls : [],
        image_paths: Array.isArray(payload.image_paths) ? payload.image_paths : [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update(patch)
        .eq("id", productId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function deleteProduct(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function restoreProduct(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({
          is_deleted: false,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("is_deleted", true);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function deleteProductPermanently(productId, confirmFlag) {
      if (!confirmFlag) return { ok: false, error: { message: "Confirmation required." } };

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("is_deleted", true);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function toggleAvailability(productId, nextValue) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ is_available: !!nextValue, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function publish(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function unpublish(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    return {
      listCampuses,
      listMyProducts,
      listMyDeletedProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      deleteProductPermanently,
      toggleAvailability,
      publish,
      unpublish,
      getMySellerRow,
    };
  }

  window.ShopUpProductService = { create };
})();
