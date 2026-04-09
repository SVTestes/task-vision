"use client";

interface KanbanCardProps {
  id: string;
  title: string;
  hasDescription?: boolean;
  dueDate?: string | null;
  isDueCompleted?: boolean;
  onClick?: () => void;
}

export function KanbanCard({ title, hasDescription, dueDate, isDueCompleted, onClick }: KanbanCardProps) {
  // Due date display helpers
  const hasDue = !!dueDate;
  const dueDateObj = hasDue ? new Date(dueDate) : null;
  const isOverdue = hasDue && !isDueCompleted && dueDateObj && dueDateObj < new Date();
  const formattedDue = dueDateObj
    ? dueDateObj.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    : "";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200/80 px-3 py-2.5 cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-150 group active:scale-[0.98]"
    >
      <p className="text-sm text-gray-800 leading-snug select-none">{title}</p>
      {/* Indicadores visuais */}
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        {hasDescription && (
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        )}
        {hasDue && (
          <span
            className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${
              isDueCompleted
                ? "bg-green-100 text-green-700"
                : isOverdue
                ? "bg-red-100 text-red-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {formattedDue}
            {isDueCompleted && " ✓"}
          </span>
        )}
      </div>
    </div>
  );
}
