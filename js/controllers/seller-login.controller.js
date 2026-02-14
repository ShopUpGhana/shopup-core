// /js/controllers/seller-login.controller.js
(function () {
  "use strict";

  function create({ supabaseClient, logger }) {
    function ghPagesUrl(path) {
      // Ensures redirects work on GitHub Pages and locally
      const p = window.location.pathname || "";
      const isGhPages = /\/shopup-core\//.test(p);
      return isGhPages ? `/shopup-core${path}` : path;
    }

    async function ensureSellerProfile(userId) {
      // Optional guard: confirm this user has a seller profile row
      // (prevents customers from landing here later if you add customer auth)
      const { data, error } = await supabaseClient
        .schema("shopup_core")
        .from("sellers")
        .select("id,user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return { ok: false, error };
      if (!data) return { ok: false, error: { message: "No seller profile found for this account." } };
      return { ok: true, data };
    }

    function start() {
      const form = document.querySelector("#sellerLoginForm");
      const submitBtn = document.querySelector("#submitBtn");
      const msg = document.querySelector("#msg");
      const forgotBtn = document.querySelector("#forgotBtn");
      const goRegisterBtn = document.querySelector("#goRegisterBtn");

      if (!form) {
        logger.error("[ShopUp] #sellerLoginForm not found.");
        return;
      }

      // If already logged in, go straight to dashboard
      (async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) window.location.href = ghPagesUrl("/seller/dashboard.html");
      })().catch((e) => logger.error(e));

      goRegisterBtn?.addEventListener("click", () => {
        window.location.href = ghPagesUrl("/seller/register.html");
      });

      forgotBtn?.addEventListener("click", async () => {
        try {
          const email = String(document.querySelector("#email")?.value || "").trim();
          if (!email) {
            msg.textContent = "Enter your email first.";
            return;
          }

          msg.textContent = "Sending reset link…";

          // You MUST set this URL in Supabase Auth settings (redirect URLs).
          const redirectTo = ghPagesUrl("/seller/login.html");

          const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) {
            logger.error("[ShopUp] resetPasswordForEmail error", error);
            msg.textContent = error.message || "Could not send reset email.";
            return;
          }

          msg.textContent = "✅ Password reset email sent. Check your inbox.";
        } catch (err) {
          logger.error(err);
          msg.textContent = "Something went wrong. Try again.";
        }
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (submitBtn) submitBtn.disabled = true;
        if (msg) msg.textContent = "Logging in…";

        try {
          const email = String(document.querySelector("#email")?.value || "").trim();
          const password = String(document.querySelector("#password")?.value || "");

          if (!email) {
            msg.textContent = "Email is required.";
            submitBtn.disabled = false;
            return;
          }
          if (!password) {
            msg.textContent = "Password is required.";
            submitBtn.disabled = false;
            return;
          }

          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

          if (error) {
            logger.error("[ShopUp] signInWithPassword error", error);
            msg.textContent = error.message || "Login failed.";
            submitBtn.disabled = false;
            return;
          }

          const user = data?.user;
          if (!user) {
            msg.textContent = "Login succeeded but no user session found.";
            submitBtn.disabled = false;
            return;
          }

          // Seller-only guard (recommended)
          const sellerCheck = await ensureSellerProfile(user.id);
          if (!sellerCheck.ok) {
            msg.textContent = sellerCheck?.error?.message || "This account is not a seller yet.";
            // Optional: sign them out
            await supabaseClient.auth.signOut();
            submitBtn.disabled = false;
            return;
          }

          msg.textContent = "✅ Logged in. Redirecting…";
          window.location.href = ghPagesUrl("/seller/dashboard.html");
        } catch (err) {
          logger.error("[ShopUp] login submit error", err);
          msg.textContent = "Something went wrong. Please try again.";
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerLoginController = { create };
})();
