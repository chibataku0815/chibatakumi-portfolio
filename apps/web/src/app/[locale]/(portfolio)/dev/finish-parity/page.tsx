// Dev-only parity harness route (hop-2 of the WGSL finish proof chain).
// Hard-gated out of production builds: the gate runs locally (or in e2e) only.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import FinishParityClient from "./client";

export default async function FinishParityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  return <FinishParityClient />;
}
