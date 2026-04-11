"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BoardHeader } from "./board-header";
import { KanbanList } from "./kanban-list";
import { KanbanCard } from "./kanban-card";
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
  initialCardId?: string;
}

// ─── Helpers de posição ────────────────────────────────────────────────
/** Calcula a posição de um card que acabou de ser inserido num índice específico. */
function calcPosition(items: CardData[], toIndex: number, movedId: string): number {
  // Remove o próprio item para calcular adjacentes correctamente
  const others = items.filter((c) => c.id !== movedId);
  const prev = others[toIndex - 1];
  const next = others[toIndex];

  if (!prev && !next) return 1000;
  if (!prev) return (next.position ?? 1000) / 2;
  if (!next) return (prev.position ?? 1000) + 1000;
  return ((prev.position ?? 0) + (next.position ?? 0)) / 2;
}

export function BoardClient({ board, userName, initialCardId }: BoardClientProps) {
  const router = useRouter();
  const [lists, setLists] = useState<ListData[]>(board.lists);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  // Card detail modal state
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedListTitle, setSelectedListTitle] = useState("");

  // Drag state — card que está a ser arrastado agora
  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  // =======================================================================
  // DnD sensors: PointerSensor com distância mínima de 8px para evitar
  // conflito com o onClick do card (clique rápido vs arrasto intencional)
  // =======================================================================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Deep-linking: Abre o card caso o ID esteja na URL
  useEffect(() => {
    if (initialCardId && lists.length > 0 && !selectedCard) {
      for (const list of lists) {
        const card = list.cards.find((c) => c.id === initialCardId);
        if (card) {
          setSelectedCard(card);
          setSelectedListTitle(list.title);
          break;
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCardId, lists]);

  // ─── DnD Handlers ────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    // Encontra o card ativo em qualquer lista
    for (const list of lists) {
      const found = list.cards.find((c) => c.id === active.id);
      if (found) {
        setActiveCard(found);
        break;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Descobre a lista de origem do card arrastado
    const fromList = lists.find((l) => l.cards.some((c) => c.id === activeId));
    if (!fromList) return;

    // Destino pode ser um card OU uma lista (droppable vazio)
    const toList = lists.find(
      (l) => l.id === overId || l.cards.some((c) => c.id === overId)
    );
    if (!toList || fromList.id === toList.id) return;

    // Move o card entre listas (update otimista de UI)
    setLists((prev) => {
      const card = fromList.cards.find((c) => c.id === activeId)!;
      const overIndex = toList.cards.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toList.cards.length;

      return prev.map((l) => {
        if (l.id === fromList.id) {
          return { ...l, cards: l.cards.filter((c) => c.id !== activeId) };
        }
        if (l.id === toList.id) {
          const newCards = [...l.cards];
          newCards.splice(insertAt, 0, { ...card, listId: toList.id });
          return { ...l, cards: newCards };
        }
        return l;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setLists((prev) => {
      // Encontra a lista que agora contém o card ativo (após o handleDragOver)
      const currentList = prev.find((l) => l.cards.some((c) => c.id === activeId));
      if (!currentList) return prev;

      const oldIndex = currentList.cards.findIndex((c) => c.id === activeId);
      // overId pode ser o id de um card irmão ou o id da própria lista
      const newIndex = currentList.cards.findIndex((c) => c.id === overId);

      if (newIndex === -1) return prev; // dropped numa lista vazia — já está lá

      const reordered = arrayMove(currentList.cards, oldIndex, newIndex);
      const newPos = calcPosition(currentList.cards, newIndex, activeId);

      // Persiste no backend (fire-and-forget)
      fetch(`/api/cards/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: currentList.id, position: newPos }),
      }).catch(() => {/* silently ignore */});

      return prev.map((l) =>
        l.id === currentList.id ? { ...l, cards: reordered } : l
      );
    });
  }

  // ─── Handlers normais ────────────────────────────────────────────────
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

  function handleUpdateListTitle(listId: string, newTitle: string) {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, title: newTitle } : list
      )
    );
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
      <BoardHeader title={board.title} boardId={board.id} />

      {/* Kanban Canvas — scroll horizontal */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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
                onUpdateTitle={(newTitle) => handleUpdateListTitle(list.id, newTitle)}
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

        {/* DragOverlay — o card "fantasma" que voa pela tela durante o arrasto */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}>
          {activeCard ? (
            <div className="w-64 bg-white rounded-lg shadow-2xl border border-violet-400 px-3 py-2.5 rotate-[2deg] scale-105 opacity-95 pointer-events-none">
              <p className="text-sm text-gray-800 leading-snug font-medium">{activeCard.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          listTitle={selectedListTitle}
          userName={userName}
          boardId={board.id}
          workspaceId={board.workspaceId}
          onClose={() => {
            setSelectedCard(null);
            router.replace(`/boards/${board.id}`, { scroll: false });
          }}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
