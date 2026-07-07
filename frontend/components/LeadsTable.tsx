"use client";

import type { CrmRecord } from "@/types/crm";
import StatusBadge from "./StatusBadge";

interface Props {
  records: CrmRecord[];
}

function formatContact(record: CrmRecord): string {
  const code = record.country_code.trim();
  const mobile = record.mobile_without_country_code.trim();
  if (!mobile) return "—";
  return `${code}${mobile}`;
}

function formatDate(value: string): string {
  if (!value.trim()) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function LeadsTable({ records }: Props) {
  return (
    <div className="leads-card">
      <div className="leads-card-header">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Imported records</h2>
        <p className="text-xs text-[var(--text-muted)]">
          {records.length} imported record{records.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="table-container leads-table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Date Created</th>
              <th>Company</th>
              <th>Status</th>
              <th>Source</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, i) => (
              <tr key={i}>
                <td className="font-medium">{record.name || "—"}</td>
                <td className="max-w-[180px] truncate" title={record.email}>
                  {record.email || "—"}
                </td>
                <td>{formatContact(record)}</td>
                <td className="whitespace-nowrap text-[var(--text-secondary)]">
                  {formatDate(record.created_at)}
                </td>
                <td>{record.company || "—"}</td>
                <td>
                  <StatusBadge status={record.crm_status} />
                </td>
                <td className="text-[var(--text-secondary)]">
                  {record.data_source || "—"}
                </td>
                <td className="text-[var(--text-secondary)]">{record.city || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}