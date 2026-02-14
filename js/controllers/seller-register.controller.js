// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

  function create({ sellerService, logger }) {
    function sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function waitForDomReady() {
      if (document.readyState === "complete" || document.readyState === "interactive") return;
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }

    function findCampusSelect() {
      // Most likely IDs / names
      return (
        document.getElementById("campus_id") ||
        document.getElementById("campusSelect") ||
        document.querySelector('select[name="campus_id"]') ||
        document.querySelector("[data-campus-select]") ||
        null
      );
    }

    function findMsgEl() {
      return (
        document.getElementById("msg") ||
        document.querySelector("#msg") ||
        document.querySelector("[data-msg]") ||
        null
      );
    }

    function setMsg(el, text) {
      if (!el) return;
      el.textContent = text || "";
    }

    function setOptions(selectEl, campuses) {
      if (!selectEl) return;

      const html =
        `<option value="">Select campus (optional)</option>` +
        campuses
          .map((c) => {
            const label = c.city ? `${c.name} — ${c.city}` : c.name;
            return `<option value="${c.id}">${label}</option>`;
          })
          .join("");

      selectEl.innerHTML = html;
    }

    async function loadCampusesIntoDropdown() {
      const msg = findMsgEl();
      setMsg(msg, "Loading campuses...");

      // Sometimes scripts run before elements exist (especially if not using defer)
      let campusSelect = findCampusSelect();
      for (let i = 0; i < 20 && !campusSelect; i++) {
        await sleep(50);
        campusSelect = findCampusSelect();
      }

      logger.log("[ShopUp] campus select found?", !!campusSelect, campusSelect);

      if (!campusSelect) {
        setMsg(msg, "Campus dropdown not found in HTML.");
        logger.warn(
          "[ShopUp] Add a <select id='campus_id' name='campus_id'></select> to register.html"
        );
        return;
      }

      const res = await sellerService.listCampuses();

      logger.log("[ShopUp] campuses response:", res);

      if (!res.ok) {
        setMsg(msg, res.error?.message || "Failed to load campuses. Please refresh.");
        return;
      }

      setOptions(campusSelect, res.data || []);
      setMsg(msg, "");
    }

    async function start() {
      await waitForDomReady();
      await loadCampusesIntoDropdown();
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
