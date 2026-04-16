const dns = require('dns');
const net = require('net');

function isPrivateIP(ip) {
  // Check IPv4
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    return (
      parts[0] === 127 || // Loopback
      parts[0] === 10 || // Class A private
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // Class B private
      (parts[0] === 192 && parts[1] === 168) || // Class C private
      (parts[0] === 169 && parts[1] === 254) // Link-local
    );
  }
  // Check IPv6
  if (net.isIPv6(ip)) {
    return ip === '::1' || ip.toLowerCase().startsWith('fe80:');
  }
  return false;
}

function checkSSRF(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;

      // If hostname is directly an IP
      if (net.isIP(hostname)) {
        if (isPrivateIP(hostname)) {
          return reject(new Error('SSRF_DETECTED'));
        }
        return resolve(url);
      }

      // DNS lookup
      dns.lookup(hostname, (err, address) => {
        if (err) {
          // If DNS fails, it might be an invalid domain. Reject it to be safe.
          return reject(new Error('DNS_LOOKUP_FAILED'));
        }
        if (isPrivateIP(address)) {
          return reject(new Error('SSRF_DETECTED'));
        }
        resolve(url);
      });
    } catch (error) {
      reject(new Error('INVALID_URL'));
    }
  });
}

module.exports = { checkSSRF };
