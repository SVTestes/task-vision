import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getGradientByName } from "@/lib/workspace-gradients";
import Link from "next/link";
import { CreateBoardModal } from "@/components/create-board-modal";
import { WorkspaceMembers } from "@/components/workspace-members";
import { WorkspaceHeader } from "@/components/workspace-header";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      boards: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          background: true,
          createdAt: true,
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { boards: true, members: true },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  // Verifica se o usuario tem acesso
  const isOwner = workspace.ownerId === user.id;
  const isMember = workspace.members.some((m) => m.userId === user.id);
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isMember && !isAdmin) {
    notFound();
  }

  const gradient = workspace.backgroundGradient
    ? getGradientByName(workspace.backgroundGradient)
    : getGradientByName("ocean-dive");

  // Serializa membros para o client component
  const serializedMembers = workspace.members.map((m) => ({
    id: m.id,
    role: m.role,
    user: m.user,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-white transition-colors">
          Workspaces
        </Link>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span className="text-white font-medium">{workspace.name}</span>
      </div>

      {/* Header do Workspace — Client Component editavel */}
      <WorkspaceHeader
        workspaceId={id}
        name={workspace.name}
        description={workspace.description}
        gradient={gradient.css}
        boardCount={workspace._count.boards}
        memberCount={workspace._count.members}
        ownerName={workspace.owner.name}
      />

      {/* Secao de Boards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Boards</h2>
          <CreateBoardModal workspaceId={id} />
        </div>

        {workspace.boards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspace.boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="group relative block h-[100px] rounded-xl overflow-hidden shadow-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-xl hover:border-white/20 cursor-pointer"
              >
                <div className="h-full flex flex-col justify-between p-4">
                  <h3 className="text-base font-semibold text-white leading-tight line-clamp-2">
                    {board.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Criado em{" "}
                    {new Date(board.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state para boards */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum board ainda
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Boards sao quadros kanban onde voce organiza suas tarefas em
              listas e cards.
            </p>
            <p className="text-xs text-slate-500">
              A criacao de boards sera adicionada na proxima etapa.
            </p>
          </div>
        )}
      </div>

      {/* Secao de Membros — Client Component */}
      <WorkspaceMembers
        workspaceId={id}
        members={serializedMembers}
        ownerId={workspace.ownerId}
      />
    </div>
  );
}

