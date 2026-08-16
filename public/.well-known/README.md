# /.well-known/

Publicly-served host-verification files. Next.js serves anything
under `public/` at the URL matching its relative path — this
directory is reachable at `https://bondzi.online/.well-known/`.

## assetlinks.json

Android's App Links verification file. When a user taps a
`https://bondzi.online/…` link on Android and the Bondzi app is
installed, Android fetches this file, checks the SHA-256 of the
installed APK's signing certificate against the list, and opens
the app directly (no browser chooser) when it matches.

Google's docs: https://developer.android.com/training/app-links/verify-android-applinks

### Filling in the SHA-256

`sha256_cert_fingerprints[0]` starts as
`PASTE_SHA256_FINGERPRINT_HERE`. Replace it with the real
fingerprint of the production keystore — the same keystore EAS
uses to sign every release AAB.

Pull the fingerprint from EAS (run from the `mobile/` repo):

```bash
eas credentials --platform android
# 1. Select build profile: production
# 2. Select "Keystore"
# 3. Select "View credentials"
# → copy the "SHA256 Fingerprint" value.
```

The format is `AA:BB:CC:…:99` — 32 hex pairs separated by
colons. Paste it into `assetlinks.json` as-is. Uppercase and
colons are required.

Verify after deploy:

```bash
curl -sf https://bondzi.online/.well-known/assetlinks.json | jq .
```

The response must be `Content-Type: application/json` (Next.js
handles that automatically for `.json` files under `public/`).

Once the AAB is on a device:

```bash
adb shell pm get-app-links --user cur com.bondzi.app
# → Domain: bondzi.online   Status: verified
```

Any status other than `verified` means the fingerprint doesn't
match; re-pull it from EAS and try again.
