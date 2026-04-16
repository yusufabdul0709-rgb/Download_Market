# ytdlp-download-fixes Bugfix Design

## Overview

Three independent bugs are causing download failures in the DownloadMarket app. This design document formalizes each bug condition, defines the expected correct behavior, hypothesizes root causes, and outlines the targeted fixes and testing strategy.

**Bug 1 — Metadata Timeout**: `fetchMetadataWithFallback` in `backend/utils/ytdlp.js` uses a 9-second timeout while `baseArgs()` injects `--sleep-interval 2`, `--max-sleep-interval 5`, and `--sleep-requests 2` flags that consume ~4 seconds before any network activity begins. The fix separates sleep flags into a dedicated `downloadArgs()` function and raises the metadata timeout to 30 seconds.

**Bug 2 — Instagram Format Failure**: `buildJobArgs` in `backend/controllers/downloadController.js` uses `-f bestvideo+bestaudio/best` for all platforms. Instagram does not provide separate DASH video and audio streams, so yt-dlp exits 0 with no output file. The fix adds platform-aware format selection using `-f best[ext=mp4]/best` for Instagram.

**Bug 3 — QuickDownloaderCard Legacy Endpoint**: `frontend/src/components/QuickDownloaderCard.jsx` sends `GET /api/download?url=...`, a legacy endpoint that no longer exists. The fix rewrites the component to POST to `/api/download`, poll `/api/download/:jobId`, and trigger a browser download on completion.

---

## Glossary

- **Bug_Condition (C)**: The condition that identifies inputs that trigger a specific bug
- **Property (P)**: The desired correct behavior when the bug condition holds
- **Preservation**: Existing behaviors that must remain unchanged after the fix
- **`baseArgs()`**: Function in `backend/utils/ytdlp.js` that builds the common yt-dlp CLI flags used on every invocation (anti-bot headers, cookies, proxy, extractor args)
- **`downloadArgs()`**: New function to be created in `backend/utils/ytdlp.js` that extends `baseArgs()` with rate-pacing sleep flags (`--sleep-interval`, `--max-sleep-interval`, `--sleep-requests`) for use only during actual downloads
- **`fetchMetadataWithFallback()`**: Function in `backend/utils/ytdlp.js` that fetches JSON metadata via yt-dlp with a primary (`api1`) and fallback (`api2`) attempt
- **`buildJobArgs()`**: Function in `backend/controllers/downloadController.js` that assembles the yt-dlp CLI argument list for a download job
- **`QuickDownloaderCard`**: React widget in `frontend/src/components/QuickDownloaderCard.jsx` that provides a simple URL-input-and-download UI on the landing page
- **DASH streams**: Separate video-only and audio-only streams that must be merged by yt-dlp; Instagram does not provide these
- **Async job flow**: The POST `/api/download` → poll `/api/download/:jobId` → serve file pattern used by the current backend

---

## Bug Details

### Bug 1 — Metadata Timeout

The bug manifests when any YouTube URL (regular or Shorts) is submitted for metadata preview. `fetchMetadataWithFallback` calls `runYtdlp` with `timeoutMs: 9_000`, but `baseArgs()` already includes `--sleep-interval 2`, `--max-sleep-interval 5`, and `--sleep-requests 2`, which together consume approximately 4 seconds before yt-dlp makes its first network request. This leaves only ~5 seconds for the actual HTTP round-trip, which is insufficient under normal server conditions.

**Formal Specification:**
```
FUNCTION isBugCondition_Bug1(X)
  INPUT: X of type MetadataFetchRequest
  OUTPUT: boolean

  RETURN (X.platform IN ['youtube', 'youtube_shorts'])
    AND X.timeoutMs <= 9_000
    AND X.args CONTAINS '--sleep-interval'
    AND X.args CONTAINS '--sleep-requests'
END FUNCTION
```

**Examples:**
- YouTube video URL submitted for preview → yt-dlp sleeps ~4s then times out at 9s → user sees "yt-dlp timed out after 9s"
- YouTube Shorts URL submitted for preview → same timeout path via `normaliseMediaUrl` → same failure
- api1 times out → falls through to api2 via `fallbackArgs` (which calls `baseArgs()` internally) → api2 also times out → combined error thrown
- Facebook URL submitted for preview → also affected by the same sleep flags, though less likely to time out due to faster extraction

### Bug 2 — Instagram Format Selection

