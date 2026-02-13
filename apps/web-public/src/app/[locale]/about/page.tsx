import { getDictionary, type Locale } from "@/i18n";
import { MissionSection } from "@/components/sections/mission";
import { CtaSection } from "@/components/sections/cta";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <MissionSection dict={dict} />
      <CtaSection dict={dict} />
    </>
  );
}
