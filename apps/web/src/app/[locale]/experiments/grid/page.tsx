"use client";

import dynamic from "next/dynamic";

const ExperimentsGridClient = dynamic(() => import("./client"), { ssr: false });

export default function ExperimentsGridPage() {
  return <ExperimentsGridClient />;
}