The bug manifests when any Instagram URL is submitted for download. `buildJobArgs` unconditionally appends `-f bestvideo+bestaudio/best` for all non-audio, non-explicit-formatId requests. Instagram's CDN only serves pre-merged single-stream MP4 files; it does not expose separate DASH video and audio streams. When yt-dlp cannot find matching DASH streams, it exits with code 0 but writes no output file, causing `findOutputFile` to return `null` and the job to fail with "Output file not found".

**Formal Specification:**
```
FUNCTION isBugCondition_Bug2(X)
  INPUT: X of type DownloadJobArgs
  OUTPUT: boolean

  RETURN X.platform = 'instagram'
    AND X.formatId IS NULL OR X.formatId = 'best'
    AND X.type != 'audio'
    AND X.formatSelector = 'bestvideo+bestaudio/best'
END FUNCTION
```

**Examples:**
- Instagram Reels URL, no formatId → `buildJobArgs` uses `-f bestvideo+bestaudio/best` → yt-dlp exits 0, no file → "Output file not found"
- Instagram Post URL, no formatId → same path → same failure
- Instagram URL, type='audio' → uses `-x --audio-format mp3` → NOT affected (audio extraction works)
- YouTube URL, no formatId → uses `-f bestvideo+bestaudio/best` → works correctly (YouTube has DASH streams)

### Bug 3 — QuickDownloaderCard Legacy Endpoint

The bug manifests whenever a user interacts with the QuickDownloaderCard widget. The component calls `fetch('/api/download?url=...')` using the GET method. The backend's download router only accepts `POST /api/download` (the async job submission endpoint); there is no GET handler for that path. The server returns a 500 or 404 error, which the component catches and displays as "Server error".

**Formal Specification:**
```
FUNCTION isBugCondition_Bug3(X)
  INPUT: X of type WidgetDownloadRequest
  OUTPUT: boolean

  RETURN X.method = 'GET'
    AND X.endpoint = '/api/download'
    AND X.urlPassedAs = 'queryString'
END FUNCTION
```

**Examples:**
- User pastes YouTube URL, clicks Download → `GET /api/download?url=...` → 500 response → alert "Something went wrong!" + status "Server error"
- User pastes Instagram URL, clicks Download → same GET request → same failure
- Any URL submitted → component never reaches polling or file download stage
- Platform-specific downloader pages (e.g., `/instagram`) → use `useDownloadMedia` hook → NOT affected

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `baseArgs()` MUST continue to include all anti-bot flags: `--user-agent`, `--add-header` (Accept, Accept-Language, Sec-Fetch-Mode), `--referer`, `--extractor-args`, `--extractor-retries`, `--geo-bypass`, `--no-playlist`, `--no-warnings`, `--no-check-certificates`, and cookie/proxy flags when configured
- The api1 → api2 fallback chain in `fetchMetadataWithFallback` MUST continue to work for all platforms
- YouTube download jobs MUST continue to apply rate-pacing sleep flags (via the new `downloadArgs()`) to avoid 429 errors
- Audio downloads (`type='audio'` or `formatId='audio'`) MUST continue to use `-x --audio-format mp3 --audio-quality 0` for all platforms
- Explicit `formatId` downloads (non-audio, non-best) MUST continue to use `${formatId}+bestaudio/best`
- YouTube downloads without a `formatId` MUST continue to use `bestvideo+bestaudio/best`
- Platform-specific downloader pages (Instagram, Facebook, YouTube) MUST continue to use the `useDownloadMedia` hook and full async job flow, completely unaffected by changes to `QuickDownloaderCard`
- Facebook URL normalisation (unrolling share links) MUST continue to work

**Scope:**
All inputs that do NOT satisfy any of the three bug conditions should be completely unaffected by these fixes. This includes:
- Non-YouTube metadata fetches that complete within the existing timeout
- Non-Instagram download jobs using any format selector
- All interactions with platform-specific downloader pages (not the QuickDownloaderCard widget)

---

## Hypothesized Root Cause

### Bug 1 — Metadata Timeout

1. **Sleep flags in shared `baseArgs()`**: `--sleep-interval 2`, `--max-sleep-interval 5`, and `--sleep-requests 2` were added to `baseArgs()` to pace download requests and avoid YouTube 429 errors. However, `baseArgs()` is also used by `fetchMetadataWithFallback`, which only needs a fast `-J` JSON dump. The sleep flags are appropriate for downloads but harmful for metadata fetches.

