// /js/controllers/seller-products.controller.js
(function () {
  "use strict";

  function create({ productService, authService, storageService, logger }) {
    function isGhPages() {
      return /\/shopup-core\//.test(window.location.pathname || "");
    }
    function loginUrl() {
      return isGhPages() ? "/shopup-core/seller/login.html" : "/seller/login.html";
    }

    const els = {};
    let cachedProducts = [];
    let showTrash = false;

    function grabEls() {
      els.logoutBtn = document.querySelector("#logoutBtn");
      els.refreshBtn = document.querySelector("#refreshBtn");
      els.trashBtn = document.querySelector("#trashBtn");

      els.form = document.querySelector("#productForm");
      els.createBtn = document.querySelector("#createBtn");
      els.formMsg = document.querySelector("#formMsg");
      els.listMsg = document.querySelector("#listMsg");
      els.tbody = document.querySelector("#productsTbody");
      els.campusSelect = document.querySelector("#campus_id");

      // fields
      els.productId = document.querySelector("#product_id");
      els.title = document.querySelector("#title");
      els.category = document.querySelector("#category");
      els.description = document.querySelector("#description");
      els.price = document.querySelector("#price_ghs");
      els.avail = document.querySelector("#is_available");
      els.status = document.querySelector("#status");
      els.imageUrls = document.querySelector("#image_urls");

      // file input
      els.images = document.querySelector("#images");
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

    async function loadCampuses() {
      if (!els.campusSelect) return;
      els.campusSelect.innerHTML = `<option value="">Loading campuses...</option>`;

      const res = await productService.listCampuses();
      if (!res.ok) {
        els.campusSelect.innerHTML = `<option value="">Failed to load campuses</option>`;
        return;
      }

      const campuses = res.data || [];
      const options = [
        `<option value="">All campuses (optional)</option>`,
        ...campuses.map((c) => {
          const label = c.city ? `${c.name} — ${c.city}` : c.name;
          return `<option value="${c.id}">${label}</option>`;
        }),
      ];
      els.campusSelect.innerHTML = options.join("");
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

    function setEditMode(product) {
      if (!product) return;

      if (els.productId) els.productId.value = product.id;
      if (els.title) els.title.value = product.title || "";
      if (els.category) els.category.value = product.category || "";
      if (els.description) els.description.value = product.description || "";
      if (els.price) els.price.value = product.price_ghs ?? "";
      if (els.avail) els.avail.value = String(!!product.is_available);
      if (els.status) els.status.value = String(product.status || "draft");

      // show urls only in the text input (paths are internal)
      if (els.imageUrls) {
        els.imageUrls.value = Array.isArray(product.image_urls) ? product.image_urls.join(", ") : "";
      }

      if (els.campusSelect) {
        els.campusSelect.value = product.campus_id || "";
      }

      if (els.images) els.images.value = "";
      if (els.createBtn) els.createBtn.textContent = "Save changes";
      safeText(els.formMsg, `Editing: ${product.title || "product"}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function clearEditMode() {
      if (els.productId) els.productId.value = "";
      if (els.form) els.form.reset();
      if (els.images) els.images.value = "";
      if (els.createBtn) els.createBtn.textContent = "Create product";
      safeText(els.formMsg, "");
    }

    function setTrashButtonUi() {
      if (!els.trashBtn) return;
      els.trashBtn.textContent = showTrash ? "Back" : "Trash";
    }

    async function signThumbs(rows) {
      // Create a signed URL for the first image path (thumbnail)
      // Returns map: path -> signedUrl
      const paths = rows
        .map((p) => (Array.isArray(p.image_paths) ? p.image_paths[0] : null))
        .filter(Boolean);

      const unique = Array.from(new Set(paths));
      if (!unique.length) return {};

      const res = await storageService.createSignedUrls({ paths: unique, expiresIn: 1800 });
      if (!res.ok) return {};

      const map = {};
      for (let i = 0; i < unique.length; i++) map[unique[i]] = res.urls[i];
      return map;
    }

    async function renderList() {
      safeText(els.listMsg, showTrash ? "Loading trash…" : "Loading…");
      if (els.tbody) els.tbody.innerHTML = "";

      const res = showTrash
        ? await productService.listMyDeletedProducts()
        : await productService.listMyProducts();

      if (!res.ok) {
        safeText(els.listMsg, res?.error?.message || "Failed to load products.");
        return;
      }

      const rows = res.data || [];
      cachedProducts = rows;

      if (!rows.length) {
        safeText(
          els.listMsg,
          showTrash ? "Trash is empty." : "No products yet. Create your first product above."
        );
        return;
      }

      // Signed thumbs for seller dashboard (private bucket)
      const thumbMap = await signThumbs(rows);

      safeText(
        els.listMsg,
        showTrash ? `Trash: ${rows.length} item(s).` : `Loaded ${rows.length} product(s).`
      );

      rows.forEach((p) => {
        const tr = document.createElement("tr");

        const status = String(p.status || "draft");
        const avail = !!p.is_available;
        const campusLabel = campusLabelFromProduct(p);

        const firstPath = Array.isArray(p.image_paths) ? p.image_paths[0] : null;
        const thumbUrl =
          (Array.isArray(p.image_urls) && p.image_urls[0]) ||
          (firstPath ? thumbMap[firstPath] : "");

        const actionsHtml = showTrash
          ? `
            <button class="secondary" data-action="restore" data-id="${p.id}">Restore</button>
            <button class="danger" data-action="purge" data-id="${p.id}">Delete permanently</button>
          `
          : `
            <button class="secondary" data-action="edit" data-id="${p.id}">Edit</button>
            <button class="secondary" data-action="toggle" data-id="${p.id}" data-avail="${avail}">
              ${avail ? "Disable" : "Enable"}
            </button>
            <button class="secondary" data-action="pub" data-id="${p.id}" data-status="${status}">
              ${status === "published" ? "Unpublish" : "Publish"}
            </button>
            <button class="danger" data-action="del" data-id="${p.id}">Delete</button>
          `;

        // Simple thumbnail inside the Title cell (keeps table unchanged)
        const thumbHtml = thumbUrl
          ? `<img src="${escapeHtml(thumbUrl)}" alt="" style="width:34px;height:34px;object-fit:cover;border-radius:8px;vertical-align:middle;margin-right:10px;border:1px solid rgba(255,255,255,.10);" />`
          : `<span class="pill" style="margin-right:10px;">No image</span>`;

        tr.innerHTML = `
          <td>${thumbHtml}${escapeHtml(p.title || "—")}</td>
          <td>${escapeHtml(p.currency || "GHS")} ${escapeHtml(money(p.price_ghs))}</td>
          <td><span class="pill">${escapeHtml(status)}</span></td>
          <td>${avail ? "✅" : "—"}</td>
          <td>${escapeHtml(campusLabel)}</td>
          <td>${actionsHtml}</td>
        `;

        els.tbody.appendChild(tr);
      });
    }

    async function onCreateOrUpdate(e) {
      e.preventDefault();

      if (showTrash) {
        safeText(els.formMsg, "Switch back from Trash to create/edit products.");
        return;
      }

      if (els.createBtn) els.createBtn.disabled = true;
      safeText(els.formMsg, "Saving…");

      try {
        const fd = new FormData(els.form);

        const product_id = String(fd.get("product_id") || "").trim();
        const title = String(fd.get("title") || "").trim();
        const category = String(fd.get("category") || "").trim() || null;
        const campus_id = String(fd.get("campus_id") || "").trim() || null;
        const description = String(fd.get("description") || "").trim() || null;

        const price_ghs = Number(fd.get("price_ghs"));
        const is_available = String(fd.get("is_available") || "true") === "true";
        const status = String(fd.get("status") || "draft");
        const image_urls_raw = String(fd.get("image_urls") || "").trim();

        if (!title) {
          safeText(els.formMsg, "Title is required.");
          if (els.createBtn) els.createBtn.disabled = false;
          return;
        }
        if (!isFinite(price_ghs) || price_ghs < 0) {
          safeText(els.formMsg, "Price must be a valid number.");
          if (els.createBtn) els.createBtn.disabled = false;
          return;
        }

        // Manual URLs (optional)
        const image_urls =
          image_urls_raw.length
            ? image_urls_raw.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        // Load current product (if editing) so we can preserve existing image_paths
        let existingPaths = [];
        if (product_id) {
          const existing = cachedProducts.find((x) => x.id === product_id);
          existingPaths = Array.isArray(existing?.image_paths) ? existing.image_paths : [];
        }

        // Upload selected files (STRICT path => auth.uid folder)
        const files = els.images?.files;
        let uploadedPaths = [];
        let uploadedUrls = [];

        if (files && files.length) {
          const up = await storageService.uploadImages({
            productId: product_id || "new",
            files,
          });

          if (!up.ok) {
            safeText(els.formMsg, up?.error?.message || "Image upload failed.");
            if (els.createBtn) els.createBtn.disabled = false;
            return;
          }

          uploadedPaths = up.paths || [];
          uploadedUrls = up.urls || [];
        }

        // Enterprise: store paths always
        const image_paths = [...existingPaths, ...uploadedPaths];

        // Keep image_urls as a “cache” (optional). For private bucket, urls may be empty.
        // We keep any manual URLs + any public URLs returned (if bucket is public).
        const final_urls = [...image_urls, ...uploadedUrls];

        const payload = {
          title,
          category,
          campus_id,
          description,
          price_ghs,
          currency: "GHS",
          status,
          is_available,
          image_urls: final_urls,
          image_paths,
        };

        let res;
        if (product_id) {
          res = await productService.updateProduct(product_id, payload);
        } else {
          res = await productService.createProduct(payload);
        }

        if (!res.ok) {
          safeText(els.formMsg, res?.error?.message || "Save failed.");
          if (els.createBtn) els.createBtn.disabled = false;
          return;
        }

        safeText(els.formMsg, product_id ? "✅ Changes saved." : "✅ Product created.");
        clearEditMode();
        await renderList();
      } catch (err) {
        logger.error("[ShopUp] save product error", err);
        safeText(els.formMsg, "Something went wrong. Please try again.");
      } finally {
        if (els.createBtn) els.createBtn.disabled = false;
      }
    }

    async function onTableClick(e) {
      const btn = e.target?.closest?.("button");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!action || !id) return;

      if (action === "restore") {
        const res = await productService.restoreProduct(id);
        if (!res.ok) alert(res?.error?.message || "Restore failed.");
        clearEditMode();
        await renderList();
        return;
      }

      if (action === "purge") {
        if (!showTrash) return;
        const first = confirm("Delete permanently? This cannot be undone.");
        if (!first) return;
        const second = prompt('Type DELETE to permanently remove this item:');
        if (String(second || "").trim().toUpperCase() !== "DELETE") {
          alert("Cancelled.");
          return;
        }
        const res = await productService.deleteProductPermanently(id, true);
        if (!res.ok) alert(res?.error?.message || "Permanent delete failed.");
        clearEditMode();
        await renderList();
        return;
      }

      if (action === "edit") {
        if (showTrash) return;
        const p = cachedProducts.find((x) => x.id === id);
        if (!p) return;
        setEditMode(p);
        return;
      }

      if (action === "del") {
        if (showTrash) return;
        if (!confirm("Delete this product? (soft delete)")) return;
        const res = await productService.deleteProduct(id);
        if (!res.ok) alert(res?.error?.message || "Delete failed.");
        clearEditMode();
        await renderList();
        return;
      }

      if (action === "toggle") {
        if (showTrash) return;
        const current = btn.dataset.avail === "true";
        const res = await productService.toggleAvailability(id, !current);
        if (!res.ok) alert(res?.error?.message || "Update failed.");
        await renderList();
        return;
      }

      if (action === "pub") {
        if (showTrash) return;
        const status = btn.dataset.status;
        const res =
          status === "published"
            ? await productService.unpublish(id)
            : await productService.publish(id);

        if (!res.ok) alert(res?.error?.message || "Update failed.");
        await renderList();
      }
    }

    function start() {
      grabEls();
      setTrashButtonUi();

      guardSession()
        .then((ok) => {
          if (!ok) return;
          return loadCampuses().then(renderList);
        })
        .catch((e) => logger.error(e));

      if (els.form) els.form.addEventListener("submit", onCreateOrUpdate);

      if (els.refreshBtn) {
        els.refreshBtn.addEventListener("click", () => {
          clearEditMode();
          renderList();
        });
      }

      if (els.trashBtn) {
        els.trashBtn.addEventListener("click", async () => {
          showTrash = !showTrash;
          setTrashButtonUi();
          clearEditMode();
          await renderList();
        });
      }

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

  window.ShopUpSellerProductsController = { create };
})();
