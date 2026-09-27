/**
 * Device Security & 2-Factor Authentication (2FA) Engine
 * Manages device fingerprinting, unrecognized device detection, and OTP generation.
 */

import { UserProfile } from '../types';

export interface DeviceInfo {
  id: string;
  name: string;
  browser: string;
  os: string;
  isMobile: boolean;
  ipPlaceholder: string;
}

const DEVICE_STORAGE_KEY = 'quantiq_device_fingerprint_id';

/**
 * Get or initialize a unique persistent device ID for this client browser
 */
export function getOrCreateDeviceId(): string {
  try {
    let devId = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!devId) {
      const randStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      devId = `DEV-${randStr}-${Date.now().toString().slice(-4)}`;
      localStorage.setItem(DEVICE_STORAGE_KEY, devId);
    }
    return devId;
  } catch {
    return 'DEV-FALLBACK-01';
  }
}

/**
 * Detect browser, operating system, and hardware profile
 */
export function getCurrentDeviceInfo(): DeviceInfo {
  const devId = getOrCreateDeviceId();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'Windows PC';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS (Apple)';
  else if (ua.includes('Android')) os = 'Android Mobile';
  else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const name = `${browser} on ${os}`;

  return {
    id: devId,
    name,
    browser,
    os,
    isMobile,
    ipPlaceholder: '197.237.18.24 (Safaricom Kenya)'
  };
}

/**
 * Check if the current device is recognized for this user profile.
 * If user has no known devices registered, or if current device is in knownDeviceIds, it is known.
 */
export function isDeviceRecognized(user: Partial<UserProfile>): boolean {
  const currentDeviceId = getOrCreateDeviceId();
  
  // If user explicitly has knownDeviceIds and current device is NOT in it -> unrecognized device!
  if (user.knownDeviceIds && user.knownDeviceIds.length > 0) {
    return user.knownDeviceIds.includes(currentDeviceId);
  }

  // If user has not yet enrolled any device (first time), consider it recognized and save
  return true;
}

/**
 * Register current device into user's trusted device list
 */
export function registerCurrentDevice(user: Partial<UserProfile>): string[] {
  const currentDeviceId = getOrCreateDeviceId();
  const existing = user.knownDeviceIds || [];
  if (!existing.includes(currentDeviceId)) {
    return [...existing, currentDeviceId];
  }
  return existing;
}

/**
 * Generate a 6-digit OTP code for 2FA validation
 */
export function generate2FaOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const generateDevice2faOtp = generate2FaOtp;

/**
 * Mask sensitive phone number (e.g. +254 712 345 678 -> +254 7** *** 678)
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '+254 7** *** ***';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return '+254 7** *** ***';
  const prefix = clean.slice(0, 7);
  const suffix = clean.slice(-3);
  return `${prefix} *** ${suffix}`;
}

/**
 * Mask sensitive email (e.g. investor@example.com -> i***r@example.com)
 */
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'i***@quantiqprime.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local.charAt(0)}***@${domain}`;
  return `${local.charAt(0)}***${local.slice(-1)}@${domain}`;
}
