// /js/features/products/productService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger }) {
    const SCHEMA = "shopup_core";

    function nowIso() {
      return new Date().toISOString();
    }

    async function getAuthUser() {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) return { ok: false, error };
      return { ok: true, user: data.user || null };
    }

    async function getMySellerRow() {
      const u = await getAuthUser();
      if (!u.ok) return u;
      if (!u.user) return { ok: false, error: { message: "Not logged in" } };

      const { data: seller, error } = await supabaseClient
        .schema(SCHEMA)
        .from("sellers")
        .select("id,user_id,campus_id,status")
        .eq("user_id", u.user.id)
        .maybeSingle();

      if (error) return { ok: false, error };
      if (!seller) return { ok: false, error: { message: "Seller profile not found." } };

      return { ok: true, seller, user: u.user };
    }

    async function listCampuses() {
      try {
        const { data, error } = await supabaseClient
          .schema(SCHEMA)
          .from("campuses")
          .select("id,name,city,is_active")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) return { ok: false, error };
        return { ok: true, data: data || [] };
      } catch (e) {
        logger?.error?.("[ShopUp] productService.listCampuses error", e);
        return { ok: false, error: { message: "Failed to load campuses." } };
      }
    }

    // ✅ Normal list (hides deleted)
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
        .eq("seller_id", seller.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [], seller };
    }

    // ✅ Trash list (only deleted)
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
        .eq("seller_id", seller.id)
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [], seller };
    }

    async function createProduct(input) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const payload = {
        seller_id: seller.id,
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
        updated_at: nowIso(),
      };

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .insert(payload)
        .select("*")
        .single();

      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    // ✅ Edit/update (blocked if deleted)
    async function updateProduct(productId, input) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

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
        updated_at: nowIso(),
      };

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update(patch)
        .eq("id", productId)
        .eq("seller_id", seller.id)
        .eq("is_deleted", false)
        .select("*")
        .single();

      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    // ✅ Soft delete
    async function deleteProduct(productId) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({
          is_deleted: true,
          deleted_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq("id", productId)
        .eq("seller_id", seller.id)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    // ✅ Restore from trash
    async function restoreProduct(productId) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({
          is_deleted: false,
          deleted_at: null,
          updated_at: nowIso(),
        })
        .eq("id", productId)
        .eq("seller_id", seller.id)
        .eq("is_deleted", true);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    // ✅ Permanent delete (DISABLED by default unless confirm=true)
    async function deleteProductPermanently(productId, confirm) {
      if (confirm !== true) {
        return {
          ok: false,
          error: { message: "Permanent delete is disabled. Pass confirm=true to proceed." },
        };
      }

      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("seller_id", seller.id)
        .eq("is_deleted", true);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function toggleAvailability(productId, is_available) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ is_available: !!is_available, updated_at: nowIso() })
        .eq("id", productId)
        .eq("seller_id", seller.id)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function publish(productId) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ status: "published", updated_at: nowIso() })
        .eq("id", productId)
        .eq("seller_id", seller.id)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function unpublish(productId) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ status: "draft", updated_at: nowIso() })
        .eq("id", productId)
        .eq("seller_id", seller.id)
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
      deleteProductPermanently, // disabled unless confirm=true
      toggleAvailability,
      publish,
      unpublish,
      getMySellerRow,
    };
  }

  window.ShopUpProductService = { create };
})();
