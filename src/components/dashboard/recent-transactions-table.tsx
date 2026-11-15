import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/format";
import type { TransactionRow } from "@/types/dashboard";

const statusTone = {
  Completed: "success",
  Voided: "warning",
  Refunded: "danger",
} as const;

type RecentTransactionsTableProps = {
  transactions: TransactionRow[];
};

export function RecentTransactionsTable({
  transactions,
}: RecentTransactionsTableProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest sales for the selected period.
          </CardDescription>
        </div>
        <Link
          href="/sales"
          className="text-sm font-medium text-primary transition-colors hover:text-navy"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Completed sales will appear here once checkout starts."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Receipt</TH>
                <TH>Customer</TH>
                <TH>Payment</TH>
                <TH>Total</TH>
                <TH>Status</TH>
                <TH>Time</TH>
              </TR>
            </THead>
            <TBody>
              {transactions.map((txn) => (
                <TR key={txn.id}>
                  <TD className="font-medium text-navy">
                    <Link
                      href={`/sales/${txn.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {txn.receiptNumber}
                    </Link>
                  </TD>
                  <TD>
                    <div>
                      <p className="font-medium text-navy">{txn.customer}</p>
                      <p className="text-xs text-secondary">{txn.cashier}</p>
                    </div>
                  </TD>
                  <TD>{txn.paymentMethod}</TD>
                  <TD className="font-medium text-navy">
                    {formatCurrency(txn.total)}
                  </TD>
                  <TD>
                    <Badge tone={statusTone[txn.status]}>{txn.status}</Badge>
                  </TD>
                  <TD>{formatDateTime(txn.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
