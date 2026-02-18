// /js/features/storage/storageService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, bucketName }) {
    const BUCKET = bucketName || "product-images";

    function safeName(name) {
      return String(name || "image")
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "_");
    }

    function randomId() {
      return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }

    function buildObjectPath({ sellerId, productId, fileName }) {
      const pid = productId || "new";
      return ["seller", sellerId, "product", pid, `${randomId()}-${safeName(fileName)}`].join("/");
    }

    function isAlreadyExistsError(err) {
      const msg = String(err?.message || err?.error || "").toLowerCase();
      // Supabase storage messages vary; cover common ones
      return msg.includes("already exists") || msg.includes("duplicate") || msg.includes("exists");
    }

    async function uploadOne({ sellerId, productId, file }) {
      const objectPath = buildObjectPath({
        sellerId,
        productId,
        fileName: file?.name || "image",
      });

      const { error: upErr } = await supabaseClient.storage
        .from(BUCKET)
        .upload(objectPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file?.type || "image/*",
        });

      if (!upErr) {
        const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(objectPath);
        return { ok: true, url: data?.publicUrl || null };
      }

      // Retry once if we hit a "file exists" edge case
      if (isAlreadyExistsError(upErr)) {
        const retryPath = buildObjectPath({
          sellerId,
          productId,
          fileName: file?.name || "image",
        });

        const { error: retryErr } = await supabaseClient.storage
          .from(BUCKET)
          .upload(retryPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file?.type || "image/*",
          });

        if (retryErr) return { ok: false, error: retryErr };

        const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(retryPath);
        return { ok: true, url: data?.publicUrl || null };
      }

      return { ok: false, error: upErr };
    }

    async function uploadImages({ sellerId, productId, files }) {
      try {
        const list = Array.from(files || []).filter(Boolean);

        if (!list.length) return { ok: true, urls: [] };

        if (!sellerId) {
          return { ok: false, error: { message: "Missing sellerId for image upload." } };
        }

        const urls = [];

        for (const file of list) {
          const one = await uploadOne({ sellerId, productId, file });
          if (!one.ok) return { ok: false, error: one.error };
          if (one.url) urls.push(one.url);
        }

        return { ok: true, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.uploadImages error", e);
        return { ok: false, error: { message: "Image upload failed." } };
      }
    }

    return { uploadImages };
  }

  window.ShopUpStorageService = { create };
})();
