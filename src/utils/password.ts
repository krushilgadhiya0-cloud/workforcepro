export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  requirements: PasswordRequirement[];
  isValid: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    { id: 'length', label: 'More than 8 characters (Min 9)', met: password.length >= 9 },
    { id: 'uppercase', label: 'At least one capital letter', met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { id: 'number', label: 'One number', met: /[0-9]/.test(password) },
    { id: 'symbol', label: 'At least one special character (@#$!)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  
  let score = 0;
  if (password.length > 0) {
    if (metCount <= 2) score = 1;
    else if (metCount <= 3) score = 2;
    else if (metCount <= 4) score = 3;
    else score = 4;
  }

  const labels: Record<number, PasswordStrength['label']> = {
    0: 'Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong'
  };

  const colors: Record<number, string> = {
    0: 'bg-red-500',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500'
  };

  return {
    score,
    label: labels[score],
    color: colors[score],
    requirements,
    isValid: metCount === requirements.length
  };
}
