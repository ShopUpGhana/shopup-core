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

    // STRICT path convention: seller/<auth.uid()>/product/<productId>/...
    async function uploadImages({ productId, files }) {
      try {
        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return { ok: true, paths: [], urls: [] };

        // use auth.uid() in folder name (STRICT policy matches this)
        const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !authData?.user?.id) return { ok: false, error: authErr || { message: "Not logged in." } };

        const uid = authData.user.id;
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

          // Optional URL (only useful if bucket ever becomes public, or for debugging)
          const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(objectPath);
          if (data?.publicUrl) urls.push(data.publicUrl);
        }

        return { ok: true, paths, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.uploadImages error", e);
        return { ok: false, error: { message: "Image upload failed." } };
      }
    }

    // Authenticated signed URL for seller dashboard thumbnails
    async function createSignedThumbUrl(path, expiresIn, transform) {
      try {
        const p = String(path || "").trim();
        if (!p) return { ok: false, error: { message: "Missing path." } };

        const { data, error } = await supabaseClient.storage
          .from(BUCKET)
          .createSignedUrl(p, Number(expiresIn || 600));

        if (error) return { ok: false, error };
        const signedUrl = data?.signedUrl;
        if (!signedUrl) return { ok: false, error: { message: "No signed URL returned." } };

        // Convert signed object URL → signed render URL (thumbnail)
        const u = new URL(signedUrl);
        const token = u.searchParams.get("token");
        if (!token) return { ok: true, url: signedUrl };

        const marker = "/storage/v1/object/sign/";
        const idx = u.pathname.indexOf(marker);
        if (idx === -1) return { ok: true, url: signedUrl };

        const after = u.pathname.slice(idx + marker.length); // bucket/path
        const renderPath = "/storage/v1/render/image/sign/" + after;

        const r = new URL(u.origin + renderPath);
        r.searchParams.set("token", token);

        if (transform?.width) r.searchParams.set("width", String(transform.width));
        if (transform?.height) r.searchParams.set("height", String(transform.height));
        if (transform?.resize) r.searchParams.set("resize", transform.resize);
        if (transform?.quality) r.searchParams.set("quality", String(transform.quality));

        return { ok: true, url: r.toString() };
      } catch (e) {
        logger?.error?.("[ShopUp] createSignedThumbUrl error", e);
        return { ok: false, error: { message: "Failed to create signed URL." } };
      }
    }

    return { uploadImages, createSignedThumbUrl };
  }

  window.ShopUpStorageService = { create };
})();
