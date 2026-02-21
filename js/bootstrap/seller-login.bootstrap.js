// /js/bootstrap/seller-login.bootstrap.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] Container not found. Check script order.");
    return;
  }

  if (c.__seller_login_bootstrapped) return;
  c.__seller_login_bootstrapped = true;

  // ✅ Ensure supabase-config.js is loaded
  if (typeof window.ShopUpSupabaseWait !== "function") {
    console.error("[ShopUp] ShopUpSupabaseWait() missing. Did you load /js/supabase-config.js?");
    return;
  }

  // ✅ register supabaseWait as a FUNCTION that returns a Promise
  c.register("supabaseWait", () => window.ShopUpSupabaseWait);

  // ✅ build supabase client (returns the real client)
  c.register("supabaseClient", async () => {
    // IMPORTANT: call the function to get the Promise
    const waitFn = c.resolve("supabaseWait");
    const client = await waitFn(); // <- THIS is the fix
    return client;
  });

  // ✅ adapters
  c.register("authAdapter", (cc) =>
    window.ShopUpSupabaseAuthAdapter.create({
      supabaseClientPromise: cc.resolve("supabaseClient"),
    })
  );

  // ✅ auth service (feature)
  c.register("authAdapter", (cc) =>
  window.ShopUpSupabaseAuthAdapter.create({
    supabaseClientPromise: cc.resolve("supabaseClient"),
    logger: console,
  })
);

  // ✅ controller init (if controller exposes init)
  if (
    window.ShopUpSellerLoginController &&
    typeof window.ShopUpSellerLoginController.init === "function"
  ) {
    window.ShopUpSellerLoginController.init({ container: c });
  }
})();
