"use client";

import { useState, useEffect } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./kanban-card";

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

interface KanbanListProps {
  id: string;
  title: string;
  cards: CardData[];
  onCreateCard: (title: string) => void;
  onCardClick: (card: CardData) => void;
  onUpdateTitle: (title: string) => void;
}

// Ícone: setas para dentro (colapsar)
function CollapseIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l-4 4m0 0l4 4m-4-4h8m2-8l4 4m0 0l-4 4m4-4H9" />
    </svg>
  );
}

// Ícone: setas para fora (expandir)
function ExpandIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l4-4m0 0l-4-4m4 4H7m-2 8l-4-4m0 0l4-4m-4 4h12" />
    </svg>
  );
}

export function KanbanList({ id, title, cards, onCreateCard, onCardClick, onUpdateTitle }: KanbanListProps) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  // Title edition state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Sync edit value if title prop changes externally
  useEffect(() => {
    setEditTitleValue(title);
  }, [title]);

  async function handleTitleSubmit() {
    if (!editTitleValue.trim() || editTitleValue.trim() === title) {
      setIsEditingTitle(false);
      setEditTitleValue(title);
      return;
    }

    setIsSavingTitle(true);
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitleValue.trim() })
      });
      if (res.ok) {
        onUpdateTitle(editTitleValue.trim());
      } else {
        setEditTitleValue(title);
      }
    } catch {
      setEditTitleValue(title);
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  }

  // Estado de colapso — começa como null até ser lido do localStorage (evita hydration mismatch)
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);

  // Carrega o estado do localStorage ao montar no cliente
  useEffect(() => {
    const stored = localStorage.getItem(`list-collapsed-${id}`);
    setIsCollapsed(stored === "true");
  }, [id]);

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(`list-collapsed-${id}`, String(next));
      return next;
    });
  }

  function handleSubmit() {
    if (!newCardTitle.trim()) return;
    onCreateCard(newCardTitle.trim());
    setNewCardTitle("");
    setAddingCard(false);
  }

  // Hook do Droppable para a listagem de cards
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });

  // Aguarda o carregamento do estado do localStorage (evita flash)
  if (isCollapsed === null) {
    return <div className="w-72 shrink-0" />;
  }

  // ── Vista COLAPSADA (Trello-like pill) ──────────────────
  if (isCollapsed) {
    return (
      <div
        className="shrink-0 flex flex-col items-center rounded-[20px] shadow-md transition-all duration-300 overflow-hidden"
        style={{
          width: "3.25rem",
          minHeight: "12rem",
          background: "rgba(241,245,249,0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* Botão expandir — topo */}
        <button
          onClick={toggleCollapse}
          title="Expandir lista"
          className="mt-3 mb-1 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer shrink-0"
        >
          <ExpandIcon />
        </button>

        {/* Título vertical legível — de cima para baixo */}
        <div className="flex-1 flex items-center justify-center w-full py-2 min-h-0">
          <span
            title={title}
            className="text-[13px] font-semibold text-slate-700 leading-tight select-none"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxHeight: "200px",
            }}
          >
            {title}
          </span>
        </div>

        {/* Badge de contagem — base */}
        <span
          className="mb-3 mt-1 shrink-0 min-w-[22px] h-[22px] px-1 bg-slate-200 text-slate-500 text-[11px] font-semibold rounded-full flex items-center justify-center"
        >
          {cards.length}
        </span>
      </div>
    );
  }

  // ── Vista EXPANDIDA (padrão) ─────────────────────────────
  return (
    <div className="w-72 shrink-0 bg-slate-100 rounded-2xl flex flex-col max-h-full shadow-md transition-all duration-200">
      {/* Header da lista — fixo no topo */}
      <div className="px-3 pt-3 pb-2 shrink-0 group">
        <div className="flex items-start justify-between gap-1">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              disabled={isSavingTitle}
              autoFocus
              className="text-sm font-semibold text-slate-800 bg-white border border-violet-500 rounded px-1.5 py-0.5 outline-none flex-1 min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTitleSubmit();
                }
                if (e.key === "Escape") {
                  setIsEditingTitle(false);
                  setEditTitleValue(title);
                }
              }}
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-slate-800 flex-1 min-h-[28px] flex items-center px-1.5 rounded cursor-pointer border border-transparent hover:bg-slate-200/50 break-words"
            >
              {title}
            </h3>
          )}

          <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
            {/* Botão colapsar */}
            <button
              onClick={toggleCollapse}
              title="Minimizar lista"
              className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <CollapseIcon />
            </button>

            {/* Botão de menu (3 pontos) */}
            <button className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
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
                  d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Cards — area scrollavel + droppable */}
      <div
        ref={setDropRef}
        className={`flex-1 overflow-y-auto px-3 pb-1 space-y-2 min-h-0 transition-colors duration-150 ${
          isOver ? "bg-violet-50/60 rounded-xl" : ""
        }`}
        style={{ minHeight: "2rem" }}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              id={card.id}
              title={card.title}
              hasDescription={!!card.description}
              dueDate={card.dueDate}
              isDueCompleted={card.isDueCompleted}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>

        {/* Input de novo card inline */}
        {addingCard && (
          <div className="bg-white rounded-lg shadow-sm border border-violet-300 p-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Insira um titulo para este cartao..."
              className="w-full text-sm text-gray-800 resize-none outline-none placeholder:text-gray-400 min-h-[60px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
                if (e.key === "Escape") {
                  setAddingCard(false);
                  setNewCardTitle("");
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Botao adicionar card — fixo no fundo */}
      <div className="px-2 py-2 shrink-0">
        {addingCard ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!newCardTitle.trim()}
              className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Adicionar cartao
            </button>
            <button
              onClick={() => {
                setAddingCard(false);
                setNewCardTitle("");
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
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
            Adicionar um cartao
          </button>
        )}
      </div>
    </div>
  );
}
