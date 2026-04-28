import { setRequestLocale } from "next-intl/server";
import WordmarkExperimentClient from "./client";

export default async function WordmarkExperimentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WordmarkExperimentClient />;
}
