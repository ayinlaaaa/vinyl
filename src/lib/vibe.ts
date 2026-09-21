/** Listening-hour personality label used by yearly recaps. Hour is 0–23 in the account timezone. */
export function describeVibe(hour: number | null): string {
  if (hour === null) return "Balanced Listener";
  if (hour >= 22 || hour <= 4) return "Night Owl";
  if (hour >= 5 && hour <= 9) return "Early Bird";
  if (hour >= 14 && hour <= 17) return "Afternoon Connoisseur";
  return "Balanced Listener";
}
