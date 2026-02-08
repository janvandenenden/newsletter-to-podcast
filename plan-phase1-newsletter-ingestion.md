# Phase 1: Newsletter Email Ingestion — Implementation Plan

## Goal
Allow users to **forward newsletters to an email address**, accumulate them in an inbox, and **select one or more newsletters** as source material when generating a podcast episode — instead of only pasting text manually.

---

## Summary of Changes

| Area | What changes |
|------|-------------|
| **Ingestion** | New inbound email webhook receives forwarded newsletters |
| **Storage** | New `data/newsletters/{uuid}/` directory alongside existing episodes |
| **Pipeline** | Summarizer accepts multiple newsletter texts; episode linked to source newsletter IDs |
| **API** | New newsletter CRUD routes + inbound webhook; episode POST accepts `newsletterIds[]` |
| **UI** | New newsletter inbox page; episode creation page gets a newsletter selector |

---

## 1. Inbound Email Setup

### Provider: Resend (recommended) or Mailgun

The app needs an inbound email address (e.g., `inbox@podcasts.yourdomain.com`). When a user forwards a newsletter to this address, the provider POSTs parsed email data to our webhook.

**Resend approach:**
- Configure a domain in Resend dashboard
- Set up an inbound webhook URL pointing to our app
- Resend POSTs JSON with `from`, `to`, `subject`, `html`, `text`, `headers`, `attachments`

**Mailgun approach (alternative):**
- Configure a receiving route in Mailgun
- Mailgun POSTs multipart form data with similar fields

**For local development:**
- Use a tunnel (ngrok/cloudflare tunnel) to expose `localhost:3000/api/inbound` to the email provider
- Alternatively, add a manual "Import Newsletter" form (paste HTML or upload .eml) as a dev/fallback path

### Webhook Security
- Verify webhook signatures (Resend signs with HMAC, Mailgun with token+timestamp+signature)
- Store the webhook signing secret in `.env.local`

### Environment Variables (new)
```
INBOUND_EMAIL_PROVIDER=resend          # "resend" | "mailgun"
INBOUND_WEBHOOK_SECRET=whsec_...       # Webhook signature verification
RESEND_API_KEY=re_...                  # Only if using Resend (for sending confirmation emails, optional)
```

---

## 2. Email Parsing

### HTML → Text Extraction
Newsletters are HTML-heavy. We need to extract clean, readable text.

**Library: `html-to-text`** (lightweight, configurable)
- Strip images, styles, scripts
- Preserve headings, lists, links (as `[text](url)`)
- Remove common newsletter boilerplate: unsubscribe footers, tracking pixels, "view in browser" links

### Parsing Pipeline
```
Raw email (from webhook)
  → Extract HTML body (fall back to plain text)
  → Strip forwarding headers ("---------- Forwarded message ----------")
  → html-to-text conversion with newsletter-optimized config
  → Trim boilerplate (unsubscribe blocks, footer signatures)
  → Store as clean text
```

### New file: `src/lib/emailParser.ts`
- `parseInboundEmail(webhookPayload)` → `{ sender, subject, date, htmlBody, textBody }`
- `extractNewsletterContent(html: string)` → cleaned plain text
- `stripForwardingHeaders(text: string)` → text without "Fwd:" artifacts
- `stripBoilerplate(text: string)` → text without unsubscribe/footer junk

---

## 3. Storage Design

### Directory Structure (extends existing)
```
data/
  newsletters/{uuid}/
    meta.json              # Metadata: sender, subject, receivedAt, preview
    content.txt            # Cleaned plain text (what gets fed to the pipeline)
    raw.html               # Original HTML body (kept for potential re-parsing)
  episodes/{uuid}/         # Existing — unchanged structure
    meta.json              # Now also includes: sourceNewsletterIds[]
    script.json
    segments/
    episode.mp3
```

### Newsletter Metadata (`meta.json`)
```typescript
interface NewsletterMeta {
  id: string;
  sender: string;           // "newsletter@example.com" or "Jane Doe <jane@...>"
  subject: string;          // Email subject line
  receivedAt: string;       // ISO timestamp
  contentPreview: string;   // First 200 chars of cleaned text
  contentLength: number;    // Character count of cleaned text
  used: boolean;            // Whether this has been used in an episode
  episodeIds: string[];     // Which episodes used this newsletter
}
```

### Why JSON/Filesystem Works Here
- Read pattern is simple: list directories, read meta.json files (identical to existing episode storage)
- No complex queries needed — at MVP scale (tens/hundreds of newsletters) directory listing + JSON reads are fast
- Consistent with the existing episode storage pattern
- If it becomes slow later, migrate to SQLite without changing the API layer

