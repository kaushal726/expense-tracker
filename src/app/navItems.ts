import type { IconType } from "react-icons";
import { FiBarChart2, FiList, FiMoreHorizontal, FiPlusCircle } from "react-icons/fi";

export type TabId = "add" | "history" | "insights" | "more";

/** `path` is the first URL segment; Add is the home screen, so its path is empty. */
export const NAV_ITEMS: { id: TabId; path: string; label: string; icon: IconType }[] = [
  { id: "add", path: "", label: "Add", icon: FiPlusCircle },
  { id: "history", path: "history", label: "History", icon: FiList },
  { id: "insights", path: "insights", label: "Insights", icon: FiBarChart2 },
  { id: "more", path: "more", label: "More", icon: FiMoreHorizontal },
];

export function tabForPath(segment: string | undefined): TabId {
  return NAV_ITEMS.find((n) => n.path === (segment ?? ""))?.id ?? "add";
}
