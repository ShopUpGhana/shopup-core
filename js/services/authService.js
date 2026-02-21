app.bootstrap.js:16  Uncaught Error: ShopUpSupabase config missing.
    at Object.factory (app.bootstrap.js:16:13)
    at Object.resolve (container.js:15:27)
    at Object.factory (app.bootstrap.js:46:26)
    at Object.resolve (container.js:15:27)
    at c.register.singleton [as factory] (seller-products.bootstrap.js:15:28)
    at Object.resolve (container.js:15:27)
    at seller-products.bootstrap.js:23:5
    at seller-products.bootstrap.js:24:3
(anonymous) @ app.bootstrap.js:16
resolve @ container.js:15
(anonymous) @ app.bootstrap.js:46
resolve @ container.js:15
c.register.singleton @ seller-products.bootstrap.js:15
resolve @ container.js:15
(anonymous) @ seller-products.bootstrap.js:23
(anonymous) @ seller-products.bootstrap.js:24
typeof window.supabase?.createClient
'function'
window.ShopUpSupabaseWait().then(c => console.log("client ok", !!c?.auth?.getSession));
VM199:1 Uncaught TypeError: window.ShopUpSupabaseWait is not a function
    at <anonymous>:1:8
(anonymous) @ VM199:1
