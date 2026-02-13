// /js/bootstrap/seller-register.bootstrap.js
(function () {
  "use strict";
  const c = window.ShopUpContainer;

  // Core singletons
  c.register("logger", () => console, { singleton: true });
  c.register("clock", () => ({ nowISO: () => new Date().toISOString() }), { singleton: true });

  // Supabase adapter creation (assumes your supabase-config.js sets window.supabase)
  c.register("supabase", () => window.supabase, { singleton: true });

  // Repos/adapters
  c.register("sellerRepo", (cc) =>
    window.ShopUpSupabaseSellerRepo.create({
      supabase: cc.resolve("supabase"),
      logger: cc.resolve("logger"),
    }),
  { singleton: true });

  // Services
  c.register("sellerService", (cc) =>
    window.ShopUpSellerService.create({
      sellerRepo: cc.resolve("sellerRepo"),
      logger: cc.resolve("logger"),
      clock: cc.resolve("clock"),
    }),
  { singleton: true });

  // Controllers
  c.register("sellerRegisterController", (cc) =>
    window.ShopUpSellerRegisterController.create({
      sellerService: cc.resolve("sellerService"),
      logger: cc.resolve("logger"),
    }),
  { singleton: true });

  // Start
  c.resolve("sellerRegisterController").start();
})();
