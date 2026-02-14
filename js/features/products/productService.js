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

    async function listMyProducts() {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .select("id,title,price_ghs,currency,status,is_available,campus_id,created_at,updated_at")
        .eq("seller_id", seller.id)
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

    async function deleteProduct(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function toggleAvailability(productId, is_available) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ is_available, updated_at: new Date().toISOString() })
        .eq("id", productId);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function publish(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", productId);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function unpublish(productId) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", productId);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    return {
      listCampuses,
      listMyProducts,
      createProduct,
      deleteProduct,
      toggleAvailability,
      publish,
      unpublish,
      getMySellerRow,
    };
  }

  window.ShopUpProductService = { create };
})();
