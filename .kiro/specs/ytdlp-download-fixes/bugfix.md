# Bugfix Requirements Document

## Introduction

Three separate bugs are causing download failures in the DownloadMarket app. First, all YouTube and YouTube Shorts metadata fetches consistently time out because the 9-second budget is consumed by intentional sleep delays that belong only in download flows. Second, Instagram downloads always fail silently — yt-dlp exits with code 0 but produces no file because the format selector requests DASH streams that Instagram does not support. Third, the "Video Downloader" widget on the landing page (`QuickDownloaderCard`) hits a legacy GET endpoint that no longer exists, returning 500 errors on every attempt.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — YouTube/yt-dlp metadata fetch always times out**

1.1 WHEN a YouTube video URL (regular or Shorts) is submitted for preview THEN the system times out with `yt-dlp timed out after 9s` on the api1 attempt

1.2 WHEN the api1 metadata fetch times out for a YouTube URL THEN the system falls through to the api2 fallback and times out again with `yt-dlp timed out after 9s`

1.3 WHEN `baseArgs()` is called THEN the system includes `--sleep-interval 2`, `--max-sleep-interval 5`, and `--sleep-requests 2` flags, consuming ~4 seconds of the 9-second timeout budget before yt-dlp begins any network activity

**Bug 2 — Instagram download always fails with "Output file not found"**

2.1 WHEN an Instagram URL is submitted for download THEN the system runs yt-dlp with `-f bestvideo+bestaudio/best` and yt-dlp exits with code 0 but writes no output file

2.2 WHEN `buildJobArgs` is called for an Instagram platform job THEN the system uses the same `-f bestvideo+bestaudio/best` format selector as YouTube, which fails silently on Instagram because Instagram does not provide separate DASH video and audio streams

**Bug 3 — QuickDownloaderCard widget uses broken legacy GET endpoint**

3.1 WHEN a user pastes a URL into the QuickDownloaderCard widget and clicks "Download" THEN the system sends `GET /api/download?url=...` which returns a 500 error

3.2 WHEN the GET request to `/api/download` returns a 500 error THEN the system displays a generic "Server error" status with no actionable feedback to the user

---

### Expected Behavior (Correct)

**Bug 1 — YouTube/yt-dlp metadata fetch always times out**

2.1 WHEN a YouTube video URL (regular or Shorts) is submitted for preview THEN the system SHALL complete the metadata fetch within 30 seconds without timing out under normal network conditions

2.2 WHEN `fetchMetadataWithFallback` is called THEN the system SHALL use a `timeoutMs` of 30,000 ms (30s) for each metadata fetch attempt

2.3 WHEN `baseArgs()` is called THEN the system SHALL NOT include `--sleep-interval`, `--max-sleep-interval`, or `--sleep-requests` flags, so that metadata fetches are not artificially delayed

2.4 WHEN a download job is started THEN the system SHALL include `--sleep-interval`, `--max-sleep-interval`, and `--sleep-requests` flags via a separate `downloadArgs()` function so that download requests are still rate-paced

**Bug 2 — Instagram download always fails with "Output file not found"**

2.5 WHEN an Instagram URL is submitted for download THEN the system SHALL select the format using `-f best[ext=mp4]/best` so that yt-dlp picks a pre-merged single-stream format compatible with Instagram

2.6 WHEN `buildJobArgs` is called with `platform === 'instagram'` THEN the system SHALL use a platform-aware format selector that avoids DASH stream merging

2.7 WHEN yt-dlp exits with code 0 for an Instagram download THEN the system SHALL find the output file and complete the job successfully

**Bug 3 — QuickDownloaderCard widget uses broken legacy GET endpoint**

2.8 WHEN a user pastes a URL into the QuickDownloaderCard widget and clicks "Download" THEN the system SHALL POST to `/api/download` with the URL in the request body to create an async download job

2.9 WHEN the POST to `/api/download` returns a `jobId` THEN the system SHALL poll `GET /api/download/:jobId` at regular intervals until the job status is `completed` or `failed`

2.10 WHEN the polled job status is `completed` THEN the system SHALL trigger a browser download using the `downloadUrl` from the job response

2.11 WHEN the download is in progress THEN the system SHALL display a loading state that prevents duplicate submissions