2. **Insufficient timeout budget**: The 9-second `timeoutMs` was set before the sleep flags were added. With ~4 seconds consumed by sleep, only ~5 seconds remain for the actual network round-trip, which is too tight for YouTube's API under load.

3. **Both api1 and api2 share the same `baseArgs()`**: `fallbackArgs()` calls `baseArgs()` internally and adds more sleep (`--sleep-interval 3`, `--max-sleep-interval 6`), making the fallback path even slower.

### Bug 2 — Instagram Format Selection

1. **Platform-agnostic format selector**: `buildJobArgs` was written with YouTube in mind. The `bestvideo+bestaudio/best` selector works for YouTube because YouTube exposes separate DASH streams. Instagram's CDN only serves pre-merged MP4 files; requesting DASH streams causes yt-dlp to find no matching format and exit silently.

2. **Silent yt-dlp exit**: yt-dlp exits with code 0 even when no format matches (it considers "no matching format" a non-error condition in some configurations), so `runDownload` resolves successfully and the error only surfaces when `findOutputFile` returns `null`.

3. **No platform check in `buildJobArgs`**: The function receives `platform` as part of the job record but does not use it for format selection.

### Bug 3 — QuickDownloaderCard Legacy Endpoint

1. **Stale component code**: `QuickDownloaderCard` was written when the backend had a synchronous GET download endpoint. The backend was later refactored to an async POST + polling architecture, but the component was not updated.

2. **No polling logic**: The component expects a synchronous `{ downloadUrl }` response, which the current backend never returns from a GET request.

3. **No error detail**: The component catches all errors as "Server error" with no distinction between network failures, 404s, or 500s.

---

## Correctness Properties

Property 1: Bug Condition — Metadata Fetch Completes Without Timeout

_For any_ metadata fetch request where the bug condition holds (YouTube/Shorts URL, timeout ≤ 9s, sleep flags present in args), the fixed `fetchMetadataWithFallback` SHALL complete the fetch within 30 seconds and return valid JSON metadata without timing out.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition — Instagram Download Produces Output File

_For any_ download job where the bug condition holds (platform = 'instagram', no explicit formatId, type ≠ 'audio'), the fixed `buildJobArgs` SHALL use `-f best[ext=mp4]/best` so that yt-dlp selects a pre-merged single-stream format, exits 0, and writes an output file that `findOutputFile` can locate.

**Validates: Requirements 2.5, 2.6, 2.7**

Property 3: Bug Condition — QuickDownloaderCard Uses Async Job Flow

_For any_ widget download request where the bug condition holds (GET method, URL in query string), the fixed `QuickDownloaderCard` SHALL POST to `/api/download` with the URL in the request body, poll `/api/download/:jobId` until the job is `completed` or `failed`, and trigger a browser download using the `downloadUrl` from the completed job response.

**Validates: Requirements 2.8, 2.9, 2.10, 2.11, 2.12**

Property 4: Preservation — Non-Buggy Inputs Unchanged

_For any_ input where none of the three bug conditions hold (non-YouTube metadata fetches, non-Instagram downloads, platform-page interactions), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing anti-bot protections, format selectors, audio extraction, fallback chains, and platform-page download flows.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

---

## Fix Implementation

### Bug 1 — Metadata Timeout

**File**: `backend/utils/ytdlp.js`

**Changes Required:**

1. **Remove sleep flags from `baseArgs()`**: Delete `--sleep-interval 2`, `--max-sleep-interval 5`, and `--sleep-requests 2` from the `baseArgs()` function body. These flags must not be present on metadata fetch invocations.

2. **Create `downloadArgs()` function**: Add a new exported function `downloadArgs()` that calls `baseArgs()` and appends the sleep flags:
   ```js
   function downloadArgs() {
     return [
       ...baseArgs(),
       '--sleep-interval', '2',
       '--max-sleep-interval', '5',
       '--sleep-requests', '2',
     ];
   }
   ```

3. **Increase metadata timeout to 30s**: In `fetchMetadataWithFallback`, change `timeoutMs: 9_000` to `timeoutMs: 30_000` for both the `api1` and `api2` `runYtdlp` calls. Also update `fetchMetadata` (used by `processPlatformJob`) from `timeoutMs: 9_000` to `timeoutMs: 30_000`.

