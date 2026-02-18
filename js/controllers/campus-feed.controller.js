// /js/controllers/campus-feed.controller.js
(function () {
  "use strict";

  function create({ supabaseClient, publicProductService, logger }) {
    const els = {};

    function grabEls() {
      els.grid = document.querySelector("#grid");
      els.msg = document.querySelector("#msg");
      els.campusFilter = document.querySelector("#campusFilter");
      els.refreshBtn = document.querySelector("#refreshBtn");
    }

    function safeText(el, text) {
      if (el) el.textContent = text;
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

    async function loadCampuses() {
      const res = await publicProductService.listCampuses();
      if (!res.ok) return;

      const campuses = res.data || [];
      const options = [
        `<option value="">All campuses</option>`,
        ...campuses.map((c) => {
          const label = c.city ? `${c.name} — ${c.city}` : c.name;
          return `<option value="${c.id}">${escapeHtml(label)}</option>`;
        }),
      ];

      if (els.campusFilter) els.campusFilter.innerHTML = options.join("");
    }

    async function signPaths(paths) {
      // Calls Edge Function: get-product-image-urls
      const { data, error } = await supabaseClient.functions.invoke("get-product-image-urls", {
        body: { paths, expiresIn: 3600 },
      });

      if (error) return { ok: false, error };
      if (!data?.ok) return { ok: false, error: { message: data?.error || "Sign failed" } };

      return { ok: true, urls: data.urls || [] };
    }

    async function render() {
      safeText(els.msg, "Loading products…");
      if (els.grid) els.grid.innerHTML = "";

      const campusId = els.campusFilter?.value || "";

      const res = await publicProductService.listPublishedProducts({ campusId });
      if (!res.ok) {
        safeText(els.msg, res?.error?.message || "Failed to load products.");
        return;
      }

      const products = res.data || [];
      if (!products.length) {
        safeText(els.msg, "No products found.");
        return;
      }

      // Build list of FIRST image path per product (cover)
      const coverPaths = products
        .map((p) => Array.isArray(p.image_paths) ? p.image_paths[0] : null)
        .filter(Boolean);

      // Sign them in one request (function limits to 60)
      const signed = coverPaths.length ? await signPaths(coverPaths) : { ok: true, urls: [] };
      if (!signed.ok) {
        // Still render without images
        logger?.warn?.("[ShopUp] signed urls failed", signed.error);
      }

      // Map path->url
      const pathToUrl = new Map();
      if (signed.ok) {
        for (let i = 0; i < coverPaths.length; i++) {
          pathToUrl.set(coverPaths[i], signed.urls[i]);
        }
      }

      safeText(els.msg, `Showing ${products.length} product(s).`);

      for (const p of products) {
        const campusLabel = p.campus
          ? (p.campus.city ? `${p.campus.name} — ${p.campus.city}` : p.campus.name)
          : "All campuses";

        const coverPath = Array.isArray(p.image_paths) ? p.image_paths[0] : null;
        const coverUrl = coverPath ? pathToUrl.get(coverPath) : null;

        const div = document.createElement("div");
        div.className = "p";
        div.innerHTML = `
          <img class="img" src="${coverUrl ? escapeHtml(coverUrl) : ""}" alt="product" loading="lazy" />
          <div style="margin-top:10px; display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
            <div style="min-width:0;">
              <div style="font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${escapeHtml(p.title || "—")}
              </div>
              <div class="muted" style="font-size:12px; margin-top:4px;">
                ${escapeHtml(campusLabel)}
              </div>
            </div>
            <div class="pill">${escapeHtml(p.currency || "GHS")} ${escapeHtml(money(p.price_ghs))}</div>
          </div>
        `;
        els.grid.appendChild(div);
      }
    }

    function start() {
      grabEls();
      loadCampuses().then(render);

      if (els.refreshBtn) els.refreshBtn.addEventListener("click", render);
      if (els.campusFilter) els.campusFilter.addEventListener("change", render);
    }

    return { start };
  }

  window.ShopUpCampusFeedController = { create };
})();
