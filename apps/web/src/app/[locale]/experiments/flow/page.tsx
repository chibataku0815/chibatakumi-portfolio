"use client";

import dynamic from "next/dynamic";

const ExperimentsFlowClient = dynamic(() => import("./client"), { ssr: false });

export default function ExperimentsFlowPage() {
  return <ExperimentsFlowClient />;
}
