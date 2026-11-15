import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { creditStatusLabel } from "@/lib/validations/credit";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/format";
import type { CreditListItem, CreditStatus } from "@/types/credit";

const statusTone: Record<
  CreditStatus,
  "success" | "warning" | "danger" | "default" | "info"
> = {
  open: "warning",
  partial: "info",
  paid: "success",
  voided: "default",
};

type CreditsTableProps = {
  items: CreditListItem[];
};

export function CreditsTable({ items }: CreditsTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No utang records"
        description="Create a credit entry when a customer buys on utang."
        action={
          <Link
            href="/credits/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Create credit
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Customer</TH>
          <TH>Status</TH>
          <TH>Due</TH>
          <TH>Amount</TH>
          <TH>Balance</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((credit) => (
          <TR key={credit.id}>
            <TD>
              <Link
                href={`/credits/${credit.id}`}
                className="font-medium text-navy hover:text-primary hover:underline"
              >
                {credit.customerName}
              </Link>
              <p className="mt-0.5 text-xs text-secondary">
                {credit.customerContact ?? "No contact"}
                {credit.saleReceiptNumber
                  ? ` · ${credit.saleReceiptNumber}`
                  : ""}
              </p>
            </TD>
            <TD>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={statusTone[credit.status]}>
                  {creditStatusLabel(credit.status)}
                </Badge>
                {credit.isOverdue ? (
                  <Badge tone="danger">Overdue</Badge>
                ) : null}
              </div>
            </TD>
            <TD>
              {credit.dueDate ? formatDate(credit.dueDate) : "—"}
            </TD>
            <TD>{formatCurrency(credit.amount)}</TD>
            <TD className="font-medium text-navy">
              {formatCurrency(credit.balance)}
            </TD>
            <TD>
              <div className="flex justify-end">
                <Link
                  href={`/credits/${credit.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`View credit for ${credit.customerName}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
