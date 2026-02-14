// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

  function create({ sellerService, logger }) {
    function $(id) {
      return document.getElementById(id);
    }

    function setMsg(text) {
      const el = $("msg");
      if (el) el.textContent = text || "";
    }

    function setBusy(busy, label) {
      const btn = $("submitBtn");
      if (!btn) return;
      if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent || "Submit";
      btn.disabled = !!busy;
      btn.textContent = busy ? (label || "Working...") : btn.dataset.originalLabel;
    }

    function setCampuses(campuses) {
      const sel = $("campus_id");
      if (!sel) return;

      const html =
        `<option value="">Select campus (optional)</option>` +
        campuses
          .map((c) => {
            const label = c.city ? `${c.name} — ${c.city}` : c.name;
            return `<option value="${c.id}">${label}</option>`;
          })
          .join("");

      sel.innerHTML = html;
    }

    async function start() {
      // Load campuses
      const campusRes = await sellerService.listCampuses();
      logger.log("[ShopUp] listCampuses result:", campusRes);

      if (campusRes.ok) {
        setCampuses(campusRes.data || []);
        setMsg("");
      } else {
        setMsg(campusRes.error?.message || "Failed to load campuses.");
      }

      // Register submit
      const form = $("sellerRegisterForm");
      if (!form) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMsg("");
        setBusy(true, "Creating account...");

        try {
          const displayName = ($("display_name")?.value || "").trim();
          const whatsappPhone = ($("whatsapp_phone")?.value || "").trim();
          const campusId = $("campus_id")?.value || null;
          const email = ($("email")?.value || "").trim();
          const password = $("password")?.value || "";

          if (!displayName || !email || !password) {
            setMsg("Shop name, email, and password are required.");
            setBusy(false);
            return;
          }

          const res = await sellerService.registerSeller({
            email,
            password,
            displayName,
            whatsappPhone,
            campusId,
          });

          if (!res.ok) {
            setMsg(res.error?.message || "Registration failed.");
            setBusy(false);
            return;
          }

          const sellerId = res.data?.seller?.id;
          if (sellerId) {
            try {
              localStorage.setItem("shopup_seller_id", sellerId);
            } catch (_) {}
          }

          setMsg("✅ Done! Redirecting...");
          window.location.href = "./dashboard.html";
        } catch (err) {
          logger.error("[ShopUp] register submit error", err);
          setMsg("Something went wrong. Please try again.");
          setBusy(false);
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
