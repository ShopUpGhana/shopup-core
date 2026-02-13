// /js/adapters/supabaseSellerRepo.js
(function () {
  function create({ supabase, logger }) {
    async function getById(id) {
      const { data, error } = await supabase
        .from("sellers")
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
      const { error } = await supabase
        .from("sellers")
        .update(patch)
        .eq("id", id);

      if (error) throw error;
      return true;
    }

    return { getById, update };
  }

  window.ShopUpSupabaseSellerRepo = { create };
})();
