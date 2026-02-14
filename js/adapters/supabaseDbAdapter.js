// /js/adapters/supabaseDbAdapter.js
(function () {
  "use strict";

  function create({ supabase, logger, schema }) {
    const SCH = schema || "shopup_core";

    async function listCampuses() {
      const { data, error } = await supabase
        .schema(SCH)
        .from("campuses")
        .select("id,name,city")
        .eq("is_active", true)
        .order("name");

      if (error) {
        logger.error("[DbAdapter] listCampuses error", error);
        throw error;
      }
      return data || [];
    }

    async function getSellerById(id) {
      const { data, error } = await supabase
        .schema(SCH)
        .from("sellers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        logger.error("[DbAdapter] getSellerById error", error);
        return null;
      }
      return data;
    }

    async function updateSellerStatus(id, status) {
      const { error } = await supabase
        .schema(SCH)
        .from("sellers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return true;
    }

    return { listCampuses, getSellerById, updateSellerStatus };
  }

  window.ShopUpSupabaseDbAdapter = { create };
})();
