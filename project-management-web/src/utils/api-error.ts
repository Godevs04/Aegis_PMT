/**
 * Extract a user-facing message from an Axios-style API error.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string } } }).response
      ?.data?.message;
    if (message) return message;
  }
  return fallback;
}
