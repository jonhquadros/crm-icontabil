/**
 * Phone Number Normalization and Formatting Utilities for anti-ban & campaigns
 */

export interface PhoneValidationResult {
  normalized: string;
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes a Brazilian or international phone number to 55 + DDD + Number (digits only).
 * Handles:
 * - (11) 99999-8888 -> 5511999998888
 * - 11999998888 -> 5511999998888
 * - 011999998888 -> 5511999998888
 * - +55 (11) 99999-8888 -> 5511999998888
 */
export function normalizePhone(rawPhone: string | number | null | undefined): PhoneValidationResult {
  if (!rawPhone) {
    return { normalized: '', isValid: false, error: 'Telefone ausente' };
  }

  let digits = String(rawPhone).trim().replace(/\D/g, '');

  if (!digits) {
    return { normalized: '', isValid: false, error: 'Telefone inválido (sem dígitos)' };
  }

  // Remove leading zeros if present (e.g. 011999998888)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If already starts with country code 55
  if (digits.startsWith('55')) {
    if (digits.length === 12 || digits.length === 13) {
      return { normalized: digits, isValid: true };
    }
    if (digits.length < 12) {
      return { normalized: digits, isValid: false, error: 'Número com poucos dígitos (mínimo 12 com DDI)' };
    }
    if (digits.length > 13) {
      return { normalized: digits, isValid: false, error: 'Número com muitos dígitos (máximo 13 com DDI)' };
    }
  }

  // If standard Brazilian number with 10 or 11 digits (DDD + phone)
  if (digits.length === 10 || digits.length === 11) {
    const ddd = parseInt(digits.substring(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      return { normalized: `55${digits}`, isValid: true };
    } else {
      return { normalized: digits, isValid: false, error: 'DDD inválido' };
    }
  }

  // Generic international fallback (between 10 and 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return { normalized: digits, isValid: true };
  }

  return { normalized: digits, isValid: false, error: 'Telefone fora do padrão (digite DDD + Número)' };
}

/**
 * Formats a normalized phone number for human-readable display.
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 13 && digits.startsWith('55')) {
    // +55 (XX) 9XXXX-XXXX
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    // +55 (XX) XXXX-XXXX
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 11) {
    // (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    // (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
