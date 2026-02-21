import { redirect } from "next/navigation";

/**
 * /merchant → redirect to the unified dashboard which renders
 * MerchantDashboard when the user's role is "merchant".
 */
export default function MerchantPage() {
  redirect("/dashboard");
}
