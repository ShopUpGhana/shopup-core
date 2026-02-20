// /js/features/storage/storageService.js
(function () {
  "use strict";

  function create({ supabaseClient, authService, logger, bucketName }) {
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
      const res = await authService.session();
      const user = res?.data?.session?.user;
      if (!user?.id) return { ok: false, error: { message: "Not logged in." } };
      return { ok: true, uid: user.id };
    }

    /**
     * STRICT path convention:
     * seller/<auth.uid()>/product/<productId>/...
     */
    async function uploadImages({ productId, files }) {
      try {
        const me = await getAuthUid();
        if (!me.ok) return me;

        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return { ok: true, paths: [], urls: [] };

        const uid = me.uid;
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

          // If bucket is public, this works. If bucket is private, urls may be useless (we use signed URLs instead).
          const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(objectPath);
          if (data?.publicUrl) urls.push(data.publicUrl);
        }

        return { ok: true, paths, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.uploadImages error", e);
        return { ok: false, error: { message: "Image upload failed." } };
      }
    }

    return { uploadImages };
  }

  window.ShopUpStorageService = { create };
})();
