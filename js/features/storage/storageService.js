// /js/features/storage/storageService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, bucketName }) {
    const BUCKET = bucketName || "product-images";
    const DEFAULT_EXPIRES = 60 * 15; // 15 minutes (signed)

    function safeName(name) {
      return String(name || "image")
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "_");
    }

    function randomId() {
      return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }

    function getBaseUrl() {
      // supabase-js v2 exposes this internally; if not, fallback to typical URL
      // We'll infer from the signed URL later if needed.
      return null;
    }

    function buildSignedRenderUrlFromSignedObjectUrl(signedUrl, transform) {
      // signedUrl looks like:
      // https://<proj>.supabase.co/storage/v1/object/sign/<bucket>/<path>?token=...
      // We want:
      // https://<proj>.supabase.co/storage/v1/render/image/sign/<bucket>/<path>?token=...&width=..&height=..&resize=cover&quality=..
      try {
        const u = new URL(signedUrl);
        const token = u.searchParams.get("token");
        if (!token) return signedUrl;

        // derive base + path
        const fullPath = u.pathname; // /storage/v1/object/sign/bucket/...
        const marker = "/storage/v1/object/sign/";
        const idx = fullPath.indexOf(marker);
        if (idx === -1) return signedUrl;

        const after = fullPath.slice(idx + marker.length); // bucket/<path...>
        const renderPath = "/storage/v1/render/image/sign/" + after;

        const r = new URL(u.origin + renderPath);
        r.searchParams.set("token", token);

        // apply transforms
        // resize: cover|contain|fill
        if (transform?.width) r.searchParams.set("width", String(transform.width));
        if (transform?.height) r.searchParams.set("height", String(transform.height));
        if (transform?.resize) r.searchParams.set("resize", String(transform.resize));
        if (transform?.quality) r.searchParams.set("quality", String(transform.quality));

        return r.toString();
      } catch {
        return signedUrl;
      }
    }

    async function uploadImages({ ownerId, productId, files }) {
      try {
        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) return { ok: true, paths: [], urls: [] };

        if (!ownerId) {
          return { ok: false, error: { message: "Missing ownerId (auth.uid)." } };
        }

        const paths = [];
        const urls = []; // usually empty in PRIVATE mode; kept for compatibility

        for (const file of list) {
          const ext =
            (file.name && file.name.includes(".") && file.name.split(".").pop()) || "jpg";

          // STRICT path convention:
          // seller/<auth.uid()>/product/<productId|new>/<random>-filename.ext
          const objectPath = [
            "seller",
            ownerId,
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

          // If bucket is public, you can also store public URLs:
          // const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(objectPath);
          // if (data?.publicUrl) urls.push(data.publicUrl);
        }

        return { ok: true, paths, urls };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.uploadImages error", e);
        return { ok: false, error: { message: "Image upload failed." } };
      }
    }

    async function createSignedObjectUrl(path, expiresIn = DEFAULT_EXPIRES) {
      try {
        if (!path) return { ok: false, error: { message: "Missing path." } };

        const { data, error } = await supabaseClient.storage
          .from(BUCKET)
          .createSignedUrl(path, expiresIn);

        if (error) return { ok: false, error };
        return { ok: true, url: data?.signedUrl || null };
      } catch (e) {
        logger?.error?.("[ShopUp] storageService.createSignedObjectUrl error", e);
        return { ok: false, error: { message: "Failed to sign URL." } };
      }
    }

    async function createSignedThumbUrl(path, transform, expiresIn = DEFAULT_EXPIRES) {
      // We generate a signed object URL first, then convert it to render/image/sign URL
      const signed = await createSignedObjectUrl(path, expiresIn);
      if (!signed.ok) return signed;

      const renderUrl = buildSignedRenderUrlFromSignedObjectUrl(signed.url, transform);
      return { ok: true, url: renderUrl };
    }

    return {
      uploadImages,
      createSignedObjectUrl,
      createSignedThumbUrl,
    };
  }

  window.ShopUpStorageService = { create };
})();
