// /js/controllers/seller-products.controller.js
(function () {
  "use strict";

  function create({ productService, logger }) {
    let els = {};

    function $(sel) {
      return document.querySelector(sel);
    }

    function setMsg(text) {
      if (els.msg) els.msg.textContent = text || "";
    }

    function money(n) {
      const x = Number(n);
      if (!Number.isFinite(x)) return "—";
      return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderList(items) {
      if (!els.list) return;

      if (!items.length) {
        els.list.innerHTML = `<div class="muted">No products yet. Create your first one above.</div>`;
        return;
      }

      els.list.innerHTML = items
        .map(
          (p) => `
          <div class="item">
            <div style="flex:1;">
              <div style="font-weight:700;">${escapeHtml(p.name || "—")}</div>
              <div class="muted" style="font-size:12px;">
                Price: GHS ${money(p.price)} • Status: ${escapeHtml(p.status || "—")}
              </div>
            </div>
            <button class="secondary" data-del="${p.id}">Delete</button>
          </div>
        `
        )
        .join("");

      // Bind delete
      els.list.querySelectorAll("button[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-del");
          if (!id) return;

          btn.disabled = true;
          setMsg("Deleting…");

          const res = await productService.deleteProduct(id);
          if (!res || !res.ok) {
            setMsg(res?.error?.message || "Delete failed.");
            btn.disabled = false;
            return;
          }

          setMsg("✅ Deleted.");
          await refresh();
        });
      });
    }

    async function refresh() {
      setMsg("Loading products…");
      const res = await productService.listMyProducts();
      if (!res || !res.ok) {
        setMsg(res?.error?.message || "Failed to load products.");
        renderList([]);
        return;
      }
      renderList(res.data || []);
      setMsg("");
    }

    function escapeHtml(str) {
      return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function start() {
      els.form = $("#productCreateForm");
      els.name = $("#product_name");
      els.price = $("#product_price");
      els.btn = $("#productSubmitBtn");
      els.msg = $("#productMsg");
      els.list = $("#productList");

      if (!els.form) {
        logger.warn("[ShopUp] productCreateForm not found (skip products).");
        return;
      }

      els.form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (els.btn) els.btn.disabled = true;
        setMsg("Creating product…");

        const name = els.name?.value || "";
        const price = els.price?.value || "";

        const res = await productService.createProduct({ name, price });
        if (!res || !res.ok) {
          setMsg(res?.error?.message || "Create failed.");
          if (els.btn) els.btn.disabled = false;
          return;
        }

        setMsg("✅ Created.");
        if (els.name) els.name.value = "";
        if (els.price) els.price.value = "";
        if (els.btn) els.btn.disabled = false;

        await refresh();
      });

      refresh();
    }

    return { start, refresh };
  }

  window.ShopUpSellerProductsController = { create };
})();

