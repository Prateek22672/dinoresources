/** Format paise (integer) as a ₹ price string, e.g. 1100 -> "₹11". */
export function formatPaise(paise: number | null | undefined): string {
  if (paise == null) return "—";
  const rupees = paise / 100;
  // Show decimals only when not a whole number
  return Number.isInteger(rupees) ? `₹${rupees}` : `₹${rupees.toFixed(2)}`;
}
