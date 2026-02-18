// /js/features/products/publicProductService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, schema }) {
    const SCHEMA = schema || "shopup_core";

    async function listCampuses() {
      const { data, error } = await supabaseClient
        .schema(SCHEMA)
        .from("campuses")
        .select("id,name,city")
        .order("name", { ascending: true });

      if (error) return { ok: false, error };
      return { ok: true, data: data || [] };
    }

    async function listPublishedProducts({ campusId }) {
      let q = supabaseClient
        .schema(SCHEMA)
        .from("products")
        .select(`
          id,
          title,
          price_ghs,
          currency,
          status,
          is_available,
          campus_id,
          image_paths,
          image_urls,
          campus:campuses!left(name, city),
          created_at
        `)
        .eq("status", "published")
        .eq("is_available", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (campusId) q = q.eq("campus_id", campusId);

      const { data, error } = await q;
      if (error) return { ok: false, error };
      return { ok: true, data: data || [] };
    }

    return { listCampuses, listPublishedProducts };
  }

  window.ShopUpPublicProductService = { create };
})();
