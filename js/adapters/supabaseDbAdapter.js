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

    async function upsertUserProfile(row) {
      const { error } = await supabase
        .schema(SCH)
        .from("user_profiles")
        .upsert(row, { onConflict: "user_id" });

      if (error) {
        logger.error("[DbAdapter] upsertUserProfile error", error);
        throw error;
      }
      return true;
    }

    async function getSellerByUserId(userId) {
      const { data, error } = await supabase
        .schema(SCH)
        .from("sellers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logger.error("[DbAdapter] getSellerByUserId error", error);
        throw error;
      }
      return data || null;
    }

    async function createSellerDraft(row) {
      const { data, error } = await supabase
        .schema(SCH)
        .from("sellers")
        .insert({
          ...row,
          status: "draft",
          trust_tier: "campus_seller",
        })
        .select("*")
        .single();

      if (error) {
        logger.error("[DbAdapter] createSellerDraft error", error);
        throw error;
      }
      return data;
    }

    return {
      listCampuses,
      upsertUserProfile,
      getSellerByUserId,
      createSellerDraft,
    };
  }

  window.ShopUpSupabaseDbAdapter = { create };
})();
