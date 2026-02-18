// /js/controllers/seller-products-trash.controller.js
(function () {
  "use strict";

  function create({ productService, authService, logger }) {
    function isGhPages() {
      return /\/shopup-core\//.test(window.location.pathname || "");
    }
    function loginUrl() {
      return isGhPages() ? "/shopup-core/seller/login.html" : "/seller/login.html";
    }

    const els = {};
    let cachedProducts = [];

    function grabEls() {
      els.logoutBtn = document.querySelector("#logoutBtn");
      els.refreshBtn = document.querySelector("#refreshBtn");
      els.listMsg = document.querySelector("#listMsg");
      els.tbody = document.querySelector("#productsTbody");
    }

    function safeText(el, text) {
      if (el) el.textContent = text;
    }

    async function guardSession() {
      const res = await authService.session();
      const session = res?.data?.session;
      if (!session || !session.user) {
        window.location.href = loginUrl();
        return false;
      }
      return true;
    }

    function money(v) {
      const n = Number(v || 0);
      return isFinite(n) ? n.toFixed(2) : "0.00";
    }

    function escapeHtml(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function campusLabelFromProduct(p) {
      return p.campus
        ? (p.campus.city ? `${p.campus.name} — ${p.campus.city}` : p.campus.name)
        : "All campuses";
    }

    function formatDate(dateStr) {
      if (!dateStr) return "—";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString();
      } catch (e) {
        return "—";
      }
    }

    async function renderList() {
      safeText(els.listMsg, "Loading…");
      if (els.tbody) els.tbody.innerHTML = "";

      const res = await productService.listMyDeletedProducts();
      if (!res.ok) {
        safeText(els.listMsg, res?.error?.message || "Failed to load deleted products.");
        return;
      }

      const rows = res.data || [];
      cachedProducts = rows;

      if (!rows.length) {
        safeText(els.listMsg, "No deleted products. Your trash is empty.");
        return;
      }

      safeText(els.listMsg, `Loaded ${rows.length} deleted product(s).`);

      rows.forEach((p) => {
        const tr = document.createElement("tr");

        const status = String(p.status || "draft");
        const campusLabel = campusLabelFromProduct(p);
        const deletedAt = formatDate(p.deleted_at);

        tr.innerHTML = `
          <td>${escapeHtml(p.title || "—")}</td>
          <td>${escapeHtml(p.currency || "GHS")} ${escapeHtml(money(p.price_ghs))}</td>
          <td><span class="pill">${escapeHtml(status)}</span></td>
          <td>${escapeHtml(deletedAt)}</td>
          <td>${escapeHtml(campusLabel)}</td>
          <td>
            <button class="secondary" data-action="restore" data-id="${p.id}">Restore</button>
            <button class="danger" data-action="delete-perm" data-id="${p.id}">Delete Forever</button>
          </td>
        `;

        els.tbody.appendChild(tr);
      });
    }

    async function onTableClick(e) {
      const btn = e.target?.closest?.("button");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!action || !id) return;

      if (action === "restore") {
        if (!confirm("Restore this product?")) return;
        const res = await productService.restoreProduct(id);
        if (!res.ok) {
          alert(res?.error?.message || "Restore failed.");
        } else {
          alert("✅ Product restored successfully!");
        }
        await renderList();
        return;
      }

      if (action === "delete-perm") {
        if (!confirm("⚠️ Permanently delete this product? This cannot be undone!")) return;
        const res = await productService.deleteProductPermanently(id, true);
        if (!res.ok) {
          alert(res?.error?.message || "Permanent delete failed.");
        } else {
          alert("✅ Product deleted permanently.");
        }
        await renderList();
        return;
      }
    }

    function start() {
      grabEls();

      guardSession()
        .then((ok) => {
          if (!ok) return;
          return renderList();
        })
        .catch((e) => logger.error(e));

      if (els.refreshBtn) els.refreshBtn.addEventListener("click", renderList);
      if (els.tbody) els.tbody.addEventListener("click", onTableClick);

      if (els.logoutBtn) {
        els.logoutBtn.addEventListener("click", async () => {
          await authService.logout();
          window.location.href = loginUrl();
        });
      }
    }

    return { start };
  }

  window.ShopUpSellerProductsTrashController = { create };
})();