2.12 WHEN the job fails or a network error occurs THEN the system SHALL display a descriptive error message to the user instead of a generic alert

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a Facebook URL is submitted for preview THEN the system SHALL CONTINUE TO fetch metadata using `fetchMetadataWithFallback` with the same anti-bot headers, cookies, and proxy settings

3.2 WHEN a YouTube download job (not metadata fetch) is started THEN the system SHALL CONTINUE TO apply rate-pacing sleep flags to avoid 429 errors from YouTube during the actual download

3.3 WHEN a YouTube or Facebook URL is submitted for download with `formatId` set to `'audio'` THEN the system SHALL CONTINUE TO extract audio as MP3 using `-x --audio-format mp3`

3.4 WHEN a YouTube URL is submitted for download with an explicit `formatId` (not `'best'` and not `'audio'`) THEN the system SHALL CONTINUE TO use that specific format ID for the download

3.5 WHEN a YouTube URL is submitted for download without a `formatId` THEN the system SHALL CONTINUE TO use `bestvideo+bestaudio/best` to obtain the highest quality merged output

3.6 WHEN `baseArgs()` is called THEN the system SHALL CONTINUE TO include anti-bot headers (`--user-agent`, `--add-header`, `--referer`), `--extractor-args`, `--extractor-retries`, `--geo-bypass`, `--no-playlist`, and cookie/proxy flags when configured

3.7 WHEN the api1 metadata fetch fails for any platform THEN the system SHALL CONTINUE TO fall back to api2 using `fallbackArgs` with alternate player clients

3.8 WHEN a user navigates to a platform-specific downloader page (Instagram, Facebook, YouTube) THEN the system SHALL CONTINUE TO use the existing `useDownloadMedia` hook and full async job flow, unaffected by changes to `QuickDownloaderCard`

---

## Bug Condition Pseudocode

### Bug 1 — Metadata Timeout

```pascal
FUNCTION isBugCondition_Bug1(X)
  INPUT: X of type MetadataFetchRequest
  OUTPUT: boolean

  // Bug triggers when a YouTube URL is fetched with sleep flags in baseArgs
  // and a 9s timeout — the sleep flags alone consume ~4s of the budget
  RETURN (X.platform = 'youtube' OR X.platform = 'youtube_shorts')
    AND X.timeoutMs = 9_000
    AND X.args CONTAINS '--sleep-interval'
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_Bug1(X) DO
  result ← fetchMetadataWithFallback'(X)
  ASSERT result.timedOut = false
  ASSERT result.data IS valid JSON metadata
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_Bug1(X) DO
  ASSERT fetchMetadataWithFallback(X) = fetchMetadataWithFallback'(X)
END FOR
```

### Bug 2 — Instagram Format Selection

```pascal
FUNCTION isBugCondition_Bug2(X)
  INPUT: X of type DownloadJobArgs
  OUTPUT: boolean

  // Bug triggers when Instagram download uses DASH format selector
  RETURN X.platform = 'instagram'
    AND X.formatSelector = 'bestvideo+bestaudio/best'
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_Bug2(X) DO
  result ← buildJobArgs'(X)
  ASSERT result.formatSelector = 'best[ext=mp4]/best'
  ASSERT ytdlp_exit_code(result) = 0
  ASSERT output_file_exists(result) = true
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_Bug2(X) DO
  ASSERT buildJobArgs(X).formatSelector = buildJobArgs'(X).formatSelector
END FOR
```

### Bug 3 — QuickDownloaderCard Legacy Endpoint

```pascal
FUNCTION isBugCondition_Bug3(X)
  INPUT: X of type WidgetDownloadRequest
  OUTPUT: boolean

  // Bug triggers when the widget uses GET /api/download?url=...
  RETURN X.method = 'GET'
    AND X.endpoint = '/api/download'
    AND X.urlInQueryString = true
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_Bug3(X) DO
  result ← QuickDownloaderCard_handleDownload'(X)
  ASSERT result.requestMethod = 'POST'
  ASSERT result.endpoint = '/api/download'
  ASSERT result.pollingUsed = true
  ASSERT result.httpStatus != 500
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_Bug3(X) DO
  // Other download flows (platform pages) are unaffected
  ASSERT platformPageDownload(X) = platformPageDownload'(X)
END FOR
```
