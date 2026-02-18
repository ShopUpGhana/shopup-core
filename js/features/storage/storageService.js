// /js/features/storage/storageService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, bucketName, signedUrlExpiresIn }) {
    const BUCKET = bucketName || "product-images";
    const EXPIRES = Number(signedUrlExpiresIn || 3600);

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
      const uid = data?.user?.id;
      if (!uid) return { ok: false, error: { message: "Not authenticated." } };
      return { ok: true, uid };
    }

    function buildPath({ uid, productId, fileName }) {
      // STRICT folder policy expects:
      // seller/<auth.uid()>/product/<productId or new>/<filename>
      return [
        "seller",
        uid,
        "product",
        productId || "new",
        `${randomId()}-${safeName(fileName || "image")}`,
      ].join("/");
    }

    async function uploadImages({ productId, files }) {
      try {
        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return { ok: true, paths: [], urls: [] };

        const me = await getAuthUid();
        if (!me.ok) return me;

        const uid = me.uid;
        const paths = [];

        for (const file of list) {
          const objectPath = buildPath({ uid, productId, fileName: file.name });

          const { error: upErr } = await supabaseClient.storage
            .from(BUCKET)
            .upload(objectPath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || "image/jpeg",
            });

          if (upErr) return { ok: false, error: upErr };

          paths.push(objectPath);
        }

        // If bucket is private, generate signed URLs for immediate UI usage
        const urlsRes = await createSignedUrls(paths, EXPIRES);
        if (!urlsRes.ok) return urlsRes;

        return { ok: true, paths, urls: urlsRes.urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.uploadImages error", e);
        return { ok: false, error: { message: "Image upload failed." } };
      }
    }

    async function createSignedUrls(paths, expiresIn) {
      try {
        const list = Array.from(paths || []).filter(Boolean);
        if (!list.length) return { ok: true, urls: [] };

        // supabase-js supports createSignedUrl per path; loop is simplest + reliable
        const urls = [];
        for (const p of list) {
          const { data, error } = await supabaseClient.storage.from(BUCKET).createSignedUrl(p, expiresIn);
          if (error) return { ok: false, error };
          if (data?.signedUrl) urls.push(data.signedUrl);
        }

        return { ok: true, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.createSignedUrls error", e);
        return { ok: false, error: { message: "Could not create signed URLs." } };
      }
    }

    return { uploadImages, createSignedUrls };
  }

  window.ShopUpStorageService = { create };
})();
