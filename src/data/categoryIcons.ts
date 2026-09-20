/* The icons a category can wear. Named so the choice survives in the Sheet and in a
 * backup; the components are listed here (not imported by name) so the bundler can still
 * drop the rest of react-icons.
 */
import type { IconType } from "react-icons";
import {
  FiActivity, FiBookOpen, FiBriefcase, FiCoffee, FiCreditCard, FiDroplet, FiFilm, FiGift,
  FiHeart, FiHome, FiMoreHorizontal, FiMusic, FiNavigation, FiPhone, FiScissors, FiShoppingBag,
  FiShoppingCart, FiSmartphone, FiSun, FiTag, FiTool, FiTruck, FiUmbrella, FiZap,
} from "react-icons/fi";

export const CATEGORY_ICONS: Record<string, IconType> = {
  coffee: FiCoffee,
  cart: FiShoppingCart,
  bag: FiShoppingBag,
  truck: FiTruck,
  navigation: FiNavigation,
  home: FiHome,
  zap: FiZap,
  droplet: FiDroplet,
  heart: FiHeart,
  activity: FiActivity,
  film: FiFilm,
  music: FiMusic,
  gift: FiGift,
  book: FiBookOpen,
  briefcase: FiBriefcase,
  phone: FiPhone,
  smartphone: FiSmartphone,
  card: FiCreditCard,
  scissors: FiScissors,
  tool: FiTool,
  umbrella: FiUmbrella,
  sun: FiSun,
  tag: FiTag,
  more: FiMoreHorizontal,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);
export const DEFAULT_CATEGORY_ICON = "tag";

/** An icon saved by a newer version (or hand-edited in the Sheet) falls back to the default. */
export function categoryIcon(name: string): IconType {
  return CATEGORY_ICONS[name] ?? CATEGORY_ICONS[DEFAULT_CATEGORY_ICON];
}
