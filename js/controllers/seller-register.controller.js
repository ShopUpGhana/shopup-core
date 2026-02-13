// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

  // This controller handles the FULL seller registration:
  // - Load campuses (shopup_core.campuses)
  // - Sign up user via Supabase Auth
  // - Create seller draft (shopup_core.sellers)
  // - Save campus preference (shopup_core.user_profiles)
  // - Redirect to dashboard

  function create({ supabase, schema, logger }) {
    const SCH = schema || "shopup_core";

    function $id(id) {
      return document.getElementById(id);
    }

    function setMsg(el, text) {
      if (!el) return;
      el.textContent = text || "";
    }

    function setBusy(btn, busy, labelWhenBusy) {
      if (!btn) return;
      btn.disabled = !!busy;
      if (labelWhenBusy) btn.textContent = busy ? labelWhenBusy : btn.dataset.originalLabel || btn.textContent;
    }

    async function loadCampuses(campusSelect, msg) {
      const { data, error } = await supabase
        .schema(SCH)
        .from("campuses")
        .select("id,name,city")
        .eq("is_active", true)
        .order("name");

      if (error) {
        logger.error("[ShopUp] loadCampuses error", error);
        setMsg(msg, "Failed to load campuses. Please refresh.");
        return;
      }

      const options =
        `<option value="">Select campus (optional)</option>` +
        (data || [])
          .map((c) => {
            const label = c.city ? `${c.name} — ${c.city}` : c.name;
            return `<option value="${c.id}">${label}</option>`;
          })
          .join("");

      campusSelect.innerHTML = options;
    }

    async function start() {
      const form = $id("sellerRegisterForm");
      if (!form) return;

      const submitBtn = $id("submitBtn");
      const msg = $id("msg");

      // Optional fields (if present in your HTML)
      const campusSelect = $id("campus_id");

      // Save original label
      if (submitBtn && !submitBtn.dataset.originalLabel) {
        submitBtn.dataset.originalLabel = submitBtn.textContent || "Create Account";
      }

      // Populate campuses if the dropdown exists
      if (campusSelect) {
        await loadCampuses(campusSelect, msg);
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMsg(msg, "");

        setBusy(submitBtn, true, "Creating account...");

        try {
          const email = ($id("email")?.value || "").trim();
          const password = $id("password")?.value || "";
          const displayName = ($id("display_name")?.value || "").trim();
          const whatsappPhone = ($id("whatsapp_phone")?.value || "").trim() || null;
          const campusId = campusSelect ? campusSelect.value || null : null;

          if (!email || !password || !displayName) {
            setMsg(msg, "Email, password, and shop name are required.");
            setBusy(submitBtn, false);
            return;
          }

          // 1) Sign up
          const { data: signupData, error: signupErr } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signupErr) {
            logger.error("[ShopUp] signup error", signupErr);
            setMsg(msg, signupErr.message || "Signup failed.");
            setBusy(submitBtn, false);
            return;
          }

          const userId = signupData?.user?.id;
          if (!userId) {
            // Some auth setups require email confirmation; user can still be returned
            setMsg(msg, "Signup succeeded but no user ID returned. Check auth settings.");
            setBusy(submitBtn, false);
            return;
          }

          // 2) Save campus preference (BOTH model) — optional
          if (campusId) {
            setMsg(msg, "Saving campus preference...");
            const { error: prefErr } = await supabase
              .schema(SCH)
              .from("user_profiles")
              .upsert({ user_id: userId, campus_id: campusId }, { onConflict: "user_id" });

            if (prefErr) {
              // Not fatal for seller registration; keep friction low
              logger.warn?.("[ShopUp] campus preference save failed", prefErr);
            }
          }

          // 3) Create seller draft
          setMsg(msg, "Creating seller profile...");
          const { data: sellerRow, error: sellerErr } = await supabase
            .schema(SCH)
            .from("sellers")
            .insert({
              user_id: userId,
              campus_id: campusId,
              display_name: displayName,
              whatsapp_phone: whatsappPhone,
              status: "draft",
              trust_tier: "campus_seller",
            })
            .select("*")
            .single();

          if (sellerErr) {
            logger.error("[ShopUp] seller create error", sellerErr);

            // Friendly, behavior-aware messages
            const msgText =
              sellerErr.message?.includes("duplicate key") || sellerErr.code === "23505"
                ? "This account already has a seller profile."
                : sellerErr.message || "Failed to create seller profile.";

            setMsg(msg, msgText);
            setBusy(submitBtn, false);
            return;
          }

          // 4) Success
          setMsg(msg, "✅ Seller profile created (Draft). Redirecting...");
          // Store seller id for dashboard convenience (not security-critical)
          try {
            localStorage.setItem("shopup_seller_id", sellerRow.id);
          } catch (_) {}

          window.location.href = "./dashboard.html";
        } catch (err) {
          logger.error("[ShopUp] register unexpected error", err);
          setMsg(msg, "Something went wrong. Please try again.");
          setBusy(submitBtn, false);
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
