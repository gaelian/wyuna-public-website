# Wyuna Community Inc website

This repository contains the public website for Wyuna Community Inc.

The current site is a small static website with a lightweight Azure Functions API for the contact form.

## Structure

- `site/` contains the static website.
- `api/` contains the contact form API.
- `infra/` contains Azure infrastructure templates.
- `.github/workflows/` contains the deployment workflow.

## Development

The static site can be previewed locally from the repository root:

```bash
python3 -m http.server 4173 --directory site
```

Then open:

```text
http://localhost:4173
```

## Contact Form

The contact form posts to the Azure Functions API under `api/`. It includes basic bot resistance with a honeypot field, submit-time checks, rate limiting, and optional Cloudflare Turnstile validation.

Runtime secrets and deployment tokens are managed outside the repository.