4. **Export `downloadArgs`**: Add `downloadArgs` to the `module.exports` object.

### Bug 2 — Instagram Format Selection

**File**: `backend/controllers/downloadController.js`

**Function**: `buildJobArgs`

**Changes Required:**

1. **Add `platform` parameter**: Update the function signature to accept `platform` alongside `url`, `type`, `formatId`, and `outTemplate`.

2. **Add platform-aware format selection**: Before the existing `else` branch that appends `-f bestvideo+bestaudio/best`, add a check for Instagram:
   ```js
   } else if (platform === 'instagram') {
     args.push('-f', 'best[ext=mp4]/best');
   } else {
     args.push('-f', 'bestvideo+bestaudio/best');
   }
   ```

3. **Pass `platform` from `processPlatformJob`**: Update the `buildJobArgs` call in `processPlatformJob` to pass `platform: job.platform` (already available on the job record).

### Bug 3 — QuickDownloaderCard Legacy Endpoint

**File**: `frontend/src/components/QuickDownloaderCard.jsx`

**Changes Required:**

1. **Replace GET fetch with POST**: Change `fetch('/api/download?url=...')` to a `fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: inputUrl, platform: detectedPlatform, type: 'video' }) })`.

2. **Add polling loop**: After receiving `{ jobId }` from the POST response, poll `GET /api/download/${jobId}` every 2 seconds until `status === 'completed'` or `status === 'failed'`, with a maximum poll count to prevent infinite loops (e.g., 60 polls = 2 minutes).

3. **Trigger browser download on completion**: When the polled status is `completed`, use `window.location.href = data.downloadUrl` (or create a temporary `<a>` element with `download` attribute) to trigger the browser's native file download.

4. **Add descriptive status messages**: Update the status display to show meaningful progress messages: "Starting download…", "Processing… (N%)", "Downloading file…", "Done!", and specific error messages from `data.message` on failure.

5. **Prevent duplicate submissions**: The existing `disabled={loading}` on the button is sufficient; ensure `loading` is set to `true` for the entire POST + poll cycle and only reset to `false` on completion or error.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on unfixed code to confirm the root cause analysis; then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Bug 1 Test Plan**: Call `fetchMetadataWithFallback` with a YouTube URL against the unfixed code and observe the timeout. Inspect the args array passed to `runYtdlp` to confirm sleep flags are present.

**Bug 1 Test Cases:**
1. **YouTube URL metadata fetch**: Call `fetchMetadataWithFallback('https://www.youtube.com/watch?v=...')` — expect timeout after 9s (will fail on unfixed code)
2. **Args inspection**: Call `baseArgs()` and assert `--sleep-interval` is present — confirms root cause
3. **Timeout budget calculation**: Assert that sleep flags alone consume ≥ 4s of the 9s budget

**Bug 2 Test Plan**: Call `buildJobArgs` with `platform='instagram'` and no `formatId` on unfixed code. Assert the format selector is `bestvideo+bestaudio/best`.

**Bug 2 Test Cases:**
1. **Instagram format selector**: Call `buildJobArgs({ url, type: 'video', formatId: null, outTemplate })` — assert args contain `-f bestvideo+bestaudio/best` (will fail after fix)
2. **yt-dlp silent exit**: Run yt-dlp with `-f bestvideo+bestaudio/best` against a real Instagram URL — observe exit 0 with no output file

**Bug 3 Test Plan**: Render `QuickDownloaderCard` and simulate a download click. Intercept the fetch call and assert it uses GET with a query string.

**Bug 3 Test Cases:**
1. **GET request assertion**: Simulate click, intercept fetch — assert method is `GET` and URL contains `?url=` (will fail after fix)
2. **500 response handling**: Mock the GET endpoint to return 500 — assert component shows "Server error"

**Expected Counterexamples:**
- Bug 1: `fetchMetadataWithFallback` throws `Error: yt-dlp timed out after 9s`
- Bug 2: `buildJobArgs` returns args array containing `'-f', 'bestvideo+bestaudio/best'` for Instagram
- Bug 3: `fetch` is called with `GET /api/download?url=...`

### Fix Checking

**Goal**: Verify that for all inputs where each bug condition holds, the fixed code produces the expected behavior.

**Bug 1 Pseudocode:**
```
FOR ALL X WHERE isBugCondition_Bug1(X) DO
  result := fetchMetadataWithFallback_fixed(X.url)
  ASSERT result.timedOut = false
  ASSERT result.data IS valid JSON with 'title' field
  ASSERT timeElapsed < 30_000
END FOR
```

