'use strict';

const axios = require('axios');

const URL = process.env.KEEPALIVE_URL || process.env.BASE_URL || 'https://download-market.onrender.com';

setInterval(async () => {
  try {
    await axios.get(URL, { timeout: 9000 });
    // eslint-disable-next-line no-console
    console.log('Ping success');
  } catch {
    // eslint-disable-next-line no-console
    console.log('Ping failed');
  }
}, 5 * 60 * 1000);

// Best practice: external uptime monitor avoids single-instance blind spots.
// Recommended: UptimeRobot at 5 minute interval pointing to /api/health.
