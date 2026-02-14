// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

  function create({ supabase, schema, logger }) {
    const SCH = schema || "shopup_core";

    function byId(id) {
      return document.getElementById(id);
    }

    function qs(sel) {
      return document.querySelector(sel);
    }

    function setMsg(el, text) {
      if (el) el.textContent = text || "";
    }

    function setBusy(btn, busy, labelWhenBusy) {
      if (!btn) return;
      if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent || "Submit";
      btn.disabled = !!busy;
      btn.textContent = busy ? (labelWhenBusy || "Working...") : btn.dataset.originalLabel;
    }

    function findCampusSelect() {
      // Preferred
      let el = byId("campus_id");
      if (el) return el;

      // Common fallback ids
      el = byId("campusSelect");
      if (el) return el;

      // Name-based fallback
      el = qs('select[name="campus_id"]');
      if (el) return el;

      return null;
    }

    async function loadCampuses(campusSelect, msg) {
      setMsg(msg, "Loading campuses...");

      const { data, error } = await supabase
        .schema(SCH)
        .from("campuses")
        .select("id,name,city")
        .eq("is_active", true)
        .order("name");

      if (error) {
        logger.error("[ShopUp] loadCampuses error", error);
        setMsg(msg, error.message || "Failed to load campuses. Please refresh.");
        return;
      }

      logger.log("[ShopUp] campuses loaded:", (data || []).length);

      const options =
        `<option value="">Select campus (optional)</option>` +
        (data || [])
          .map((c) => {
            const label = c.city ? `${c.name} — ${c.city}` : c.name;
            return `<option value="${c.id}">${label}</option>`;
          })
          .join("");

      campusSelect.innerHTML = options;
      setMsg(msg, "");
    }

    async function start() {
      const form = byId("sellerRegisterForm") || qs("form");
      const submitBtn = byId("submitBtn") || qs('button[type="submit"]');
      const msg = byId("msg") || qs("#msg") || qs('[data-msg="true"]');

      const campusSelect = findCampusSelect();

      logger.log("[ShopUp] register page elements", {
        hasForm: !!form,
        hasSubmitBtn: !!submitBtn,
        hasMsg: !!msg,
        campusSelectFound: !!campusSelect,
        campusSelectId: campusSelect ? campusSelect.id : null,
        campusSelectTag: campusSelect ? campusSelect.tagName : null,
      });

      if (!form) {
        logger.warn("[ShopUp] No form found. Add id='sellerRegisterForm' to your form.");
        return;
      }

      if (!campusSelect) {
        logger.warn(
          "[ShopUp] Campus <select> not found. Add: <select id='campus_id'>...</select> in register.html"
        );
      } else {
        await loadCampuses(campusSelect, msg);
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMsg(msg, "");
        setBusy(submitBtn, true, "Creating account...");

        try {
          // We won't block on this now — just proving campuses load into UI first.
          setMsg(msg, "✅ Form submit handler is wired. Next: signup/login + seller creation.");
        } catch (err) {
          logger.error("[ShopUp] submit error", err);
          setMsg(msg, "Something went wrong. Please try again.");
        } finally {
          setBusy(submitBtn, false);
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
