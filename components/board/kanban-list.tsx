"use client";

import { KanbanCard } from "./kanban-card";

interface CardData {
  id: string;
  title: string;
}

interface KanbanListProps {
  id: string;
  title: string;
  cards: CardData[];
}

export function KanbanList({ title, cards }: KanbanListProps) {
  return (
    <div className="w-72 shrink-0 bg-slate-100 rounded-xl flex flex-col max-h-full shadow-md">
      {/* Header da lista — fixo no topo */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
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
          <KanbanCard key={card.id} id={card.id} title={card.title} />
        ))}
      </div>

      {/* Botao adicionar card — fixo no fundo */}
      <div className="px-2 py-2 shrink-0">
        <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
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
      </div>
    </div>
  );
}
