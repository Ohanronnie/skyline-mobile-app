import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

/**
 * Validates a phone number.
 * If no country code is provided (e.g., +233), it defaults to Ghana (GH).
 * Returns the formatted E.164 number if valid, or null if invalid.
 */
export const validateAndFormatPhoneNumber = (
  phone: string,
  defaultCountry: CountryCode = 'GH'
): string | null => {
  if (!phone) return null;

  // Clean the phone number of spaces, dashes, etc.
  const cleanedPhone = phone.trim();

  // Try parsing with the default country
  const phoneNumber = parsePhoneNumberFromString(cleanedPhone, defaultCountry);

  if (phoneNumber && phoneNumber.isValid()) {
    return phoneNumber.format('E.164');
  }

  return null;
};
