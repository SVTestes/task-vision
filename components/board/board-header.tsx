"use client";

import Link from "next/link";

interface BoardHeaderProps {
  title: string;
  workspaceId: string;
  workspaceName: string;
}

export function BoardHeader({
  title,
  workspaceId,
  workspaceName,
}: BoardHeaderProps) {
  return (
    <div className="h-12 shrink-0 flex items-center px-4 gap-3 bg-black/20 backdrop-blur-sm">
      {/* Breadcrumb */}
      <Link
        href={`/workspaces/${workspaceId}`}
        className="text-sm text-white/60 hover:text-white/90 transition-colors truncate max-w-[200px]"
      >
        {workspaceName}
      </Link>
      <svg
        className="w-3.5 h-3.5 text-white/40 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>

      {/* Titulo do board */}
      <h1 className="text-base font-bold text-white truncate">{title}</h1>
    </div>
  );
}
