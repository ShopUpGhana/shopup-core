// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

  function create({ sellerService, logger }) {
    function ghPagesSellerDashboardUrl() {
      // Works on:
      // - https://shopupghana.github.io/shopup-core/seller/register.html
      // - local/dev
      // Avoids <base href="../"> side effects
      const path = window.location.pathname || "";
      const isGhPages = /\/shopup-core\//.test(path);
      return isGhPages ? "/shopup-core/seller/dashboard.html" : "/seller/dashboard.html";
    }

    async function loadCampusesIntoDropdown() {
      const campusSelect = document.querySelector("#campus_id");
      logger.log("[ShopUp] campus select found?", !!campusSelect, campusSelect);

      if (!campusSelect) return;

      campusSelect.innerHTML = `<option value="">Loading campuses...</option>`;

      const res = await sellerService.listCampuses();
      logger.log("[ShopUp] listCampuses result:", res);

      if (!res || !res.ok) {
        campusSelect.innerHTML = `<option value="">Failed to load campuses</option>`;
        return;
      }

      const campuses = res.data || [];
      if (!campuses.length) {
        campusSelect.innerHTML = `<option value="">No campuses found</option>`;
        return;
      }

      const options = [
        `<option value="">Select campus (optional)</option>`,
        ...campuses.map((c) => {
          const label = c.city ? `${c.name} — ${c.city}` : c.name;
          return `<option value="${c.id}">${label}</option>`;
        }),
      ];

      campusSelect.innerHTML = options.join("");
    }

    function start() {
      const form = document.querySelector("#sellerRegisterForm");
      const submitBtn = document.querySelector("#submitBtn");
      const msg = document.querySelector("#msg");

      if (!form) {
        logger.error("[ShopUp] #sellerRegisterForm not found.");
        return;
      }

      loadCampusesIntoDropdown().catch((err) => {
        logger.error("[ShopUp] loadCampusesIntoDropdown error", err);
        const campusSelect = document.querySelector("#campus_id");
        if (campusSelect) campusSelect.innerHTML = `<option value="">Failed to load campuses</option>`;
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (submitBtn) submitBtn.disabled = true;
        if (msg) msg.textContent = "Creating account...";

        try {
          const formData = new FormData(form);

          const payload = {
            display_name: String(formData.get("display_name") || "").trim(),
            campus_id: String(formData.get("campus_id") || "").trim() || null,
            whatsapp_phone: String(formData.get("whatsapp_phone") || "").trim() || null,
            email: String(formData.get("email") || "").trim(),
            password: String(formData.get("password") || ""),
          };

          // Basic UX-friendly validation
          if (!payload.display_name) {
            if (msg) msg.textContent = "Shop/Brand name is required.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          if (!payload.email) {
            if (msg) msg.textContent = "Email is required.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          if (!payload.password || payload.password.length < 6) {
            if (msg) msg.textContent = "Password must be at least 6 characters.";
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          const res = await sellerService.registerSeller(payload);

          if (!res || !res.ok) {
            const friendly = res?.error?.message || "Something went wrong. Please try again.";
            if (msg) msg.textContent = friendly;
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          if (msg) msg.textContent = "✅ Account created. Redirecting…";

          // ✅ Bulletproof redirect for GitHub Pages + base href
          window.location.href = ghPagesSellerDashboardUrl();
        } catch (err) {
          logger.error("[ShopUp] register submit error", err);
          if (msg) msg.textContent = "Something went wrong. Please try again.";
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
