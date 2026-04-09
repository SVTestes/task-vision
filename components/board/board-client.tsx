"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BoardHeader } from "./board-header";
import { KanbanList } from "./kanban-list";
import { CardDetailModal } from "./card-detail-modal";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  position: number;
  listId: string;
  dueDate: string | null;
  isDueCompleted: boolean;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListData {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  cards: CardData[];
}

interface BoardData {
  id: string;
  title: string;
  background: string | null;
  workspaceId: string;
  workspace: {
    id: string;
    name: string;
    ownerId: string;
  };
  lists: ListData[];
}

interface BoardClientProps {
  board: BoardData;
  userName: string;
}

export function BoardClient({ board, userName }: BoardClientProps) {
  const router = useRouter();
  const [lists, setLists] = useState<ListData[]>(board.lists);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  // Card detail modal state
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedListTitle, setSelectedListTitle] = useState("");

  async function handleCreateList() {
    if (!newListTitle.trim() || creatingList) return;
    setCreatingList(true);

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newListTitle.trim(),
          boardId: board.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLists((prev) => [...prev, data.list]);
        setNewListTitle("");
        setAddingList(false);
      }
    } catch {
      // silently fail
    } finally {
      setCreatingList(false);
    }
  }

  async function handleCreateCard(listId: string, title: string) {
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, listId }),
      });

      const data = await res.json();
      if (res.ok) {
        setLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? { ...list, cards: [...list.cards, data.card] }
              : list
          )
        );
      }
    } catch {
      // silently fail
    }
  }

  function handleCardClick(card: CardData, listTitle: string) {
    setSelectedCard(card);
    setSelectedListTitle(listTitle);
  }

  function handleCardUpdate(updatedCard: CardData) {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: list.cards.map((c) =>
          c.id === updatedCard.id ? updatedCard : c
        ),
      }))
    );
    setSelectedCard(updatedCard);
  }

  function handleCardDelete(cardId: string) {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: list.cards.filter((c) => c.id !== cardId),
      }))
    );
    setSelectedCard(null);
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-600 via-violet-500 to-pink-400">
      {/* Board Header */}
      <BoardHeader title={board.title} />

      {/* Kanban Canvas — scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex items-start gap-4 h-full">
          {/* Listas */}
          {lists.map((list) => (
            <KanbanList
              key={list.id}
              id={list.id}
              title={list.title}
              cards={list.cards}
              onCreateCard={(title) => handleCreateCard(list.id, title)}
              onCardClick={(card) => handleCardClick(card, list.title)}
            />
          ))}

          {/* Botao / Input adicionar outra lista */}
          {addingList ? (
            <div className="w-72 shrink-0 bg-slate-100 rounded-2xl p-3 shadow-md">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Insira o titulo da lista..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none text-gray-800"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateList();
                  if (e.key === "Escape") {
                    setAddingList(false);
                    setNewListTitle("");
                  }
                }}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCreateList}
                  disabled={creatingList || !newListTitle.trim()}
                  className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creatingList ? "Criando..." : "Adicionar lista"}
                </button>
                <button
                  onClick={() => {
                    setAddingList(false);
                    setNewListTitle("");
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="w-72 shrink-0 h-12 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white/80 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.97]"
            >
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
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          listTitle={selectedListTitle}
          userName={userName}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
