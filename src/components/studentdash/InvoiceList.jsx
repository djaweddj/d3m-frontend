import { Wallet } from "lucide-react";
import DashCard from "../dash/DashCard";
import { EmptyState } from "../home/ui";
import AmountStatus from "./AmountStatus";
import ListRow from "./ListRow";
import { STATUS_ACCENT } from "./studentUtils";

// Shared by the sessions page (module invoices) and the courses page (course invoices).
// name(inv) -> string, info(inv) -> meta array for ListRow
export default function InvoiceList({ invoices, title, emptyText, name, info }) {
  return (
    <DashCard title={title}>
      {invoices.length === 0 ? (
        <EmptyState icon={Wallet} title={emptyText} />
      ) : (
        <ul className="space-y-2">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <ListRow
                accent={STATUS_ACCENT[inv.status] ?? "gold"}
                title={name(inv)}
                meta={info(inv)}
                trailing={<AmountStatus amount={inv.amount ?? null} kind="invoice" status={inv.status} />}
              />
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  );
}
