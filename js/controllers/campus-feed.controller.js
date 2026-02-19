// /js/controllers/campus-feed.controller.js
(function () {
  "use strict";

  function create({ productService, storageService, supabaseClient, logger }) {
    const els = {};
    let campuses = [];
    let products = [];

    function grabEls() {
      els.refreshBtn = document.querySelector("#refreshBtn");
      els.applyBtn = document.querySelector("#applyBtn");
      els.campusSelect = document.querySelector("#campus_id");
      els.q = document.querySelector("#q");
      els.feedMsg = document.querySelector("#feedMsg");
      els.feedGrid = document.querySelector("#feedGrid");
    }

    function safeText(el, text) {
      if (el) el.textContent = text;
    }

    function escapeHtml(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function money(v) {
      const n = Number(v || 0);
      return isFinite(n) ? n.toFixed(2) : "0.00";
    }

    function pickCoverPath(p) {
      if (p.cover_image_path) return p.cover_image_path;
      if (Array.isArray(p.image_paths) && p.image_paths.length) return p.image_paths[0];
      return null;
    }

    async function loadCampuses() {
      if (!els.campusSelect) return;

      els.campusSelect.innerHTML = `<option value="">Loading campuses…</option>`;
      const res = await productService.listCampuses();

      if (!res.ok) {
        els.campusSelect.innerHTML = `<option value="">Failed to load campuses</option>`;
        return;
      }

      campuses = res.data || [];

      const options = [
        `<option value="">All campuses</option>`,
        ...campuses.map((c) => {
          const label = c.city ? `${c.name} — ${c.city}` : c.name;
          return `<option value="${c.id}">${escapeHtml(label)}</option>`;
        }),
      ];

      els.campusSelect.innerHTML = options.join("");
    }

    async function fetchFeed() {
      const campusId = String(els.campusSelect?.value || "").trim() || null;
      const q = String(els.q?.value || "").trim() || null;

      safeText(els.feedMsg, "Loading feed…");
      if (els.feedGrid) els.feedGrid.innerHTML = "";

      const res = await productService.listPublicFeed({ campusId, q, limit: 80 });
      if (!res.ok) {
        safeText(els.feedMsg, res?.error?.message || "Failed to load feed.");
        return;
      }

      products = res.data || [];
      if (!products.length) {
        safeText(els.feedMsg, "No products found.");
        return;
      }

      safeText(els.feedMsg, `Showing ${products.length} product(s).`);

      // Build one batch request for thumbnail signing
      const uniquePaths = [];
      const pathSet = new Set();

      for (const p of products) {
        const path = pickCoverPath(p);
        if (path && !pathSet.has(path)) {
          pathSet.add(path);
          uniquePaths.push(path);
        }
      }

      // Call Edge Function to get signed thumbnail URLs (public-safe)
      // (If you haven’t deployed the function yet, you’ll just see placeholders)
      let signedMap = {};
      if (uniquePaths.length) {
        try {
          const fn = await supabaseClient.functions.invoke("sign-product-images", {
            body: {
              paths: uniquePaths,
              expiresIn: 60 * 10,
              transform: { width: 600, height: 400, resize: "cover", quality: 80 },
            },
          });

          if (fn?.data?.ok) signedMap = fn.data.map || {};
        } catch (e) {
          logger?.error?.("[ShopUp] sign thumbnails error", e);
        }
      }

      renderGrid(signedMap);
    }

    function renderGrid(signedMap) {
      if (!els.feedGrid) return;
      els.feedGrid.innerHTML = "";

      for (const p of products) {
        const coverPath = pickCoverPath(p);
        const imgUrl = coverPath ? signedMap[coverPath] : null;

        const campusLabel = p.campus
          ? (p.campus.city ? `${p.campus.name} — ${p.campus.city}` : p.campus.name)
          : "All campuses";

        const div = document.createElement("div");
        div.className = "pCard";

        div.innerHTML = `
          <div class="pImg">
            ${
              imgUrl
                ? `<img src="${escapeHtml(imgUrl)}" alt="product" />`
                : `<div class="muted" style="font-size:12px;">No image</div>`
            }
          </div>
          <div class="pBody">
            <div class="pTitle">${escapeHtml(p.title || "—")}</div>
            <div class="pMeta">
              <div><span class="pill">${escapeHtml(p.currency || "GHS")} ${escapeHtml(money(p.price_ghs))}</span></div>
              <div class="muted">${escapeHtml(campusLabel)}</div>
            </div>
            <div class="muted" style="font-size:12px;">
              ${escapeHtml(p.category || "General")}
            </div>
          </div>
        `;

        els.feedGrid.appendChild(div);
      }
    }

    function start() {
      grabEls();

      loadCampuses()
        .then(fetchFeed)
        .catch((e) => logger?.error?.(e));

      if (els.refreshBtn) els.refreshBtn.addEventListener("click", fetchFeed);
      if (els.applyBtn) els.applyBtn.addEventListener("click", fetchFeed);

      if (els.q) {
        els.q.addEventListener("keydown", (e) => {
          if (e.key === "Enter") fetchFeed();
        });
      }
    }

    return { start };
  }

  window.ShopUpCampusFeedController = { create };
})();