### New file: `src/lib/newsletterStorage.ts`
Mirrors `storage.ts` pattern:
- `createNewsletterDir(id)`, `writeNewsletterMeta(id, meta)`, `readNewsletterMeta(id)`
- `writeNewsletterContent(id, text)`, `readNewsletterContent(id)`
- `writeNewsletterRawHtml(id, html)`
- `listNewsletters()` — returns all newsletter metas, sorted by receivedAt desc
- `getNewslettersByIds(ids: string[])` — batch read for episode creation
- `markNewsletterUsed(id, episodeId)` — update `used` flag and `episodeIds`

---

## 4. Updated Episode Types

### Changes to `EpisodeMeta`
```typescript
interface EpisodeMeta {
  id: string;
  title: string;
  createdAt: string;
  status: EpisodeStatus;
  duration?: number;
  segmentCount?: number;
  totalSegments?: number;
  currentSegment?: number;
  error?: string;

  // --- NEW fields ---
  sourceType: "paste" | "newsletters";    // How the source content was provided
  sourceNewsletterIds?: string[];          // IDs of newsletters used (if sourceType === "newsletters")
  sourceTextPreview: string;              // First 200 chars (existing field, now applies to both)
}
```

---

## 5. Pipeline Changes

### Multi-Newsletter Summarization
The summarizer currently takes a single `text` string. For multi-newsletter episodes:

**Option A (recommended for MVP):** Concatenate newsletter texts with clear delimiters, feed as one text block.
```
--- Newsletter 1: "Subject Line Here" ---
[content]

--- Newsletter 2: "Another Subject" ---
[content]

--- Newsletter 3: "Third One" ---
[content]
```

The existing summarizer prompt already extracts key points — it will naturally pull from across all newsletters. Update the system prompt to note that multiple sources may be present and that the summary should cover the most interesting points across all of them.

**Changes to `pipeline.ts`:**
```typescript
export async function runPipeline(
  episodeId: string,
  text: string,                          // Single text (paste mode)
  newsletterIds?: string[]               // Or newsletter IDs (newsletter mode)
): Promise<void> {
  let sourceText = text;

  if (newsletterIds?.length) {
    // Read and concatenate newsletter contents
    sourceText = await assembleNewsletterText(newsletterIds);
  }

  // Rest of pipeline unchanged — summarize(sourceText) → script → TTS → concat
}
```

**New helper: `assembleNewsletterText(ids: string[])`**
- Reads each newsletter's `content.txt`
- Formats with delimiters including subject line
- Returns combined string

### Prompt Updates
- `summarize.ts` system prompt: add note that input may contain multiple newsletters separated by delimiters; extract best points across all sources; attribute points to specific newsletters when relevant
- `scriptGen.ts` system prompt: hosts should reference "this week's newsletters" (plural) when appropriate, mention specific newsletter names/sources

---

## 6. API Routes

### New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/inbound` | POST | Webhook endpoint for email provider; parses email, stores newsletter |
| `/api/newsletters` | GET | List all newsletters (meta only) |
| `/api/newsletters/[id]` | GET | Get single newsletter (meta + content) |
| `/api/newsletters/[id]` | DELETE | Delete a newsletter |
| `/api/newsletters/import` | POST | Manual import: accept `{ html }` or `{ text }` body for dev/fallback |

### Modified Routes

| Route | Method | Change |
|-------|--------|--------|
| `/api/episodes` | POST | Accept `{ newsletterIds: string[] }` OR `{ text: string }` (backward compatible) |

### Webhook Endpoint Detail (`POST /api/inbound`)
```
1. Verify webhook signature (reject if invalid)
2. Extract email fields: sender, subject, html, text
3. Parse & clean content via emailParser
4. Generate UUID
5. Store to data/newsletters/{uuid}/
6. Return 200 OK to webhook provider
```

### Episode POST Update
```typescript
// Current: { text: string }
// New:     { text?: string, newsletterIds?: string[] }
// Validation: exactly one of text or newsletterIds must be provided
// If newsletterIds: verify all IDs exist, read content, pass to pipeline
```

---

## 7. Frontend Changes

### New Page: Newsletter Inbox (`/newsletters`)
- Lists all received newsletters as cards
- Each card shows: sender, subject, date, preview, "used" badge
- Bulk select with checkboxes → "Create Episode from Selected" button
- Delete button per newsletter
- Empty state: instructions on how to forward newsletters to the inbound address

### Updated: Episode Creation (`/` or `/new`)
Two input modes (tabs or toggle):

**Tab 1: "Select Newsletters"** (new, default)
- Shows list of available newsletters with checkboxes (unused ones highlighted)
- Selected count indicator
- "Generate Episode" button (disabled if none selected)

**Tab 2: "Paste Text"** (existing flow, preserved)
- Current textarea form, unchanged

