import { Request } from 'express';
import { createHash } from 'crypto';

/**
 * Calculate a device fingerprint based on request headers and properties
 */
export function calculateDeviceFingerprint(req: Request): string {
  const components = [
    req.headers['user-agent'],
    req.headers['accept-language'],
    req.headers['accept-encoding'],
    req.headers['accept'],
    req.ip,
    req.headers['sec-ch-ua'],
    req.headers['sec-ch-ua-platform'],
    req.headers['sec-ch-ua-mobile']
  ];

  const fingerprint = components
    .filter(Boolean)
    .join('|');

  return createHash('sha256')
    .update(fingerprint)
    .digest('hex');
}

/**
 * Parse user agent string to get browser, OS and device info
 */
export function parseUserAgent(userAgent: string) {
  // This is a simple example - in production use a proper UA parser library
  const ua = userAgent.toLowerCase();
  
  const browser = 
    ua.includes('firefox') ? 'Firefox' :
    ua.includes('chrome') ? 'Chrome' :
    ua.includes('safari') ? 'Safari' :
    ua.includes('edge') ? 'Edge' :
    'Other';

  const os =
    ua.includes('windows') ? 'Windows' :
    ua.includes('mac') ? 'macOS' :
    ua.includes('linux') ? 'Linux' :
    ua.includes('android') ? 'Android' :
    ua.includes('ios') ? 'iOS' :
    'Other';

  const device =
    ua.includes('mobile') ? 'Mobile' :
    ua.includes('tablet') ? 'Tablet' :
    'Desktop';

  return { browser, os, device };
}

/**
 * Check if an IP address is from a known proxy/VPN
 */
export function isProxyIP(ip: string): boolean {
  // In production, use a proper IP intelligence service
  const knownProxyRanges = [
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    // Add more ranges
  ];

  return knownProxyRanges.some(range => isIPInRange(ip, range));
}

/**
 * Check if an IP is in a CIDR range
 */
function isIPInRange(ip: string, cidr: string): boolean {
  const [range, bits = "32"] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipInt = ip.split(".")
    .reduce((int, oct) => (int << 8) + parseInt(oct), 0);
  const rangeInt = range.split(".")
    .reduce((int, oct) => (int << 8) + parseInt(oct), 0);
    
  return (ipInt & mask) === (rangeInt & mask);
}

/**
 * Calculate entropy of a password
 */
export function calculatePasswordEntropy(password: string): number {
  const charset = {
    numbers: /\d/.test(password),
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  let poolSize = 0;
  if (charset.numbers) poolSize += 10;
  if (charset.lowercase) poolSize += 26;
  if (charset.uppercase) poolSize += 26;
  if (charset.special) poolSize += 32;

  return Math.log2(poolSize) * password.length;
}