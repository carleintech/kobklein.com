import { redirect } from "next/navigation";

/**
 * /merchant -> redirect to the merchant-owned dashboard.
 */
export default function MerchantPage() {
  redirect("/merchant/dashboard");
}
