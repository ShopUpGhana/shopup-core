// /js/bootstrap/app.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] Container not found.");
    return;
  }

  /* -----------------------------
     Supabase client
  ----------------------------- */
  c.register("supabaseClient", () => {
    if (!window.ShopUpSupabase) {
      throw new Error("ShopUpSupabase config missing.");
    }
    const { url, anonKey } = window.ShopUpSupabase;
    return window.supabase.createClient(url, anonKey);
  });

  /* -----------------------------
     Logger
  ----------------------------- */
  c.register("logger", () => ({
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args),
    log: (...args) => console.log(...args),
  }));

  /* -----------------------------
     Auth Service
  ----------------------------- */
  c.register("authService", (cc) =>
    window.ShopUpAuthService.create({
      supabaseClient: cc.resolve("supabaseClient"),
      logger: cc.resolve("logger"),
    })
  );

  /* -----------------------------
     Product Service
  ----------------------------- */
  c.register("productService", (cc) =>
    window.ShopUpProductService.create({
      supabaseClient: cc.resolve("supabaseClient"),
      authService: cc.resolve("authService"),
      logger: cc.resolve("logger"),
    })
  );

  /* -----------------------------
     Storage Service (STRICT upload path uses auth.uid() folder)
  ----------------------------- */
  c.register("storageService", (cc) =>
    window.ShopUpStorageService.create({
      supabaseClient: cc.resolve("supabaseClient"),
      logger: cc.resolve("logger"),
      bucketName: "product-images",
    })
  );

  /* -----------------------------
     Signed URL Service (Edge Function)
  ----------------------------- */
  c.register("signedUrlService", (cc) =>
    window.ShopUpSignedUrlService.create({
      supabaseClient: cc.resolve("supabaseClient"),
      logger: cc.resolve("logger"),
      functionName: "sign-product-images",
    })
  );
})();
