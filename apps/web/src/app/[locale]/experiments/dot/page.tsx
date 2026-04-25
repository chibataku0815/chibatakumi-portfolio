"use client";

import dynamic from "next/dynamic";

const ExperimentsDotClient = dynamic(() => import("./client"), { ssr: false });

export default function ExperimentsDotPage() {
  return <ExperimentsDotClient />;
}
