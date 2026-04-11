"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NotificationData {
  cardTitle?: string;
  commentText?: string;
  addedBy?: string;
  dueDate?: string;
  fromList?: string;
  toList?: string;
  itemTitle?: string;
  assignerName?: string;
  itemId?: string;
}

interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  isRead: boolean;
  createdAt: string;
  creator: { id: string; name: string; email: string; image?: string | null } | null;
  card: { id: string; title: string } | null;
  board: { id: string; title: string } | null;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  COMMENT_ADDED: "💬",
  MEMBER_ADDED: "👤",
  DUE_DATE_SOON: "📅",
  DUE_DATE_OVERDUE: "⏰",
  CARD_MOVED: "🔄",
  CHECKLIST_ITEM_ASSIGNED: "☑️",
  CHECKLIST_ITEM_OVERDUE: "⚠️",
};

function getNotificationText(n: Notification): string {
  const creatorName = n.creator?.name || "Alguém";
  const cardTitle = n.data?.cardTitle || n.card?.title || "um cartão";

  switch (n.type) {
    case "COMMENT_ADDED":
      return `${creatorName} comentou em "${cardTitle}"`;
    case "MEMBER_ADDED":
      return `${n.data?.addedBy || creatorName} adicionou você a "${cardTitle}"`;
    case "DUE_DATE_SOON":
      return `Data de entrega definida para "${cardTitle}"`;
    case "DUE_DATE_OVERDUE":
      return `"${cardTitle}" está com prazo vencido`;
    case "CARD_MOVED":
      return `${creatorName} moveu "${cardTitle}" de ${n.data?.fromList || "?"} para ${n.data?.toList || "?"}`;
    case "CHECKLIST_ITEM_ASSIGNED": {
      const itemTitle = n.data?.itemTitle || "um item";
      const assigner = n.data?.assignerName || creatorName;
      return `${assigner} atribuiu você ao item "${itemTitle}" em "${cardTitle}"`;
    }
    case "CHECKLIST_ITEM_OVERDUE": {
      const itemTitle = n.data?.itemTitle || "um item";
      return `Item "${itemTitle}" em "${cardTitle}" está com prazo vencido`;
    }
    default:
      return `Nova notificação sobre "${cardTitle}"`;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Polling: busca contagem de não lidas a cada 30s
  // + dispara cron-overdue a cada ~2min (4 ciclos de 30s)
  const cronCounter = useRef(0);

  const fetchCount = useCallback(async () => {
    try {
      // Cron virtual: a cada 4 ciclos (~2min), verifica cards em atraso
      cronCounter.current++;
      if (cronCounter.current >= 4) {
        cronCounter.current = 0;
        fetch("/api/notifications/cron-overdue").catch(() => {});
      }

      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    // Dispara cron-overdue imediatamente na montagem
    fetch("/api/notifications/cron-overdue").catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Busca notificações quando abre o dropdown
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silencioso
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // Marca como lida se ainda não estiver
    if (!n.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [n.id] }),
        });
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === n.id ? { ...notif, isRead: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silencioso
      }
    }

    // Navega para o board com suporte a deep-link do card correspondente
    if (n.board?.id) {
      setIsOpen(false);
      const cardIdParam = n.card?.id ? `?cardId=${n.card.id}` : "";
      router.push(`/boards/${n.board.id}${cardIdParam}`);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="relative text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer p-2"
          />
        }
      >
        {/* Ícone do sino */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {/* Badge de contagem */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-in fade-in zoom-in duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 bg-slate-900 border-white/10 text-slate-300 p-0 max-h-[480px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Notificações</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Lista de notificações */}
        <div className="overflow-y-auto flex-1 max-h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-3xl mb-2 block">🎉</span>
              <p className="text-slate-500 text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-white/5 ${
                  !n.isRead
                    ? "bg-indigo-500/10 border-l-2 border-indigo-500"
                    : "border-l-2 border-transparent"
                }`}
              >
                {/* Avatar do criador ou Ícone do tipo */}
                <div className="relative mt-0.5 shrink-0">
                  {n.creator ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-sm">
                      {n.creator.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.creator.image} alt={n.creator.name} className="w-full h-full object-cover" />
                      ) : (
                        n.creator.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                      {NOTIFICATION_ICONS[n.type] || "🔔"}
                    </div>
                  )}
                  {/* Badge pequeno do tipo de notificação */}
                  {n.creator && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center text-[10px] border border-slate-700">
                      {NOTIFICATION_ICONS[n.type] || "🔔"}
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? "text-white" : "text-slate-400"}`}>
                    {getNotificationText(n)}
                  </p>

                  {/* Preview do comentário */}
                  {n.type === "COMMENT_ADDED" && n.data?.commentText && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      &quot;{n.data.commentText}&quot;
                    </p>
                  )}

                  {/* Due date formatado */}
                  {(n.type === "DUE_DATE_SOON" || n.type === "DUE_DATE_OVERDUE") && n.data?.dueDate && (
                    <p className={`text-xs mt-1 ${n.type === "DUE_DATE_OVERDUE" ? "text-red-400" : "text-amber-400"}`}>
                      {n.type === "DUE_DATE_OVERDUE" ? "⚠️ Vencido em" : "📅"} {new Date(n.data.dueDate).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* Prazo vencido de item de checklist */}
                  {n.type === "CHECKLIST_ITEM_OVERDUE" && n.data?.dueDate && (
                    <p className="text-xs mt-1 text-red-400">
                      ⚠️ Vencido em {new Date(n.data.dueDate).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* Prazo do item atribuído */}
                  {n.type === "CHECKLIST_ITEM_ASSIGNED" && n.data?.dueDate && (
                    <p className="text-xs mt-1 text-indigo-400">
                      📅 Prazo: {new Date(n.data.dueDate).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* Board + tempo */}
                  <div className="flex items-center gap-2 mt-1">
                    {n.board?.title && (
                      <span className="text-xs text-slate-600">{n.board.title}</span>
                    )}
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-600">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>

                {/* Indicador de não lida */}
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
