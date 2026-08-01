import type { Metadata } from "next";
import { CapTool } from "@/tools/cap/CapTool";
import { meta } from "@/tools/cap/content";

export const metadata: Metadata = {
  title: `${meta.name} — doctools`,
  description: meta.targets,
};

export default function CapPage() {
  return <CapTool />;
}
