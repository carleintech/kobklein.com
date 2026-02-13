import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DataTable({
  columns,
  rows,
  emptyMessage = "No data",
}: {
  columns: { key: string; label: string; className?: string; render?: (row: any) => ReactNode }[];
  rows: any[];
  emptyMessage?: string;
}) {
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[var(--text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 whitespace-nowrap", col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
