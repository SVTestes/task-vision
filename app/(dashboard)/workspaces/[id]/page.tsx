import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getGradientByName } from "@/lib/workspace-gradients";
import Link from "next/link";

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
            select: { id: true, name: true, email: true },
          },
        },
      },
      owner: {
        select: { id: true, name: true, email: true },
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

      {/* Header do Workspace */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        {/* Fundo com gradiente */}
        <div
          className="absolute inset-0"
          style={{ background: gradient.css }}
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Conteudo */}
        <div className="relative z-10 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="text-white/70 text-sm max-w-2xl mb-4">
              {workspace.description}
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
              {workspace._count.boards} board
              {workspace._count.boards !== 1 ? "s" : ""}
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
              {workspace._count.members} membro
              {workspace._count.members !== 1 ? "s" : ""}
            </span>
            <span className="text-white/40">•</span>
            <span>
              Criado por{" "}
              <span className="text-white/80">{workspace.owner.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Secao de Boards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Boards</h2>
          {/* Botao de criar board sera adicionado na Fase 3 Etapa 2 */}
        </div>

        {workspace.boards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspace.boards.map((board) => (
              <div
                key={board.id}
                className="group relative block h-[100px] rounded-xl overflow-hidden shadow-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-xl hover:border-white/20"
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
              </div>
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

      {/* Secao de Membros */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Membros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workspace.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-medium text-white shrink-0">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {member.user.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {member.role === "OWNER" ? "Dono" : member.role === "ADMIN" ? "Admin" : "Membro"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
