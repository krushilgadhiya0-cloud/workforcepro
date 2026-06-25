export interface EmailValidationResult {
  valid: boolean;
  normalized: string;
  message?: string;
  suggestion?: string;
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamailblock.com', 'grr.la',
  'temp-mail.org', 'tempmail.com', 'throwaway.email', 'yopmail.com',
  '10minutemail.com', 'sharklasers.com', 'fakeinbox.com', 'trashmail.com',
  'getnada.com', 'maildrop.cc', 'dispostable.com', 'mintemail.com', 'tempail.com',
]);

const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function checkEmailFormat(email: string): EmailValidationResult {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return { valid: false, normalized, message: 'Email is required' };
  }

  if (normalized.length > 254) {
    return { valid: false, normalized, message: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, normalized, message: 'Enter a valid email address (e.g. name@company.com)' };
  }

  const [local, domain] = normalized.split('@');
  if (!local || !domain || local.length > 64) {
    return { valid: false, normalized, message: 'Enter a valid email address' };
  }

  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { valid: false, normalized, message: 'Email address format is invalid' };
  }

  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { valid: false, normalized, message: 'Email domain must include a valid extension (e.g. .com)' };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, normalized, message: 'Temporary or disposable email addresses are not allowed' };
  }

  const typoSuggestion = COMMON_TYPOS[domain];
  if (typoSuggestion) {
    return {
      valid: false,
      normalized,
      message: `Did you mean ${local}@${typoSuggestion}?`,
      suggestion: `${local}@${typoSuggestion}`,
    };
  }

  return { valid: true, normalized };
}

export function assertValidEmailFormat(email: string): string {
  const result = checkEmailFormat(email);
  if (!result.valid) {
    throw new Error(result.message || 'Invalid email address');
  }
  return result.normalized;
}

export async function verifyEmailDeliverability(email: string): Promise<EmailValidationResult> {
  const format = checkEmailFormat(email);
  if (!format.valid) return format;

  try {
    const res = await fetch('/api/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: format.normalized }),
    });
    const data = await res.json() as EmailValidationResult & { error?: string };
    if (data.valid) {
      return { valid: true, normalized: data.normalized || format.normalized };
    }
    return {
      valid: false,
      normalized: format.normalized,
      message: data.message || data.error || 'This email does not look deliverable',
      suggestion: data.suggestion,
    };
  } catch {
    return {
      valid: false,
      normalized: format.normalized,
      message: 'Could not verify email right now. Check your connection and try again.',
    };
  }
}

export async function sendWelcomeEmail(email: string, name: string, password?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
