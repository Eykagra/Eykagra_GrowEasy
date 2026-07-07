const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  GOOD_LEAD_FOLLOW_UP: {
    label: "Good Lead",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800",
  },
  DID_NOT_CONNECT: {
    label: "Not Dialed",
    className:
      "bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
  },
  BAD_LEAD: {
    label: "Bad Lead",
    className:
      "bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800",
  },
  SALE_DONE: {
    label: "Sale Done",
    className:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800",
  },
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status];

  if (!style) {
    return status ? (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
        {status}
      </span>
    ) : (
      <span className="text-[var(--text-muted)]">—</span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${style.className}`}
    >
      {style.label}
    </span>
  );
}