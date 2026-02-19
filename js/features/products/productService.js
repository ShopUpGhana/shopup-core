// /js/features/products/productService.js
(function () {
  "use strict";

  const SCHEMA = "shopup_core";

  function create({ supabaseClient, authService, logger }) {
    async function getSessionUser() {
      const res = await authService.session();
      const user = res?.data?.session?.user;
      if (!user) return { ok: false, error: { message: "Not logged in." } };
      return { ok: true, user };
    }

    async function getMySellerRow() {
      const me = await getSessionUser();
      if (!me.ok) return me;

      const userId = me.user.id;

      // Preferred: sellers.user_id = auth.users.id
      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("sellers")
        .select("id,user_id,name,email")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data?.id) return { ok: true, seller: data };

      // Fallback: email match
      const email = me.user.email;
      if (!email) return { ok: false, error: error || { message: "Seller not found." } };

      const fb = await supabaseClient
        .schema(SCHEMA)
        .from("sellers")
        .select("id,user_id,name,email")
        .eq("email", email)
        .maybeSingle();

      if (fb.error) return { ok: false, error: fb.error };
      if (!fb.data?.id) return { ok: false, error: { message: "Seller not found." } };

      return { ok: true, seller: fb.data };
    }

    async function listCampuses() {
      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("campuses")
        .select("id,name,city")
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
        .select(`
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
          image_paths,
          cover_image_path,
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

    async function listMyDeletedProducts() {
      const me = await getMySellerRow();
      if (!me.ok) return me;

      const { seller } = me;

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .select(`
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
          image_paths,
          cover_image_path,
          campus:campuses!left(name, city),
          deleted_at,
          created_at,
          updated_at
        `)
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

      const image_paths = Array.isArray(payload.image_paths) ? payload.image_paths : [];
      const cover_image_path =
        payload.cover_image_path || (image_paths.length ? image_paths[0] : null);

      const insertRow = {
        seller_id: seller.id,
        campus_id: payload.campus_id || null,
        title: payload.title,
        description: payload.description || null,
        category: payload.category || null,
        price_ghs: payload.price_ghs,
        currency: payload.currency || "GHS",
        status: payload.status || "draft",
        is_available: !!payload.is_available,
        image_urls: payload.image_urls || [],
        image_paths,
        cover_image_path,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .insert(insertRow)
        .select("id")
        .single();

      if (error) return { ok: false, error };
      return { ok: true, data };
    }

    async function updateProduct(productId, payload) {
      const image_paths = Array.isArray(payload.image_paths) ? payload.image_paths : [];
      const cover_image_path =
        payload.cover_image_path || (image_paths.length ? image_paths[0] : null);

      const updateRow = {
        campus_id: payload.campus_id || null,
        title: payload.title,
        description: payload.description || null,
        category: payload.category || null,
        price_ghs: payload.price_ghs,
        currency: payload.currency || "GHS",
        status: payload.status || "draft",
        is_available: !!payload.is_available,
        image_urls: payload.image_urls || [],
        image_paths,
        cover_image_path,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update(updateRow)
        .eq("id", productId)
        .eq("is_deleted", false);

      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function setCoverImage(productId, coverPath) {
      const cover_image_path = String(coverPath || "").trim() || null;
      if (!cover_image_path) return { ok: false, error: { message: "Invalid cover path." } };

      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({
          cover_image_path,
          updated_at: new Date().toISOString(),
        })
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

    async function deleteProductPermanently(productId, onlyIfDeleted) {
      let q = supabaseClient.schema(SCHEMA).from("products").delete().eq("id", productId);
      if (onlyIfDeleted) q = q.eq("is_deleted", true);

      const { error } = await q;
      if (error) return { ok: false, error };
      return { ok: true };
    }

    async function toggleAvailability(productId, next) {
      const { error } = await supabaseClient
        .schema(SCHEMA)
        .from("products")
        .update({ is_available: !!next, updated_at: new Date().toISOString() })
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

    // ✅ PUBLIC FEED (published + available + not deleted)
    async function listPublicFeed({ campusId, q, limit }) {
      const LIM = Number(limit || 60);

      let query = supabaseClient
        .schema(SCHEMA)
        .from("products")
        .select(`
          id,
          campus_id,
          title,
          category,
          price_ghs,
          currency,
          cover_image_path,
          image_paths,
          campus:campuses!left(name, city),
          created_at
        `)
        .eq("status", "published")
        .eq("is_available", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(isFinite(LIM) ? LIM : 60);

      if (q) {
        query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%`);
      }

      if (campusId) {
        // include global products too (campus_id is null)
        query = query.or(`campus_id.eq.${campusId},campus_id.is.null`);
      }

      const { data, error } = await query;
      if (error) return { ok: false, error };
      return { ok: true, data: data || [] };
    }

    return {
      listCampuses,
      listMyProducts,
      listMyDeletedProducts,
      createProduct,
      updateProduct,
      setCoverImage,
      deleteProduct,
      restoreProduct,
      deleteProductPermanently,
      toggleAvailability,
      publish,
      unpublish,
      listPublicFeed,
      getMySellerRow,
      getSessionUser,
    };
  }

  window.ShopUpProductService = { create };
})();
