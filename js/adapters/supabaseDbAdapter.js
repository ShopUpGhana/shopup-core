// /js/adapters/supabaseDbAdapter.js
(function () {
  function create({ supabase, logger }) {
    async function getSellerById(id) {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        logger.error(error);
        return null;
      }
      return data;
    }

    async function updateSellerStatus(id, status) {
      const { error } = await supabase
        .from("sellers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return true;
    }

    return { getSellerById, updateSellerStatus };
  }

  window.ShopUpSupabaseDbAdapter = { create };
})();
