// /js/features/products/productService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger }) {
    const SCHEMA = "shopup_core";

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

    // ✅ List only non-deleted + join campus name
    async function listMyProducts() {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
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
        .eq("seller_id", seller.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

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
        updated_at: new Date().toISOString(),
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

    // ✅ Edit
    async function updateProduct(productId, input) {
      const me = await getMySellerRow();
      if (!me.ok) return me;

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

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update(patch)
        .eq("id", productId)
        .eq("is_deleted", false)
        .select("*")
        .single();

      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    // ✅ Soft delete (update only)
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

    return {
      listCampuses,
      listMyProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      getMySellerRow,
    };
  }

  window.ShopUpProductService = { create };
})();
