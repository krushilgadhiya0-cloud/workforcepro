import { useCallback, useState } from 'react';
import { checkEmailFormat, verifyEmailDeliverability } from '../utils/email';

export function useEmailValidation() {
  const [emailError, setEmailError] = useState('');
  const [checking, setChecking] = useState(false);

  const clearEmailError = useCallback(() => setEmailError(''), []);

  const validateEmail = useCallback(async (email: string, options?: { checkDeliverability?: boolean }) => {
    const format = checkEmailFormat(email);
    if (!format.valid) {
      const message = format.message || 'Invalid email address';
      setEmailError(message);
      return { valid: false, message };
    }

    if (!options?.checkDeliverability) {
      setEmailError('');
      return { valid: true, message: '' };
    }

    setChecking(true);
    try {
      const result = await verifyEmailDeliverability(email);
      if (!result.valid) {
        const message = result.message || 'Invalid email address';
        setEmailError(message);
        return { valid: false, message };
      }
      setEmailError('');
      return { valid: true, message: '' };
    } finally {
      setChecking(false);
    }
  }, []);

  return { emailError, checking, validateEmail, clearEmailError, setEmailError };
}
