import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board/board-header";
import { KanbanList } from "@/components/board/kanban-list";

// Mock data — sera substituido por dados reais do banco na proxima etapa
const MOCK_LISTS = [
  {
    id: "list-1",
    title: "Hoje",
    cards: [
      { id: "card-1", title: "Card Modelo" },
      { id: "card-2", title: "Revisar documentacao do projeto" },
      { id: "card-3", title: "Corrigir bug no formulario de login" },
    ],
  },
  {
    id: "list-2",
    title: "Esta semana",
    cards: [
      { id: "card-4", title: "Criar tela de configuracoes" },
      { id: "card-5", title: "Implementar notificacoes por email" },
    ],
  },
  {
    id: "list-3",
    title: "Mais tarde",
    cards: [
      { id: "card-6", title: "Adicionar modo escuro nas configuracoes" },
      { id: "card-7", title: "Melhorar performance do dashboard" },
      { id: "card-8", title: "Escrever testes automatizados" },
      { id: "card-9", title: "Integrar com API externa de pagamentos" },
    ],
  },
];

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await params; // consome o param (sera usado quando plugar no banco)

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-600 via-violet-500 to-pink-400">
      {/* Board Header */}
      <BoardHeader
        title="Quadro de Teste"
        workspaceId="mock"
        workspaceName="Meu Workspace"
      />

      {/* Kanban Canvas — scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex items-start gap-4 h-full">
          {/* Listas */}
          {MOCK_LISTS.map((list) => (
            <KanbanList
              key={list.id}
              id={list.id}
              title={list.title}
              cards={list.cards}
            />
          ))}

          {/* Botao adicionar outra lista */}
          <button className="w-72 shrink-0 h-12 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white/80 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Adicionar outra lista
          </button>
        </div>
      </div>
    </div>
  );
}
