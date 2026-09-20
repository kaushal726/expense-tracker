import { BackupScreen } from "./BackupScreen";
import { BudgetScreen } from "./BudgetScreen";
import { CategoriesScreen } from "./CategoriesScreen";
import { MoreScreen } from "./MoreScreen";
import { SyncScreen } from "./SyncScreen";

export function MoreRoutes({ page }: { page?: string }) {
  switch (page) {
    case "categories":
      return <CategoriesScreen />;
    case "budget":
      return <BudgetScreen />;
    case "sync":
      return <SyncScreen />;
    case "backup":
      return <BackupScreen />;
    default:
      return <MoreScreen />;
  }
}
