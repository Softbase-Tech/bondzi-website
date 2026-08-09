/**
 * Paystack Inline JS loader + typed wrapper.
 *
 * The Paystack script exposes a global `PaystackPop` after load; we
 * lazily inject a single <script> tag the first time a checkout is
 * initiated. Duplicate loads are prevented by a shared promise so
 * concurrent clicks don't race.
 *
 * Backend re-verifies EVERY transaction against Paystack with the
 * SECRET key server-side, so a tampered client `amount` fails
 * verification. Still — we always pass the exact amount recorded by
 * `POST /subscriptions/initiate` to keep the popup + backend in sync.
 */

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number; // minor units (kobo/pesewas)
  currency?: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback?: (response: { reference: string }) => void;
  onClose?: () => void;
  channels?: string[];
  label?: string;
}

interface PaystackTransaction {
  openIframe: () => void;
}

interface PaystackPopStatic {
  setup: (options: PaystackSetupOptions) => PaystackTransaction;
}

declare global {
  interface Window {
    PaystackPop?: PaystackPopStatic;
  }
}

const SCRIPT_URL = "https://js.paystack.co/v1/inline.js";
let loader: Promise<PaystackPopStatic> | null = null;

/**
 * Injects the Paystack Inline script (if not already present) and
 * resolves once `window.PaystackPop` is available.
 */
export function loadPaystack(): Promise<PaystackPopStatic> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack loader must run in the browser"));
  }
  if (window.PaystackPop) {
    return Promise.resolve(window.PaystackPop);
  }
  if (loader) return loader;

  loader = new Promise<PaystackPopStatic>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SCRIPT_URL}"]`,
    ) as HTMLScriptElement | null;
    const el = existing ?? document.createElement("script");
    if (!existing) {
      el.src = SCRIPT_URL;
      el.async = true;
      document.head.appendChild(el);
    }
    const onReady = () => {
      if (window.PaystackPop) resolve(window.PaystackPop);
      else reject(new Error("Paystack loaded but PaystackPop is missing"));
    };
    el.addEventListener("load", onReady, { once: true });
    el.addEventListener(
      "error",
      () => {
        loader = null;
        reject(new Error("Failed to load Paystack Inline JS"));
      },
      { once: true },
    );
    // If the script was already loaded (e.g. cached across navigations)
    // the `load` event has already fired; check the global directly.
    if (window.PaystackPop) resolve(window.PaystackPop);
  });
  return loader;
}

/**
 * High-level helper — opens the popup and resolves the promise when
 * the user completes or closes. Callers should call verify() from
 * `onSuccess` and route to /subscription/success on the resolved
 * subscription.
 */
export async function openPaystackCheckout(input: {
  publicKey: string;
  email: string;
  amountMinor: number;
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ status: "success" | "closed"; reference: string }> {
  const PaystackPop = await loadPaystack();
  return new Promise((resolve, reject) => {
    try {
      const tx = PaystackPop.setup({
        key: input.publicKey,
        email: input.email,
        amount: input.amountMinor,
        currency: input.currency ?? "GHS",
        ref: input.reference,
        metadata: input.metadata,
        callback: (response) => {
          resolve({ status: "success", reference: response.reference });
        },
        onClose: () => {
          resolve({ status: "closed", reference: input.reference });
        },
        channels: ["card", "mobile_money", "bank_transfer"],
      });
      tx.openIframe();
    } catch (err) {
      reject(err);
    }
  });
}
