// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

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
      if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent || "Submit";
      btn.disabled = !!busy;
      btn.textContent = busy ? (labelWhenBusy || "Working...") : btn.dataset.originalLabel;
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

        // Friendly message + exact fix
        if (error.code === "PGRST106") {
          setMsg(
            msg,
            'Campuses not loading because Supabase API is not exposing the "shopup_core" schema yet. Fix: Supabase → Settings → API → Exposed schemas → add "shopup_core".'
          );
        } else {
          setMsg(msg, "Failed to load campuses. Please refresh.");
        }
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

    async function ensureSignedIn({ email, password, msg }) {
      // 1) Try sign up
      const { data: signupData, error: signupErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!signupErr) {
        const userId = signupData?.user?.id;
        return { ok: true, userId, mode: "signup" };
      }

      // If already registered, fallback to login
      const already =
        (signupErr.message || "").toLowerCase().includes("already registered") ||
        (signupErr.message || "").toLowerCase().includes("already exists");

      if (already) {
        setMsg(msg, "Account exists — signing you in...");

        const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signinErr) {
          logger.error("[ShopUp] signIn error", signinErr);
          return {
            ok: false,
            error: "This email already exists. Try the correct password or use Seller Login (we’ll add it next).",
          };
        }

        const userId = signinData?.user?.id;
        return { ok: true, userId, mode: "signin" };
      }

      // Other signup errors
      logger.error("[ShopUp] signup error", signupErr);
      return { ok: false, error: signupErr.message || "Signup failed." };
    }

    async function getSellerByUserId(userId) {
      const { data, error } = await supabase
        .schema(SCH)
        .from("sellers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logger.error("[ShopUp] getSellerByUserId error", error);
        return null;
      }
      return data || null;
    }

    async function createSeller({ userId, campusId, displayName, whatsappPhone, msg }) {
      setMsg(msg, "Creating seller profile...");

      const { data, error } = await supabase
        .schema(SCH)
        .from("sellers")
        .insert({
          user_id: userId,
          campus_id: campusId,
          display_name: displayName,
          whatsapp_phone: whatsappPhone || null,
          status: "draft",
          trust_tier: "campus_seller",
        })
        .select("*")
        .single();

      if (error) {
        logger.error("[ShopUp] seller create error", error);

        if (error.code === "PGRST106") {
          return {
            ok: false,
            error:
              'Supabase is not exposing "shopup_core" to the API. Fix: Supabase → Settings → API → Exposed schemas → add "shopup_core".',
          };
        }

        return { ok: false, error: error.message || "Failed to create seller profile." };
      }

      return { ok: true, seller: data };
    }

    async function upsertUserProfile({ userId, campusId }) {
      if (!campusId) return;

      // Optional: campus preference should never block signup
      const { error } = await supabase
        .schema(SCH)
        .from("user_profiles")
        .upsert({ user_id: userId, campus_id: campusId }, { onConflict: "user_id" });

      if (error) logger.warn?.("[ShopUp] user_profiles upsert failed", error);
    }

    async function start() {
      const form = $id("sellerRegisterForm");
      if (!form) return;

      const submitBtn = $id("submitBtn");
      const msg = $id("msg");
      const campusSelect = $id("campus_id");

      // Load campuses
      if (campusSelect) await loadCampuses(campusSelect, msg);

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMsg(msg, "");
        setBusy(submitBtn, true, "Creating account...");

        try {
          const displayName = ($id("display_name")?.value || "").trim();
          const whatsappPhone = ($id("whatsapp_phone")?.value || "").trim();
          const campusId = campusSelect ? campusSelect.value || null : null;
          const email = ($id("email")?.value || "").trim();
          const password = $id("password")?.value || "";

          if (!displayName || !email || !password) {
            setMsg(msg, "Shop name, email, and password are required.");
            setBusy(submitBtn, false);
            return;
          }

          // 1) ensure signed in (signup OR login)
          const authRes = await ensureSignedIn({ email, password, msg });
          if (!authRes.ok) {
            setMsg(msg, authRes.error);
            setBusy(submitBtn, false);
            return;
          }

          const userId = authRes.userId;
          if (!userId) {
            setMsg(msg, "Auth succeeded but user ID missing. Check Supabase Auth settings.");
            setBusy(submitBtn, false);
            return;
          }

          // 2) Save profile preference (optional)
          await upsertUserProfile({ userId, campusId });

          // 3) Create seller if missing
          setMsg(msg, "Checking seller profile...");
          const existing = await getSellerByUserId(userId);

          if (existing) {
            try {
              localStorage.setItem("shopup_seller_id", existing.id);
            } catch (_) {}
            setMsg(msg, "✅ Welcome back! Redirecting...");
            window.location.href = "./dashboard.html";
            return;
          }

          // Create new seller
          const createRes = await createSeller({
            userId,
            campusId,
            displayName,
            whatsappPhone,
            msg,
          });

          if (!createRes.ok) {
            setMsg(msg, createRes.error);
            setBusy(submitBtn, false);
            return;
          }

          try {
            localStorage.setItem("shopup_seller_id", createRes.seller.id);
          } catch (_) {}

          setMsg(msg, "✅ Seller profile created (Draft). Redirecting...");
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
