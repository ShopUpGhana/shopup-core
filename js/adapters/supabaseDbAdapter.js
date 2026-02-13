// /js/adapters/supabaseDbAdapter.js
(function () {
  "use strict";

  const DEFAULT_SCHEMA = "shopup_core";

  function create({ supabase, logger, schema }) {
    const sch = schema || DEFAULT_SCHEMA;

    function table(name) {
      // Supabase v2 supports schema() to target a non-public schema
      return supabase.schema(sch).from(name);
    }

    async function getSellerById(id) {
      const { data, error } = await table("sellers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        logger.error("[supabaseDbAdapter] getSellerById error", error);
        return null;
      }
      return data;
    }

    async function updateSellerStatus(id, status) {
      const { error } = await table("sellers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        logger.error("[supabaseDbAdapter] updateSellerStatus error", error);
        throw error;
      }
      return true;
    }

    return { getSellerById, updateSellerStatus };
  }

  window.ShopUpSupabaseDbAdapter = { create };
})();
