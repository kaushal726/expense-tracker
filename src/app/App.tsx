import { useEffect } from "react";
import { onStorageError, useStoreReady } from "../data/store";
import { AddScreen } from "../features/add/AddScreen";
import { HistoryScreen } from "../features/history/HistoryScreen";
import { InsightsScreen } from "../features/insights/InsightsScreen";
import { MoreRoutes } from "../features/more/MoreRoutes";
import { Skeleton } from "../ui/feedback";
import { useToast } from "../ui/Toast";
import { ConnectScreen } from "./ConnectScreen";
import { tabForPath } from "./navItems";
import { SideNav, TabBar } from "./Navigation";
import { useRoute, type Route } from "./router";
import { useScrollToTopOnNavigate } from "./scroll";
import { UpdatePrompt } from "./UpdatePrompt";
import styles from "./shell.module.css";

function Screen({ route }: { route: Route }) {
  const [section, page] = route.path;
  switch (section) {
    case "history":
      return <HistoryScreen route={route} />;
    case "insights":
      return <InsightsScreen route={route} />;
    case "more":
      return <MoreRoutes page={page} />;
    case "connect":
      return <ConnectScreen query={route.query} />;
    default:
      return <AddScreen />;
  }
}

function BootSkeleton() {
  return (
    <div className={styles.boot} aria-busy="true" aria-label="Loading">
      <Skeleton height={34} width="45%" />
      <Skeleton height={96} />
      <Skeleton height={52} />
      <Skeleton height={220} />
    </div>
  );
}

export function App() {
  const ready = useStoreReady();
  const route = useRoute();
  const toast = useToast();
  const tab = tabForPath(route.path[0]);
  useScrollToTopOnNavigate(route.path.join("/"));

  useEffect(() => onStorageError(() => toast("Couldn't save on this device. Free up some space and try again.", { tone: "error" })), [toast]);

  return (
    <>
      <SideNav active={tab} />
      <main className={styles.main}>
        <div className={styles.content}>{ready ? <Screen route={route} /> : <BootSkeleton />}</div>
      </main>
      <TabBar active={tab} />
      <UpdatePrompt />
    </>
  );
}
