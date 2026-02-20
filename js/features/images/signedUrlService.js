// /js/features/images/signedUrlService.js
(function () {
  "use strict";

  function create({ supabaseClient, logger, functionName }) {
    const FN = functionName || "sign-product-images";

    async function signPaths({ paths, expiresIn, transform }) {
      try {
        const arr = Array.isArray(paths) ? paths.filter(Boolean) : [];
        if (!arr.length) return { ok: true, map: {} };

        // IMPORTANT: function deployed with --no-verify-jwt
        const { data, error } = await supabaseClient.functions.invoke(FN, {
          body: {
            paths: arr,
            expiresIn: Number(expiresIn || 600),
            transform: transform || { width: 420, height: 420, resize: "cover", quality: 80 },
          },
        });

        if (error) return { ok: false, error };
        if (!data?.ok) return { ok: false, error: { message: data?.error || "Sign failed" } };

        return { ok: true, map: data.map || {} };
      } catch (e) {
        logger?.error?.("[ShopUp] signedUrlService.signPaths error", e);
        return { ok: false, error: { message: "Could not sign image URLs." } };
      }
    }

    return { signPaths };
  }

  window.ShopUpSignedUrlService = { create };
})();
