const { detectPlatform } = require('../utils/platformDetector');
const { checkSSRF } = require('../utils/ssrfGuard');

async function validateRequest(req, res, next) {
  // Check body size (express.json limit covers this mostly, but we can enforce strict JSON mapping here)
  if (!req.body || !req.body.url) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_URL',
      message: 'Missing "url" in request body.'
    });
  }

  const { url } = req.body;

  // 1. Validate platform
  const platformCheck = detectPlatform(url);
  if (!platformCheck.valid) {
    return res.status(400).json({
      status: 'error',
      code: platformCheck.error,
      message: 'This platform is not supported or URL is malformed.'
    });
  }

  req.platformDetails = platformCheck;

  // 2. SSRF Check
  try {
    await checkSSRF(url);
    next();
  } catch (err) {
    return res.status(403).json({
      status: 'error',
      code: err.message === 'SSRF_DETECTED' ? 'FORBIDDEN_IP' : 'INVALID_URL',
      message: 'Access to the specified URL is blocked for security reasons.'
    });
  }
}

module.exports = { validateRequest };
