document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const data = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        status.className = "form-success";
        status.textContent = "✅ Thanks! Your message has been sent.";
        form.reset();
      } else {
        status.className = "form-error";
        status.textContent = "⚠️ Oops! Something went wrong. Please try again.";
      }
    } catch (error) {
      status.className = "form-error";
      status.textContent = "⚠️ Network error. Please try again.";
    }
  });
});
