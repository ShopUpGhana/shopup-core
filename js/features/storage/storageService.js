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

    async function getAuthUid() {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) return { ok: false, error };
      const uid = data?.user?.id || null;
      if (!uid) return { ok: false, error: { message: "Not logged in." } };
      return { ok: true, uid };
    }

    /**
     * STRICT path convention (enforced by Storage policy):
     * seller/<AUTH_UID>/product/<productId-or-new>/<random>-<filename>
     *
     * Returns:
     * { ok: true, paths: [...], urls: [...] }
     */
    async function uploadImages({ productId, files }) {
      try {
        const u = await getAuthUid();
        if (!u.ok) return { ok: false, error: u.error };

        const uid = u.uid;

        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return { ok: true, paths: [], urls: [] };

        const paths = [];
        const urls = [];

        for (const file of list) {
          const ext =
            (file.name && file.name.includes(".") && file.name.split(".").pop()) || "jpg";

          const objectPath = [
            "seller",
            uid,
            "product",
            productId || "new",
            `${randomId()}-${safeName(file.name || "image")}`,
          ].join("/");

          const { error: upErr } = await supabaseClient.storage
            .from(BUCKET)
            .upload(objectPath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || `image/${ext}`,
            });

          if (upErr) return { ok: false, error: upErr };

          paths.push(objectPath);

          // If bucket is PUBLIC, this gives a usable URL immediately.
          // If bucket becomes PRIVATE later, we'll generate signed URLs from paths instead.
          const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(objectPath);
          if (data?.publicUrl) urls.push(data.publicUrl);
        }

        return { ok: true, paths, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.uploadImages error", e);
        return { ok: false, error: { message: "Image upload failed." } };
      }
    }

    /**
     * For PRIVATE bucket later:
     * Pass stored paths and get signed URLs (expiresIn seconds).
     */
    async function createSignedUrls({ paths, expiresIn }) {
      try {
        const list = Array.from(paths || []).filter(Boolean);
        if (!list.length) return { ok: true, urls: [] };

        const urls = [];

        for (const p of list) {
          const { data, error } = await supabaseClient.storage
            .from(BUCKET)
            .createSignedUrl(p, expiresIn || 3600);

          if (error) return { ok: false, error };
          if (data?.signedUrl) urls.push(data.signedUrl);
        }

        return { ok: true, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.createSignedUrls error", e);
        return { ok: false, error: { message: "Could not create signed URLs." } };
      }
    }

    return {
      uploadImages,
      createSignedUrls, // used later when bucket is private
    };
  }

  window.ShopUpStorageService = { create };
})();
