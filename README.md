# KaruScan

KaruScan is a local browser tool for reviewing possible AI and app subscriptions in bank-statement exports. It offers cancellation instructions and drafts requests for a bank to investigate selected payments. Vendor matches and recurring spending are candidates, not proof of a subscription or fraud.

Open `karuscan/index.html` in a current browser, keeping the `icons` directory beside it. No account, build or server is required. The app contains no external fonts, analytics or statement-upload requests. Billing links open external websites only when selected.

## Use

1. Import one bank account and one currency per workspace. Select the currency label, date order and debit sign convention before importing. Explicit DR/CR indicators and separate debit columns override the sign convention. The currency label does not perform conversion.
2. Choose one CSV at a time, or paste PDF statement text whose transaction lines start with a date. Review the dates, descriptions and amounts in the preview before adding them. Only the first 100 parsed payments are displayed. Unsupported rows and credits may be skipped; compare against the original statement. Files are limited to 5 MB and the workspace to 50,000 payments.
3. Review possible subscriptions. Recognised vendors can include one-off purchases and usage-based spending. In Details, confirm the billing period or choose **Not a subscription**. Unknown billing periods contribute nothing to estimated totals.
4. Record when you last used a service, then verify it in the actual account before cancelling. The app cannot sign in or cancel for you. **Load example** requires confirmation before replacing real payments and decisions.
5. For an unrecognised charge or a possible payment after cancellation, check receipts and shared accounts first. Select only relevant transactions to draft a neutral bank investigation request. No letter is sent automatically.
6. Record cancellation and import the next statement. Payments more than two days after the recorded date are flagged for review; posting delays, billing terms or another subscription can explain them.

## Estimates and detection limits

- Cadence uses consistent intervals between observed payments. Two similarly priced ordinary purchases can still resemble a subscription. Conversely, changing statement descriptions or missed payments can hide real subscriptions.
- Known vendors retain their full statement descriptor. Resellers such as Paddle and Apple are separated by descriptor and amount. This conservative approach can split one subscription after a price or descriptor change. Identical descriptions and prices can still conceal different subscriptions; verify the entire group before recording a decision.
- Unknown merchants retain the full descriptor rather than a shortened merchant name. They appear when amounts and intervals are sufficiently consistent.
- Old payments are excluded from current estimates when overdue relative to the latest imported payment and inferred/confirmed period. History alone cannot establish whether a subscription is still active today.
- Annual savings are potential estimates, including user-marked cancellations; they are not verified savings or guaranteed refunds. Amount changes may reflect currency conversion or plan changes. Fee totals include all matching international fees in the imported history, not just subscription-related fees.
- Overlapping imports preserve the number of identical payments already observed. Two genuine identical payments in one export are retained. Distinct payments with identical dates, descriptions and amounts across separate exports cannot be distinguished without transaction IDs. Keep one account per workspace.
- Decimal-point amounts are supported in pasted text. CSV numeric parsing also supports decimal commas. Check the preview for unfamiliar statement layouts. PDF files themselves and Excel workbooks are not parsed.

## Privacy, backups and recovery

All imported payment rows and decisions are stored **unencrypted** in this browser's local storage. Anyone with access to the browser profile, or scripts running on the same website origin, may access them. Use a dedicated trusted origin if hosting the app. Browser storage may be unavailable, cleared or unreliable for directly opened local files. Save failures are shown in the app.

Copy backups before relying on saved decisions. Backups, CSV reports and copied letters contain financial information; keep them private. Restore validates the backup before replacing current data, and asks for confirmation when payments already exist. Old vendor-level decisions are migrated only when unambiguous; ambiguous/reseller decisions remain in the backup and require review.

**Erase all data** clears stored payments/decisions and sensitive text displayed in the page. Previously exported files, other devices and clipboard copies must be cleared separately. If storage deletion fails, clear site data through browser settings.

## Development checks

Requires Node.js 20 or later:

```sh
npm ci
npm test
```

Tests exercise the actual inline app code, including import previews, credits, large amounts, duplicate imports, cadence, reseller grouping, backup validation, storage failures, demo overwrite protection, selected bank-letter payments, clipboard fallback and erasure. GitHub Actions runs the suite on pushes and pull requests.

DOM tests do not verify rendered layout or real device behaviour. Before release, test iPhone Safari (320–430px widths, light/dark mode and larger text), file selection, dropdown focus, date controls, clipboard fallback and no horizontal overflow. Chromium/WebKit browser binaries could not be downloaded in the implementation environment, so this mobile release check remains outstanding.
