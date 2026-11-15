import Link from "next/link";

type InventoryPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | undefined>;
  basePath?: string;
};

function hrefFor(
  page: number,
  searchParams: Record<string, string | undefined>,
  basePath: string,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

const pageLinkClass =
  "inline-flex h-8 items-center justify-center rounded-xl border border-border bg-white px-3 text-xs font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40";

const pageDisabledClass =
  "inline-flex h-8 cursor-not-allowed items-center justify-center rounded-xl border border-border bg-white px-3 text-xs font-medium text-secondary opacity-50";

export function InventoryPagination({
  page,
  totalPages,
  total,
  searchParams,
  basePath = "/inventory",
}: InventoryPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-secondary">
        Page {page} of {totalPages} · {total} items
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1, searchParams, basePath)}
            className={pageLinkClass}
          >
            Previous
          </Link>
        ) : (
          <span className={pageDisabledClass}>Previous</span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1, searchParams, basePath)}
            className={pageLinkClass}
          >
            Next
          </Link>
        ) : (
          <span className={pageDisabledClass}>Next</span>
        )}
      </div>
    </div>
  );
}
