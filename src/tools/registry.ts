import type { ToolMeta } from "@/lib/content";
import { meta as capMeta } from "./cap/content";

/**
 * Every tool answers one question: which documented error does it
 * correct? A tool that cannot answer it does not belong here.
 */
export const tools: ToolMeta[] = [capMeta];
