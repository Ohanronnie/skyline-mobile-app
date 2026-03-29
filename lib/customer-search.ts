import type { Customer } from "@/lib/api";

/** Match name, email, or phone (including digit-only search across spaces/symbols). */
export function customerMatchesSearchQuery(
  customer: Pick<Customer, "name" | "email" | "phone">,
  searchQuery: string,
): boolean {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;

  if (customer.name.toLowerCase().includes(q)) return true;
  if (customer.email?.toLowerCase().includes(q)) return true;
  if (customer.phone?.toLowerCase().includes(q)) return true;

  const qDigits = searchQuery.replace(/\D/g, "");
  if (qDigits.length > 0 && customer.phone) {
    const phoneDigits = customer.phone.replace(/\D/g, "");
    if (phoneDigits.includes(qDigits)) return true;
  }

  return false;
}
