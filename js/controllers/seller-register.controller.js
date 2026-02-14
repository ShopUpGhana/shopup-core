// /js/controllers/seller-register.controller.js
(function () {
  "use strict";

  function create({ sellerService, logger }) {
    function sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function waitForDomReady() {
      if (document.readyState === "complete" || document.readyState === "interactive") return;
      await new Promise((resolve) =>
        document.addEventListener("DOMContentLoaded", resolve, { once: true })
      );
    }

    function findMsgEl() {
      return document.getElementById("msg") || document.querySelector("#msg") || null;
    }

    function setMsg(el, text) {
      if (el) el.textContent = text || "";
    }

    function findCampusSelect() {
      return (
        document.getElementById("campus_id") ||
        document.querySelector('select[name="campus_id"]') ||
        null
      );
    }

    function setCampusOptions(selectEl, campuses) {
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

      // Wait a moment for elements if scripts execute early
      let campusSelect = findCampusSelect();
      for (let i = 0; i < 30 && !campusSelect; i++) {
        await sleep(50);
        campusSelect = findCampusSelect();
      }

      logger.log("[ShopUp] campus select found?", !!campusSelect, campusSelect);

      if (!campusSelect) {
        setMsg(msg, "Campus dropdown not found in HTML.");
        return;
      }

      const res = await sellerService.listCampuses();
      logger.log("[ShopUp] listCampuses result:", res);

      if (!res.ok) {
        setMsg(msg, res.error?.message || "Failed to load campuses. Please refresh.");
        return;
      }

      setCampusOptions(campusSelect, res.data || []);
      setMsg(msg, "");
    }

    async function start() {
      await waitForDomReady();
      await loadCampusesIntoDropdown();
      // Next step after campuses work: signup/login + create seller profile (we’ll add right after)
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
