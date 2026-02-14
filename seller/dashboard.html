// /js/controllers/seller-login.controller.js
(function () {
  "use strict";

  function create({ authService, logger }) {
    function isGhPages() {
      return /\/shopup-core\//.test(window.location.pathname || "");
    }

    // ✅ base-safe URL (works even with <base href="../" />)
    function dashboardUrl() {
      return isGhPages() ? "/shopup-core/seller/dashboard.html" : "/seller/dashboard.html";
    }

    async function redirectIfLoggedIn() {
      try {
        const res = await authService.session();
        const session = res?.data?.session;

        if (session && session.user) {
          window.location.href = dashboardUrl();
          return true;
        }
        return false;
      } catch (e) {
        logger.error("[ShopUp] redirectIfLoggedIn error", e);
        return false;
      }
    }

    function start() {
      // If already logged in → go dashboard
      redirectIfLoggedIn();

      const form = document.querySelector("#sellerLoginForm");
      const submitBtn = document.querySelector("#submitBtn");
      const msg = document.querySelector("#msg");

      if (!form) {
        logger.error("[ShopUp] #sellerLoginForm not found.");
        return;
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (msg) msg.textContent = "Signing in…";

        try {
          const formData = new FormData(form);
          const email = String(formData.get("email") || "").trim();
          const password = String(formData.get("password") || "");

          if (!email || !password) {
            if (msg) msg.textContent = "Email and password are required.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          const res = await authService.login({ email, password });

          if (!res || !res.ok) {
            if (msg) msg.textContent = res?.error?.message || "Login failed.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          if (msg) msg.textContent = "✅ Logged in. Redirecting…";
          window.location.href = dashboardUrl();
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
