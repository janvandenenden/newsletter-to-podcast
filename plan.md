# Phase 0: Newsletter-to-Podcast — Implementation Plan

## Goal
Build the manual end-to-end pipeline: **paste newsletter text → summarize → two-host dialogue script → TTS audio → play in browser**.

---

## Stack & Key Decisions
- **Framework**: Next.js (App Router, TypeScript, Tailwind)
- **LLM**: OpenAI GPT-4o (structured outputs via Zod)
- **TTS**: ElevenLabs (`textToSpeech.convert()`, two premade voices)
- **Audio concat**: `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` (no system ffmpeg needed)
- **Storage**: Filesystem + JSON metadata under `/data/episodes/{uuid}/`
- **Auth**: None (single-user local app)

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Nav: "New Episode" | "All Episodes"
│   ├── page.tsx                      # Home — paste form
│   ├── globals.css
│   ├── episodes/
│   │   ├── page.tsx                  # Episode listing
│   │   └── [id]/page.tsx            # Episode detail + player
│   └── api/episodes/
│       ├── route.ts                  # POST (create) + GET (list)
│       └── [id]/
│           ├── route.ts             # GET (status/metadata)
│           └── audio/route.ts       # GET (serve MP3)
├── lib/
│   ├── pipeline.ts                   # Orchestrator: chains summarize → script → TTS → concat
│   ├── summarize.ts                  # OpenAI: newsletter text → structured summary
│   ├── scriptGen.ts                  # OpenAI: summary → two-host dialogue script
│   ├── tts.ts                        # ElevenLabs: script segments → MP3 files
│   ├── audioConcat.ts                # ffmpeg: segment MP3s → single episode.mp3
│   ├── storage.ts                    # Filesystem helpers (createDir, readMeta, writeMeta, etc.)
│   ├── retry.ts                      # Exponential backoff wrapper
│   └── constants.ts                  # Voice IDs, model IDs, data dir path
├── types/
│   └── episode.ts                    # TypeScript interfaces + Zod schemas
└── components/
    ├── EpisodeForm.tsx               # Textarea + submit (client component)
    ├── EpisodeStatus.tsx             # Polling progress display (client component)
    ├── AudioPlayer.tsx               # HTML5 <audio> player (client component)
    ├── ScriptViewer.tsx              # Dialogue display (speaker-labeled lines)
    ├── TopicList.tsx                  # Key topics from summary
    ├── EpisodeCard.tsx               # Card for listing page
    └── StatusBadge.tsx               # processing/complete/error badge
data/                                 # Runtime data (gitignored)
  episodes/{uuid}/
    meta.json                         # Status, title, duration, timestamps
    script.json                       # Generated dialogue
    segments/000-hostA.mp3, ...       # Individual TTS segments
    episode.mp3                       # Final concatenated audio
```

---

## Processing Pipeline

### Step 1 — Summarize (`summarize.ts`)
- Input: raw newsletter text
- OpenAI `gpt-4o` with Zod structured output
- Output: `{ title, overallTheme, keyPoints: [{ topic, summary, significance }] }` (3–6 key points)
- System prompt enforces faithful extraction, no hallucination, specific facts preserved

### Step 2 — Generate Script (`scriptGen.ts`)
- Input: structured summary from Step 1
- OpenAI `gpt-4o` with Zod structured output
- Output: `{ segments: [{ speaker: "hostA"|"hostB", text, topic? }] }` (15–30 segments)
- Host A ("Alex"): introduces topics, provides context, authoritative
- Host B ("Sam"): reacts, asks questions, adds perspective, more casual
- Structure: cold open → per-topic discussion → wrap-up → sign-off
- Attribution enforced: hosts say "according to the newsletter" etc.

### Step 3 — Generate Audio (`tts.ts`)
- Process segments **sequentially** (rate limit safety + voice continuity)
- ElevenLabs `textToSpeech.convert()` with `eleven_multilingual_v2` model
- Two separate `previous_request_ids` chains (one per speaker) for prosody continuity
- Output format: `mp3_44100_128`
- Host A: stability 0.5, style 0.2 (steady)
- Host B: stability 0.4, style 0.4 (more expressive)
- 500ms delay between requests to avoid rate limits

### Step 4 — Concatenate (`audioConcat.ts`)
- ffmpeg concat demuxer with `-c copy` (no re-encoding, near-instant)
- Read final duration via ffprobe, store in `meta.json`

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/episodes` | POST | Validate text, create episode dir, fire-and-forget pipeline, return `{ id, status }` (202) |
| `/api/episodes` | GET | List all episodes (read meta.json from each dir) |
| `/api/episodes/[id]` | GET | Return meta.json + script.json for one episode |
| `/api/episodes/[id]/audio` | GET | Stream episode.mp3 with proper Content-Type/Content-Length headers |

The POST handler starts the pipeline async (no `await`) — works fine in `next dev` for Phase 0.

---

## Frontend Pages

### Home (`/`) — Paste Form
- Large textarea with character count
- "Generate Episode" button → POST → redirect to `/episodes/{id}`

### Episode Detail (`/episodes/[id]`) — Status + Player
- Polls GET `/api/episodes/[id]` every 2s while not complete/error
- Shows progress bar with status text (summarizing → scripting → generating audio → complete)
- On complete: audio player + script viewer (speaker-labeled, visually differentiated) + topic list
- On error: error message + "Try Again" button

### Episode List (`/episodes`) — All Episodes
- Cards with title, date, duration, status badge
- Links to detail pages

---

## Implementation Order

1. **Project scaffolding** — `create-next-app`, install deps, `.env.local`, `.gitignore` update
2. **Types & constants** — `src/types/episode.ts`, `src/lib/constants.ts`
3. **Storage layer** — `src/lib/storage.ts` (filesystem CRUD helpers)
4. **Summarization** — `src/lib/summarize.ts` + `src/lib/retry.ts`
5. **Script generation** — `src/lib/scriptGen.ts`
6. **TTS + audio concat** — `src/lib/tts.ts`, `src/lib/audioConcat.ts`
7. **Pipeline orchestrator** — `src/lib/pipeline.ts`
8. **API routes** — all four endpoints
9. **Frontend** — form, episode page with polling/player, listing page, layout/nav

---

## Dependencies

```
npm install openai zod @elevenlabs/elevenlabs-js uuid fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install -D @types/uuid @types/fluent-ffmpeg
```

---

## Environment Variables (`.env.local`)

```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_HOST_A=<voice_id>    # Pick via ElevenLabs API or dashboard
ELEVENLABS_VOICE_HOST_B=<voice_id>    # Pick a contrasting voice
```

Note: Voice IDs must be retrieved from ElevenLabs (GET `/v2/voices?voice_type=default`). We'll add a setup helper or document how to pick voices.

---

## Verification Plan

1. **Unit check**: Paste sample newsletter text on home page → verify episode created, status progresses through all stages
2. **Audio check**: Listen to generated episode.mp3 — verify two distinct voices, natural pacing, correct content
3. **Script check**: Review script.json — verify faithful summarization, proper attribution, natural dialogue flow
4. **Player check**: Verify HTML5 audio player loads, plays, and allows seeking
5. **Error check**: Test with empty input, very long input — verify graceful error handling
6. **List check**: Create 2+ episodes, verify listing page shows all with correct metadata
