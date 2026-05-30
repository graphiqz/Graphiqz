/*
  ============================================================
  GRAPHIQZ — Configuration
  Add your API keys here before deploying.
  DO NOT commit this file to public repositories.
  ============================================================
*/

window.GRAPHIQZ_CONFIG = {

  // ── Gemini API Key ──
  // Get yours at: https://aistudio.google.com/app/apikey
  // Leave empty to run in demo mode (built-in animations)
  geminiKey: '',

  // ── Resend API Key ──
  // Get yours at: https://resend.com/api-keys
  // Used for the Contact Us form email delivery
  resendKey: '',

};

/*
  ============================================================
  LEMON SQUEEZY vs STRIPE — RECOMMENDATION:

  For Graphiqz, I recommend Stripe because:
  - More widely supported in Pakistan/international markets
  - Lower transaction fees for SaaS subscriptions
  - Better developer documentation and SDKs
  - Supports metered billing (ideal for per-generation pricing)

  Use Lemon Squeezy if:
  - You want tax handling done automatically (VAT, GST)
  - You prefer a merchant of record model (they handle tax)
  - You don't want to manage Stripe's compliance overhead

  Both are excellent. For a global SaaS, Lemon Squeezy
  is slightly easier to launch internationally because it
  handles all sales tax automatically.
  ============================================================
*/