**Bug 2 Pseudocode:**
```
FOR ALL X WHERE isBugCondition_Bug2(X) DO
  args := buildJobArgs_fixed({ url: X.url, platform: 'instagram', type: 'video', formatId: null, outTemplate })
  ASSERT args CONTAINS '-f'
  ASSERT args[indexOf('-f') + 1] = 'best[ext=mp4]/best'
END FOR
```

**Bug 3 Pseudocode:**
```
FOR ALL X WHERE isBugCondition_Bug3(X) DO
  result := QuickDownloaderCard_handleDownload_fixed(X)
  ASSERT result.requestMethod = 'POST'
  ASSERT result.requestBody CONTAINS 'url'
  ASSERT result.pollingCalled = true
  ASSERT result.browserDownloadTriggered = true (when job completes)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition_Bug1(X)
              AND NOT isBugCondition_Bug2(X)
              AND NOT isBugCondition_Bug3(X) DO
  ASSERT original_behavior(X) = fixed_behavior(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Preservation Test Cases:**
1. **`baseArgs()` anti-bot flags preserved**: Assert `baseArgs()` still contains `--user-agent`, `--add-header Accept`, `--add-header Accept-Language`, `--add-header Sec-Fetch-Mode`, `--referer`, `--extractor-args youtube:player_client=...`, `--extractor-retries 5`, `--geo-bypass`, `--no-playlist`
2. **`downloadArgs()` includes sleep flags**: Assert `downloadArgs()` contains `--sleep-interval`, `--max-sleep-interval`, `--sleep-requests`
3. **YouTube format selector preserved**: Call `buildJobArgs_fixed({ platform: 'youtube', type: 'video', formatId: null })` — assert `-f bestvideo+bestaudio/best`
4. **Audio format selector preserved**: Call `buildJobArgs_fixed({ platform: 'instagram', type: 'audio' })` — assert `-x --audio-format mp3`
5. **Explicit formatId preserved**: Call `buildJobArgs_fixed({ platform: 'youtube', formatId: '137' })` — assert `-f 137+bestaudio/best`
6. **Facebook format selector preserved**: Call `buildJobArgs_fixed({ platform: 'facebook', type: 'video', formatId: null })` — assert `-f bestvideo+bestaudio/best`
7. **Platform-page download flow unaffected**: Assert `useDownloadMedia` hook behavior is unchanged (no modifications to that file)

### Unit Tests

- Test `baseArgs()` does NOT contain sleep flags after fix
- Test `downloadArgs()` DOES contain sleep flags and all `baseArgs()` flags
- Test `buildJobArgs` with `platform='instagram'` returns `best[ext=mp4]/best`
- Test `buildJobArgs` with `platform='youtube'` still returns `bestvideo+bestaudio/best`
- Test `buildJobArgs` with `type='audio'` returns `-x --audio-format mp3` for all platforms
- Test `buildJobArgs` with explicit `formatId` returns `${formatId}+bestaudio/best`
- Test `QuickDownloaderCard` sends POST on submit
- Test `QuickDownloaderCard` polls job status endpoint after POST
- Test `QuickDownloaderCard` triggers download when job is `completed`
- Test `QuickDownloaderCard` shows error message when job is `failed`

### Property-Based Tests

- Generate random platform values (youtube, facebook, tiktok, etc.) and verify `buildJobArgs` never uses `best[ext=mp4]/best` for non-Instagram platforms
- Generate random Instagram job configs (varying type, formatId) and verify the format selector is always `best[ext=mp4]/best` when type ≠ 'audio' and formatId is null
- Generate random `baseArgs()` call results and verify sleep flags are never present
- Generate random `downloadArgs()` call results and verify sleep flags are always present and all `baseArgs()` flags are also present
- Generate random QuickDownloaderCard interactions and verify the fetch method is always POST after the fix

### Integration Tests

- Full metadata fetch for a YouTube URL completes within 30 seconds (requires network)
- Full Instagram download job produces an output file (requires network + yt-dlp)
- QuickDownloaderCard full flow: POST → poll → download trigger (requires running backend)
- Switching between platform pages and the QuickDownloaderCard does not interfere with either flow
- Audio download for Instagram URL still produces an MP3 file after the format fix
