// /js/controllers/seller-register.controller.js
(function () {
  function create({ sellerService, logger }) {
    function start() {
      const form = document.querySelector("#sellerRegisterForm");
      const submitBtn = document.querySelector("#submitBtn");
      const msg = document.querySelector("#msg");

      if (!form) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        msg.textContent = "Submitting...";

        try {
          const sellerId = form.dataset.sellerId; // set after signup or session
          const res = await sellerService.submitForReview({ sellerId });

          if (!res.ok) {
            msg.textContent = res.error.message; // friendly message
            submitBtn.disabled = false;
            return;
          }

          msg.textContent = "✅ Submitted! You’ll be approved soon.";
          // optionally redirect
        } catch (err) {
          logger.error(err);
          msg.textContent = "Something went wrong. Please try again.";
          submitBtn.disabled = false;
        }
      });
    }

    return { start };
  }

  window.ShopUpSellerRegisterController = { create };
})();
