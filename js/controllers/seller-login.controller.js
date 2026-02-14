// /js/controllers/seller-login.controller.js
(function () {
  "use strict";

  function create({ authService, logger }) {
    async function redirectIfLoggedIn() {
      const sess = await authService.session();
      const hasSession = !!sess?.data?.session;
      if (hasSession) window.location.href = "./dashboard.html";
    }

    function start() {
      const form = document.querySelector("#sellerLoginForm");
      const submitBtn = document.querySelector("#submitBtn");
      const msg = document.querySelector("#msg");

      if (!form) {
        logger.error("[ShopUp] #sellerLoginForm not found.");
        return;
      }

      // If already logged in, go dashboard
      redirectIfLoggedIn().catch((e) => logger.error("[ShopUp] redirectIfLoggedIn error", e));

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (msg) msg.textContent = "Signing in...";

        try {
          const formData = new FormData(form);

          const email = String(formData.get("email") || "").trim();
          const password = String(formData.get("password") || "");

          if (!email) {
            if (msg) msg.textContent = "Email is required.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          if (!password) {
            if (msg) msg.textContent = "Password is required.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          const res = await authService.login({ email, password });

          if (!res || !res.ok) {
            const friendly = res?.error?.message || "Login failed. Please try again.";
            if (msg) msg.textContent = friendly;
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          if (msg) msg.textContent = "✅ Signed in. Redirecting…";
          window.location.href = "./dashboard.html";
        } catch (err) {
          logger.error("[ShopUp] login submit error", err);
          if (msg) msg.textContent = "Something went wrong. Please try again.";
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerLoginController = { create };
})();
