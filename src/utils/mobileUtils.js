export function formatMobileNumber(number) {
    if (!number) return null;
    const cleaned = number.replace(/\D/g, '');
    return cleaned.startsWith('8') ? `+65${cleaned}` : cleaned;
  }