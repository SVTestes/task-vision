"use client";

interface KanbanCardProps {
  id: string;
  title: string;
}

export function KanbanCard({ title }: KanbanCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors group">
      <p className="text-sm text-gray-800 leading-snug">{title}</p>
    </div>
  );
}
