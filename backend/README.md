# Download Market — Backend

Production-ready Node.js + Express backend for the **Download Market** platform.
Users submit YouTube or Instagram URLs; the API queues a background job processed by a BullMQ worker using **yt-dlp**, then streams the file back to the client.

---

## Architecture Overview

```
Client  →  Express API  →  BullMQ Queue  →  Worker  →  yt-dlp
                ↕                                ↕
             Redis                            /temp
         (job state)                     (file storage)
```

| Component | Role |
|-----------|------|
| Express | Stateless REST API |
| BullMQ | Queue management & retries |
| ioredis | Redis client (job state, metadata cache) |
| yt-dlp | Media extraction & download |
| node-cron | Temp file cleanup every 5 minutes |

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18+ |
| Redis | 6+ |
| yt-dlp | latest |

### Install yt-dlp (Windows)

```powershell
# Using winget
winget install yt-dlp

# OR download the binary directly
# https://github.com/yt-dlp/yt-dlp/releases
# Place yt-dlp.exe somewhere on your PATH
```

### Install & run Redis (Windows)

```powershell
# Option 1 — Redis for Windows (Memurai or WSL)
# Option 2 — Docker (recommended)
docker run -d -p 6379:6379 redis:alpine
```

---

## Quick Start

```bash
# 1. Clone the repo and navigate to backend
cd download_market/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env as needed

# 4. Start API server (Terminal 1)
npm run dev

# 5. Start the worker (Terminal 2)
npm run dev:worker
```

> **Both the API server and the worker must be running for downloads to work.**

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | Node environment |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `REDIS_HOST` | `127.0.0.1` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis auth password |
| `REDIS_TLS` | `0` | Set `1` for TLS (Redis Cloud) |
| `QUEUE_NAME` | `downloadQueue` | BullMQ queue name |
| `WORKER_CONCURRENCY` | `3` | Parallel downloads per worker |
| `YTDLP_PATH` | `yt-dlp` | Path to yt-dlp binary |
| `TEMP_DIR` | `./temp` | Temp download directory |
| `FILE_TTL_SECONDS` | `900` | File lifetime in seconds (15 min) |
| `MAX_DURATION_SECONDS` | `3600` | Max allowed video duration |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `30` | Max requests per window |
| `BASE_URL` | `http://localhost:5000` | Public URL (used in download links) |

---

## API Reference

### Base URL: `/api`

---

#### `POST /api/download` — Submit Download Job

```json
// Request body
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "platform": "youtube",
  "type": "video",
  "formatId": "137"  // optional — specific yt-dlp format ID
}
```

```json
// 202 Accepted
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Your download has been queued...",
  "statusUrl": "http://localhost:5000/api/download/550e8400..."
}
```

**Platform values:** `youtube` | `instagram`  
**Type values:** `video` | `shorts` | `reel` | `post` | `audio`

---

#### `GET /api/download/:jobId` — Get Job Status

```json
// 200 OK — still processing
{
  "success": true,
  "jobId": "550e8400...",
  "status": "processing",
  "progress": 65,
  "platform": "youtube",
  "type": "video",
  "createdAt": 1712920000000,
  "expiresAt": 1712920900000
}
```

```json
// 200 OK — completed
{
  "success": true,
  "jobId": "550e8400...",
  "status": "completed",
  "progress": 100,
  "downloadUrl": "http://localhost:5000/api/download/file/550e8400.../filename.mp4"
}
```

**Status values:** `queued` → `processing` → `completed` | `failed`

---

#### `GET /api/download/file/:jobId/:filename` — Download File

Streams the file as a binary response with proper `Content-Disposition` header.  
The file is **deleted from disk** immediately after the stream completes.

---

#### `POST /api/preview` — Get Media Metadata

```json
// Request body
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

```json
// 200 OK
{
  "success": true,
  "platform": "youtube",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://i.ytimg.com/vi/...",
  "duration": 213,
  "uploader": "Rick Astley",
  "formats": [
    { "quality": "1080p", "formatId": "137" },
    { "quality": "720p",  "formatId": "136" },
    { "quality": "480p",  "formatId": "135" }
  ]
}
```

---

#### `GET /api/health` — Health Check

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-04-12T06:00:00.000Z",
  "services": {
    "api":   { "status": "up" },
    "redis": { "status": "up", "latencyMs": 1 }
  }
}
```

---

## Folder Structure

```
backend/
├── config/
│   ├── index.js          # Central config (reads .env)
│   └── redis.js          # ioredis singleton
├── controllers/
│   ├── downloadController.js
│   ├── previewController.js
│   └── healthController.js
├── middlewares/
│   ├── cors.js
│   ├── errorHandler.js
│   └── rateLimiter.js
├── queues/
│   └── downloadQueue.js  # BullMQ Queue singleton
├── routes/
│   ├── download.js
│   ├── preview.js
│   └── health.js
├── services/
│   ├── cleanupService.js # Cron-based file cleanup
│   ├── jobStore.js       # Redis CRUD for job records
│   └── previewService.js # Metadata fetch + Redis cache
├── utils/
│   ├── asyncHandler.js   # Promise error wrapper + AppError
│   ├── logger.js         # Winston logger
│   ├── validator.js      # URL/platform/type validation
│   └── ytdlp.js          # yt-dlp spawn wrapper
├── workers/
│   └── downloadWorker.js # BullMQ Worker (run separately)
├── temp/                 # Downloaded files (auto-deleted)
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js             # Entry point
```

---

## Redis Key Schema

| Key | TTL | Contents |
|-----|-----|----------|
| `job:{jobId}` | `FILE_TTL_SECONDS` | Job status, progress, filePath, downloadUrl |
| `meta:{base64(url)}` | 300s | Cached yt-dlp metadata (preview cache) |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| All `/api/*` | 30 req / 60 s |
| `POST /api/download` | 10 req / 60 s |
| `POST /api/preview` | 20 req / 60 s |

---

## Security

- **Helmet** — sets secure HTTP response headers
- **CORS whitelist** — only listed origins accepted
- **Domain whitelist** — only YouTube and Instagram URLs accepted
- **Input validation** — URL parsed and platform cross-checked
- **Path traversal protection** — file serving uses `path.basename()`
- **Body size limit** — JSON body capped at 10 KB

---

## Scaling

- Run multiple worker processes on separate machines — they all read from the same Redis queue
- Add more worker concurrency via `WORKER_CONCURRENCY`
- Redis supports distributed queues natively via BullMQ
- Replace `/temp` with S3-compatible storage for multi-node deployments
