import RegisterForm from "./register-form";
import { createAdminAccount } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;
  return (
    <RegisterForm
      error={params?.error}
      registered={params?.registered}
      createAdminAccount={createAdminAccount}
    />
  );
}
