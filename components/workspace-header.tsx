"use client";

import { useRouter } from "next/navigation";
import { EditableTitle } from "@/components/editable-title";

interface WorkspaceHeaderProps {
  workspaceId: string;
  name: string;
  description?: string | null;
  gradient: string;
  boardCount: number;
  memberCount: number;
  ownerName: string;
}

export function WorkspaceHeader({
  workspaceId,
  name,
  description,
  gradient,
  boardCount,
  memberCount,
  ownerName,
}: WorkspaceHeaderProps) {
  const router = useRouter();

  async function handleSaveName(newName: string) {
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (!res.ok) {
      throw new Error("Falha ao salvar");
    }

    router.refresh();
  }

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8">
      {/* Fundo com gradiente */}
      <div
        className="absolute inset-0"
        style={{ background: gradient }}
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* Conteudo */}
      <div className="relative z-10 p-8">
        <EditableTitle
          value={name}
          onSave={handleSaveName}
          tag="h1"
          className="text-3xl font-bold text-white mb-2"
          inputClassName="text-3xl font-bold text-white w-full max-w-md"
        />
        {description && (
          <p className="text-white/70 text-sm max-w-2xl mb-4">
            {description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z"
              />
            </svg>
            {boardCount} board
            {boardCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            {memberCount} membro
            {memberCount !== 1 ? "s" : ""}
          </span>
          <span className="text-white/40">•</span>
          <span>
            Criado por{" "}
            <span className="text-white/80">{ownerName}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
