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
      return (
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 10)
      );
    }

    async function uploadImages({ sellerId, productId, files }) {
      try {
        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return { ok: true, urls: [] };

        const urls = [];

        for (const file of list) {
          const ext =
            (file.name && file.name.includes(".") && file.name.split(".").pop()) ||
            "jpg";

          const pathParts = [
            "seller",
            sellerId || "unknown",
            "product",
            productId || "new",
            `${randomId()}-${safeName(file.name || "image")}`,
          ];

          const objectPath = pathParts.join("/");

          const { error: upErr } = await supabaseClient.storage
            .from(BUCKET)
            .upload(objectPath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || `image/${ext}`,
            });

          if (upErr) return { ok: false, error: upErr };

          // Public URL (bucket is public)
          const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(objectPath);
          const publicUrl = data?.publicUrl;

          if (publicUrl) urls.push(publicUrl);
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
