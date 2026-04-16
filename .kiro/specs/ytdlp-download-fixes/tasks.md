# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Three-Bug Exploration (Timeout / Instagram Format / Legacy GET)
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists before any fix is applied
  - **Scoped PBT Approach**: For deterministic bugs, scope each property to the concrete failing case(s) to ensure reproducibility

  **Bug 1 — Metadata Timeout:**
  - Call `baseArgs()` and assert `--sleep-interval` IS present in the returned array (confirms root cause: sleep flags in shared args)
  - Assert that `baseArgs()` contains `--sleep-requests` (confirms the ~4s sleep budget consumption)
  - Call `fetchMetadataWithFallback` with a YouTube URL and `timeoutMs: 9_000` — expect it to throw `yt-dlp timed out after 9s`
  - Document counterexample: `fetchMetadataWithFallback('https://www.youtube.com/watch?v=dQw4w9WgXcQ')` throws timeout error
  - Run on UNFIXED code — **EXPECTED OUTCOME**: Tests FAIL (confirms bug exists)

  **Bug 2 — Instagram Format Selection:**
  - Call `buildJobArgs({ url: 'https://www.instagram.com/reel/abc/', type: 'video', formatId: null, outTemplate: '/tmp/test.%(ext)s' })` on unfixed code
  - Assert the returned args array contains `'-f'` followed by `'bestvideo+bestaudio/best'`
  - This assertion will FAIL after the fix (it documents the buggy state)
  - Document counterexample: `buildJobArgs` for Instagram returns `[..., '-f', 'bestvideo+bestaudio/best', ...]`
  - Run on UNFIXED code — **EXPECTED OUTCOME**: Test FAILS (confirms bug exists)

  **Bug 3 — QuickDownloaderCard Legacy GET:**
  - Render `QuickDownloaderCard`, set a URL in the input, simulate a click
  - Intercept `fetch` calls and assert the method is `'GET'` and the URL contains `?url=`
  - Document counterexample: component calls `GET /api/download?url=...` instead of `POST /api/download`
  - Run on UNFIXED code — **EXPECTED OUTCOME**: Test FAILS (confirms bug exists)

  - Mark task complete when all three exploration tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Input Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code behavior for non-buggy inputs, then encode those observations as property-based tests
  - Run tests on UNFIXED code first to confirm they PASS (establishes baseline)
  - **EXPECTED OUTCOME**: All preservation tests PASS on unfixed code

  **Preservation Group A — `baseArgs()` anti-bot flags:**
  - Observe: call `baseArgs()` on unfixed code and record all flags present
  - Write property: `baseArgs()` always returns an array containing `--user-agent`, `--add-header Accept:...`, `--add-header Accept-Language:...`, `--add-header Sec-Fetch-Mode:...`, `--referer`, `--extractor-args youtube:player_client=android,web,default`, `--extractor-retries 5`, `--geo-bypass`, `--no-playlist`, `--no-warnings`, `--no-check-certificates`
  - Verify test passes on unfixed code

  **Preservation Group B — `buildJobArgs` non-Instagram format selectors:**
  - Observe: `buildJobArgs({ platform: 'youtube', type: 'video', formatId: null, ... })` returns args with `-f bestvideo+bestaudio/best`
  - Observe: `buildJobArgs({ platform: 'facebook', type: 'video', formatId: null, ... })` returns args with `-f bestvideo+bestaudio/best`
  - Observe: `buildJobArgs({ platform: 'instagram', type: 'audio', ... })` returns args with `-x --audio-format mp3`
  - Observe: `buildJobArgs({ platform: 'youtube', formatId: '137', ... })` returns args with `-f 137+bestaudio/best`
  - Write property-based tests: for all platforms ≠ 'instagram' with type='video' and no formatId, format selector is always `bestvideo+bestaudio/best`
  - Write property-based tests: for any platform with type='audio', args always contain `-x --audio-format mp3 --audio-quality 0`
  - Write property-based tests: for any platform with explicit non-audio formatId, args always contain `-f ${formatId}+bestaudio/best`
  - Verify all tests pass on unfixed code

  **Preservation Group C — `QuickDownloaderCard` non-widget flows:**
  - Observe: platform-specific downloader pages use `useDownloadMedia` hook — this file is not modified
  - Write test: `useDownloadMedia` hook behavior is unchanged (no modifications to `frontend/src/hooks/useDownloadMedia.js`)
  - Verify test passes on unfixed code

  - Mark task complete when all preservation tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix all three bugs

  - [x] 3.1 Fix Bug 1 — Remove sleep flags from `baseArgs()` and create `downloadArgs()`
    - In `backend/utils/ytdlp.js`, remove `'--sleep-interval', '2'`, `'--max-sleep-interval', '5'`, and `'--sleep-requests', '2'` from the `baseArgs()` function body
    - Add a new exported `downloadArgs()` function that calls `baseArgs()` and appends those three sleep flags
    - Update `buildDownloadArgs` (in the same file) to spread `downloadArgs()` instead of `baseArgs()`
    - Add `downloadArgs` to `module.exports`
    - _Bug_Condition: isBugCondition_Bug1(X) where X.platform IN ['youtube','youtube_shorts'] AND X.timeoutMs <= 9_000 AND X.args CONTAINS '--sleep-interval'_
    - _Expected_Behavior: baseArgs() contains NO sleep flags; downloadArgs() contains all baseArgs() flags PLUS sleep flags_
    - _Preservation: All other flags in baseArgs() (--user-agent, --add-header, --referer, --extractor-args, --extractor-retries, --geo-bypass, --no-playlist, --no-warnings, --no-check-certificates, cookies, proxy) MUST remain unchanged_
    - _Requirements: 2.3, 2.4, 3.2, 3.6_

  - [x] 3.2 Fix Bug 1 — Increase metadata timeout to 30s
    - In `fetchMetadataWithFallback` (`backend/utils/ytdlp.js`), change `timeoutMs: 9_000` to `timeoutMs: 30_000` for both the `api1` and `api2` `runYtdlp` calls
    - In `fetchMetadata` (same file), change `timeoutMs: 9_000` to `timeoutMs: 30_000`
    - _Bug_Condition: isBugCondition_Bug1(X) where X.timeoutMs = 9_000_
    - _Expected_Behavior: fetchMetadataWithFallback completes within 30s and returns valid JSON metadata_
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Fix Bug 2 — Add platform-aware format selection to `buildJobArgs`
    - In `backend/controllers/downloadController.js`, update `buildJobArgs` signature to accept `platform` alongside `url`, `type`, `formatId`, and `outTemplate`
    - Add an `else if (platform === 'instagram')` branch before the existing `else` that appends `'-f', 'best[ext=mp4]/best'`
    - Keep the existing `else` branch (`'-f', 'bestvideo+bestaudio/best'`) for all other platforms
    - Update the `buildJobArgs` call in `processPlatformJob` to pass `platform: job.platform`
    - _Bug_Condition: isBugCondition_Bug2(X) where X.platform = 'instagram' AND X.formatSelector = 'bestvideo+bestaudio/best'_
    - _Expected_Behavior: buildJobArgs with platform='instagram' returns args containing '-f best[ext=mp4]/best'_
    - _Preservation: YouTube/Facebook/other platforms still use 'bestvideo+bestaudio/best'; audio and explicit formatId paths are unchanged_
    - _Requirements: 2.5, 2.6, 2.7, 3.3, 3.4, 3.5_

  - [x] 3.4 Fix Bug 3 — Rewrite `QuickDownloaderCard` to use async job flow
    - In `frontend/src/components/QuickDownloaderCard.jsx`, replace the `GET /api/download?url=...` fetch with a `POST /api/download` call with JSON body `{ url: inputUrl, platform: detectedPlatform, type: 'video' }`
    - Add a `detectPlatform(url)` helper that returns `'youtube'`, `'instagram'`, `'facebook'`, or `'unknown'` based on the URL hostname
    - After receiving `{ jobId }` from the POST response, add a polling loop that calls `GET /api/download/${jobId}` every 2 seconds, up to a maximum of 60 polls (2 minutes)
    - When polled status is `'completed'`, create a temporary `<a>` element with the `download` attribute and `href = data.downloadUrl` to trigger the browser's native file download
    - Update status messages to show: `'Starting download…'` (after POST), `'Processing…'` (while polling), `'Downloading file…'` (when triggering download), `'Done!'` (on success)
    - On `'failed'` status or network error, display `data.message` or the error message instead of a generic alert
    - Ensure `loading` is set to `true` for the entire POST + poll cycle and reset to `false` on completion or error
    - _Bug_Condition: isBugCondition_Bug3(X) where X.method = 'GET' AND X.endpoint = '/api/download' AND X.urlInQueryString = true_
    - _Expected_Behavior: component POSTs to /api/download, polls /api/download/:jobId, triggers browser download on completion_
    - _Preservation: Platform-specific downloader pages (useDownloadMedia hook) are completely unaffected_
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 2.12, 3.8_

  - [x] 3.5 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - All Three Bug Conditions Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior; when they pass, the bugs are fixed
    - Re-run Bug 1 exploration test: assert `baseArgs()` does NOT contain `--sleep-interval`; assert `fetchMetadataWithFallback` completes without timeout
    - Re-run Bug 2 exploration test: assert `buildJobArgs` for Instagram returns `best[ext=mp4]/best` (not `bestvideo+bestaudio/best`)
    - Re-run Bug 3 exploration test: assert `QuickDownloaderCard` sends `POST` (not `GET`) with URL in request body
    - **EXPECTED OUTCOME**: All three exploration tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Input Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Re-run Preservation Group A: assert `baseArgs()` still contains all anti-bot flags
    - Re-run Preservation Group B: assert YouTube/Facebook format selectors, audio extraction, and explicit formatId paths are unchanged
    - Re-run Preservation Group C: assert `useDownloadMedia` hook is unmodified
    - Additionally verify: `downloadArgs()` contains all `baseArgs()` flags PLUS the three sleep flags
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite and confirm all tests pass
  - Verify Bug 1: `baseArgs()` has no sleep flags; `downloadArgs()` has sleep flags; metadata timeout is 30s
  - Verify Bug 2: Instagram jobs use `best[ext=mp4]/best`; YouTube/Facebook jobs still use `bestvideo+bestaudio/best`
  - Verify Bug 3: `QuickDownloaderCard` POSTs to `/api/download`, polls for job status, and triggers browser download on completion
  - Verify no regressions: all preservation tests pass
  - Ask the user if any questions arise before closing the spec
