"use client";

import { useState } from "react";
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
}

export function KanbanList({ title, cards, onCreateCard, onCardClick }: KanbanListProps) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  function handleSubmit() {
    if (!newCardTitle.trim()) return;
    onCreateCard(newCardTitle.trim());
    setNewCardTitle("");
    setAddingCard(false);
  }

  return (
    <div className="w-72 shrink-0 bg-slate-100 rounded-2xl flex flex-col max-h-full shadow-md">
      {/* Header da lista — fixo no topo */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
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

      {/* Cards — area scrollavel */}
      <div className="flex-1 overflow-y-auto px-3 pb-1 space-y-2 min-h-0">
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
