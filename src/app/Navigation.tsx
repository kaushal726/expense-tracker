import { cx } from "../lib/cx";
import { APP_NAME, APP_TAGLINE } from "./brand";
import { NAV_ITEMS, type TabId } from "./navItems";
import { href } from "./router";
import { SyncBadge } from "./SyncBadge";
import styles from "./shell.module.css";

export function TabBar({ active }: { active: TabId }) {
  return (
    <nav className={cx(styles.tabbar, "mobile-only")} aria-label="Main">
      {NAV_ITEMS.map(({ id, path, label, icon: Icon }) => (
        <a key={id} href={href(path)} className={styles.tab} aria-current={id === active ? "page" : undefined}>
          <span className={styles.navIcon}><Icon aria-hidden /></span>
          {label}
        </a>
      ))}
    </nav>
  );
}

export function SideNav({ active }: { active: TabId }) {
  return (
    <nav className={cx(styles.sidenav, "desktop-only")} aria-label="Main">
      <div className={styles.brand}>
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={32} height={32} />
        <span className={styles.brandText}>
          {APP_NAME}
          <small>{APP_TAGLINE}</small>
        </span>
      </div>
      {NAV_ITEMS.map(({ id, path, label, icon: Icon }) => (
        <a key={id} href={href(path)} className={styles.sideItem} aria-current={id === active ? "page" : undefined}>
          <span className={styles.navIcon}><Icon aria-hidden /></span>
          {label}
        </a>
      ))}
      <div className={styles.sideFoot}><SyncBadge /></div>
    </nav>
  );
}
