# drkaru-1

## KaruScan

KaruScan finds the AI tools and app subscriptions charging your bank card, shows which ones you don't use or don't recognise, and helps you cancel them.

Open `karuscan/index.html` in any web browser (double-click it). It has no install, no account and no server. Your statement is read inside the browser and never uploaded.

### How to use it

1. **Add a statement.** Export your transactions as CSV from internet banking, or open a PDF statement, copy all the text, and paste it in. Add 2 to 6 months so KaruScan can see repeating charges.
2. **Review each subscription.** For each one, choose when you last used it. KaruScan then labels it:
   - **Keep**: used in the last month
   - **Review**: used 1 to 3 months ago, or not answered yet
   - **Cancel this**: not used for over 3 months, or never
   - **Dispute with bank**: you don't recognise the charge
3. **Cancel.** Open "How to cancel" on a row to get the company's billing-page link, step-by-step instructions, a ready-made cancellation email, and a bank dispute letter. Then mark the row cancelled.
4. **Check next month.** Add the next statement. If a cancelled service charges you again, KaruScan flags it in red.

### What it recognises

It knows how about 60 services appear on bank statements, including ChatGPT, Claude, Gemini/Google One, Copilot, Perplexity, Midjourney, Grammarly, Canva, Otter, ElevenLabs, Cursor, scite, Consensus, Elicit, SciSpace, Paperpal, Zotero, Notion, Zoom and Netflix. It also handles charges billed through Apple, Google Play, Paddle and FastSpring, where the real app name is hidden. Any other charge that repeats on a weekly, monthly, quarterly or yearly pattern shows up as "Unidentified".

It also adds up the international transaction fees your bank charges on overseas payments.

### Limits

KaruScan can't sign in to your bank or your app accounts, so it can't press the cancel button for you. Neither PNG banks nor the AI companies offer a way for an outside app to cancel subscriptions. KaruScan does everything up to that last click.
