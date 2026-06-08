const form = document.querySelector("#contact-form");
const statusEl = document.querySelector("#form-status");
const startedAt = document.querySelector("#startedAt");
const turnstileSlot = document.querySelector("#turnstile-slot");
const turnstileToken = document.querySelector("#turnstileToken");

if (startedAt) {
  startedAt.value = String(Date.now());
}

async function configureTurnstile() {
  if (!turnstileSlot || !turnstileToken) {
    return;
  }

  const response = await fetch("/api/contact-config");

  if (!response.ok) {
    return;
  }

  const config = await response.json();

  if (!config.turnstileSiteKey) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window.turnstile.render(turnstileSlot, {
      sitekey: config.turnstileSiteKey,
      callback: (token) => {
        turnstileToken.value = token;
      },
      "expired-callback": () => {
        turnstileToken.value = "";
      }
    });
  };
  document.head.append(script);
}

async function submitContact(event) {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  statusEl.textContent = "Sending...";
  submitButton.disabled = true;

  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Your message could not be sent.");
    }

    form.reset();
    startedAt.value = String(Date.now());
    statusEl.textContent = "Thanks. Your message has been sent.";
  } catch (error) {
    statusEl.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

if (form) {
  configureTurnstile().catch(() => {});
  form.addEventListener("submit", submitContact);
}
