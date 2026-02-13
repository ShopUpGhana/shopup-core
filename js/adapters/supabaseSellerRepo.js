// /js/adapters/supabaseSellerRepo.js
(function () {
  "use strict";

  const DEFAULT_SCHEMA = "shopup_core";

  function create({ supabase, logger, schema }) {
    const sch = schema || DEFAULT_SCHEMA;

    function table(name) {
      return supabase.schema(sch).from(name);
    }

    async function getById(id) {
      const { data, error } = await table("sellers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        logger.error("[SellerRepo] getById error", error);
        return null;
      }
      return data;
    }

    async function update(id, patch) {
      const { error } = await table("sellers")
        .update(patch)
        .eq("id", id);

      if (error) {
        logger.error("[SellerRepo] update error", error);
        throw error;
      }
      return true;
    }

    return { getById, update };
  }

  window.ShopUpSupabaseSellerRepo = { create };
})();
