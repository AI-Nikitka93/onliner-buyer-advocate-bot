# Contributing Guidelines

Thank you for your interest in contributing to the Onliner Buyer Advocate Bot project! We welcome all contributions, including bug fixes, feature requests, documentation improvements, and issues.

Please read through these guidelines before submitting a pull request (PR).

---

## 🛠️ Local Development Setup

To set up a local development environment:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-org/onliner-buyer-advocate-bot.git
   cd onliner-buyer-advocate-bot
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory by copying the example:
   ```bash
   cp .env.example .env
   ```
   Fill in your custom local variables (e.g. `ADMIN_API_TOKEN`, `TELEGRAM_BOT_TOKEN`).

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   This will start both the Vite asset compilation and the local Express server on `http://localhost:3000`.

---

## 🧪 Testing and Quality Control

Before proposing changes, ensure that the codebase passes the full verification suite.

*   **TypeScript Verification & Linters:**
    ```bash
    npm run lint
    ```
*   **Worker WebApp Mock Endpoint Tests:**
    ```bash
    npm run worker:test:webapp
    ```
*   **Production verification & Smoke Tests:**
    ```bash
    npm run verify:prod
    ```
    This compiles the production assets, bundles the server, and runs local mock smoke checks.
*   **Onliner API Contract Validation:**
    ```bash
    npm run contract:onliner:soft
    ```
    *(Queries live Onliner.by endpoints to check for structural API response compatibility, but fails gracefully on transient network errors).*

---

## 📝 Commit Messages & Git workflow

### Decision Shadow Commit Protocol (Lore 2026)

When making commits, you must explain **why** changes were made using Git Trailers. The commit message must follow this structure:

```text
<type>(<scope>): <what changed> — <why it changed>

Constraint: <any platform, framework, or architectural constraints>
Rejected: <rejected alternative | reason for rejection>
Directive: <instructions for future AI agents or human developers>
Not-tested: <untested code paths or deployment boundaries>
```

Example commit:
```text
feat(worker): bypass price check for 50%+ discounts — to catch cheap items with high-value price cuts.

Constraint: wrangler.toml is configured for Cloudflare Worker environment.
Rejected: Bypassing only for specific categories | It would be too complex to maintain catalog category configurations.
Directive: Keep the bypass limit configurable or set to 50% for standard runs.
Not-tested: Webhook delivery under high concurrent loads.
```

---

## 🚀 Creating a Pull Request

1. Create a new topic branch from the latest `master`.
2. Keep your PRs focused and single-purpose.
3. Verify that `npm run verify:prod` passes.
4. Open the PR and describe the changes clearly. A pull request template is available to guide you.
