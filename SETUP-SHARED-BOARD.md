# Turning on the shared board

Six steps, about three minutes. You only do this once; nobody else has to do anything.

1. Go to **[sheets.new](https://sheets.new)** — a blank Google Sheet. Name it anything.
2. In that sheet: **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete whatever is in the editor, and paste in the whole of **`shared-board.gs`** from this
   repo. Click the save icon.
4. Top right: **Deploy → New deployment**. Click the gear next to "Select type" and choose
   **Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy**.
   - Google will ask you to authorise it. It will warn that the app "isn't verified" — that is
     expected for a script you just wrote yourself. Click **Advanced → Go to (your project)**,
     then **Allow**.
6. Copy the **Web app URL** it shows you. It ends in `/exec`.

Then open the lab, click **Shared board** at the bottom of the leaderboard, paste the URL, and
save. The page remembers it, and the link it gives you carries the setting — send *that* link to
everyone else and their board is shared automatically, with nothing to set up on their side.

## What "Anyone" means here

The web app is reachable by anyone with the URL, and so is the board. It holds names and chair
layouts — nothing clinical, nothing identifying a patient. If you would rather it were not open,
step 5 also offers "Anyone with a Google account", but then every physician needs to be signed
in to Google when they use it, which is usually more friction than it is worth for this.

## Changing it later

Editing the script does not change what is deployed. Use **Deploy → Manage deployments →**
(pencil icon) **→ Version: New version → Deploy** to push a change to the same URL.

To reset the board, delete the rows in the sheet. To read it, just look at the sheet — one row
per lane.
