export function formatPhoneNumber (number: string): string {
  return number?.replace(/^0([1-9]\d{8})$/, '+33$1')
}
