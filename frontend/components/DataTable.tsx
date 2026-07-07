"use client";

interface Props {
  headers: string[];
  rows: Record<string, string>[];
  maxRows?: number;
}

export default function DataTable({ headers, rows, maxRows }: Props) {
  const displayRows = maxRows ? rows.slice(0, maxRows) : rows;

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-12">#</th>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i}>
              <td className="text-[var(--text-muted)]">{i + 1}</td>
              {headers.map((h) => (
                <td key={h} className="max-w-[200px] truncate" title={row[h]}>
                  {row[h] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}