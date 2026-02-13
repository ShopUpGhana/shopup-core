// /js/core/container.js
(function () {
  function createContainer() {
    const regs = new Map();
    const singletons = new Map();

    return {
      register(name, factory, opts) {
        regs.set(name, { factory, singleton: !!(opts && opts.singleton) });
      },
      resolve(name) {
        if (singletons.has(name)) return singletons.get(name);
        const reg = regs.get(name);
        if (!reg) throw new Error(`[DI] Missing dependency: ${name}`);
        const value = reg.factory(this);
        if (reg.singleton) singletons.set(name, value);
        return value;
      },
    };
  }

  window.ShopUpContainer = createContainer();
})();
