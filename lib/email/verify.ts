import { resolveMx } from 'node:dns/promises';
import { checkEmailFormat, normalizeEmail } from './format.js';

export interface EmailVerifyResult {
  valid: boolean;
  normalized: string;
  message?: string;
  suggestion?: string;
  mxRecords?: number;
}

export async function verifyEmailAddress(email: string): Promise<EmailVerifyResult> {
  const format = checkEmailFormat(email);
  if (!format.valid) {
    return {
      valid: false,
      normalized: format.normalized,
      message: format.message,
      suggestion: format.suggestion,
    };
  }

  const domain = format.normalized.split('@')[1];
  try {
    const mx = await resolveMx(domain);
    if (mx.length === 0) {
      return {
        valid: false,
        normalized: format.normalized,
        message: 'This email domain cannot receive mail. Check for typos or use another email.',
      };
    }
    return {
      valid: true,
      normalized: format.normalized,
      mxRecords: mx.length,
    };
  } catch {
    return {
      valid: false,
      normalized: format.normalized,
      message: 'This email domain does not exist or cannot receive mail. Please use a real email address.',
    };
  }
}

export function verifyEmailAddressSync(email: string): EmailVerifyResult {
  const format = checkEmailFormat(email);
  return {
    valid: format.valid,
    normalized: format.normalized,
    message: format.message,
    suggestion: format.suggestion,
  };
}

export { normalizeEmail, checkEmailFormat };