### Updated Navigation
```
Nav: "New Episode" | "Newsletters" | "All Episodes"
```

### New Components
- `NewsletterCard.tsx` — card for inbox listing (sender, subject, date, preview, checkbox)
- `NewsletterSelector.tsx` — multi-select newsletter picker for episode creation
- `NewsletterInbox.tsx` — client component with list + bulk actions
- `ImportNewsletterForm.tsx` — manual import form (paste HTML/text, for dev & fallback)

---

## 8. File Structure (new & modified files)

```
src/
├── app/
│   ├── page.tsx                          # MODIFIED: tabs for newsletter select vs paste
│   ├── newsletters/
│   │   └── page.tsx                      # NEW: newsletter inbox page
│   └── api/
│       ├── inbound/
│       │   └── route.ts                  # NEW: email webhook endpoint
│       ├── newsletters/
│       │   ├── route.ts                  # NEW: GET list
│       │   ├── [id]/route.ts            # NEW: GET detail, DELETE
│       │   └── import/route.ts          # NEW: POST manual import
│       └── episodes/
│           └── route.ts                  # MODIFIED: accept newsletterIds
├── lib/
│   ├── emailParser.ts                    # NEW: email HTML → clean text
│   ├── newsletterStorage.ts              # NEW: newsletter filesystem CRUD
│   ├── pipeline.ts                       # MODIFIED: accept newsletterIds, assemble text
│   ├── summarize.ts                      # MODIFIED: updated prompt for multi-source
│   ├── scriptGen.ts                      # MODIFIED: updated prompt for multi-source
│   ├── storage.ts                        # MINOR: add sourceNewsletterIds to meta helpers
│   └── constants.ts                      # MODIFIED: add NEWSLETTERS_DIR
├── types/
│   ├── episode.ts                        # MODIFIED: add sourceType, sourceNewsletterIds
│   └── newsletter.ts                     # NEW: NewsletterMeta interface
└── components/
    ├── NewsletterCard.tsx                 # NEW
    ├── NewsletterSelector.tsx             # NEW
    ├── NewsletterInbox.tsx                # NEW
    ├── ImportNewsletterForm.tsx           # NEW
    └── EpisodeForm.tsx                    # MODIFIED: add tab for newsletter selection
```

---

## 9. New Dependencies

```bash
npm install html-to-text
npm install -D @types/html-to-text
```

No other new dependencies needed — webhook signature verification can use Node's built-in `crypto` module.

---

## 10. Implementation Order

1. **Types & constants** — `newsletter.ts` types, update `episode.ts`, add `NEWSLETTERS_DIR` to constants
2. **Newsletter storage** — `newsletterStorage.ts` (filesystem CRUD, mirrors existing pattern)
3. **Email parser** — `emailParser.ts` (HTML → text extraction, boilerplate stripping)
4. **Inbound webhook** — `POST /api/inbound` route with signature verification
5. **Newsletter API routes** — GET list, GET detail, DELETE, POST import
6. **Pipeline updates** — multi-newsletter assembly, updated prompts in summarize + scriptGen
7. **Episode API update** — accept `newsletterIds[]` in POST
8. **Newsletter inbox UI** — `/newsletters` page with `NewsletterCard`, `NewsletterInbox`
9. **Episode creation UI** — update home page with tabs (newsletter selector + paste fallback)
10. **Manual import form** — `ImportNewsletterForm` for dev/testing without email setup

---

## 11. Verification Plan

1. **Webhook test**: Forward a real newsletter → verify it appears in `/newsletters` inbox with clean content
2. **Parser test**: Forward newsletters from Substack, Beehiiv, Mailchimp → verify HTML extraction handles each format
3. **Multi-select test**: Select 2-3 newsletters → generate episode → verify podcast covers topics from all sources
4. **Single newsletter test**: Select 1 newsletter → verify it works the same as the old paste flow
5. **Paste fallback test**: Use paste tab → verify existing flow still works unchanged
6. **Manual import test**: Use import form → verify newsletter stored correctly
7. **Used tracking test**: Generate episode from newsletters → verify "used" badge appears, `episodeIds` populated
8. **Edge cases**: Forward non-newsletter email, empty email, very large email → verify graceful handling

---

## 12. Open Questions / Future Considerations

- **Auto-episode generation**: Could later add option to auto-generate an episode when N newsletters accumulate (e.g., weekly digest mode)
- **Newsletter source tracking**: Could group newsletters by sender (e.g., "all Morning Brew editions") for easier selection
- **Email confirmation**: Could send a reply email when a newsletter is successfully received (requires outbound email via Resend/Mailgun)
- **Deduplication**: Detect if the same newsletter is forwarded twice (hash content body)
- **IMAP pull (future)**: Connect directly to Gmail/Outlook to pull newsletters instead of requiring forwarding
