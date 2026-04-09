"use client";

import { useState, useEffect, useRef } from "react";

interface CommentData {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

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

interface CardDetailModalProps {
  card: CardData;
  listTitle: string;
  userName: string;
  onClose: () => void;
  onUpdate: (card: CardData) => void;
  onDelete: (cardId: string) => void;
}

export function CardDetailModal({
  card,
  listTitle,
  userName,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Due date state
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [isDueCompleted, setIsDueCompleted] = useState(card.isDueCompleted || false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Comments state
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Carrega comentarios ao abrir
  useEffect(() => {
    loadComments();
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingComments(false);
    }
  }

  // Fecha ao clicar no overlay
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  // Fecha com ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  async function saveTitle() {
    if (!title.trim() || title === card.title) {
      setTitle(card.title);
      setEditingTitle(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.card);
      }
    } catch {
      setTitle(card.title);
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveDescription() {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description || null }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.card);
      }
    } catch {
      setDescription(card.description || "");
    } finally {
      setSaving(false);
      setEditingDescription(false);
    }
  }

  async function saveDueDate(newDate: string | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setDueDate(data.card.dueDate || "");
        onUpdate(data.card);
      }
    } catch {
      // revert
    } finally {
      setSaving(false);
      setShowDatePicker(false);
    }
  }

  async function toggleDueCompleted() {
    const newVal = !isDueCompleted;
    setIsDueCompleted(newVal);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDueCompleted: newVal }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.card);
      }
    } catch {
      setIsDueCompleted(!newVal);
    }
  }

  async function postComment() {
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText("");
      }
    } catch {
      // silently fail
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este cartao?")) return;
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(card.id);
      }
    } catch {
      // silently fail
    }
  }

  // Formata data relativa simplificada
  function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora mesmo";
    if (diffMins < 60) return `ha ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`;
    if (diffHours < 24) return `ha ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
    if (diffDays < 30) return `ha ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  // Due date helpers
  const hasDueDate = !!dueDate;
  const dueDateObj = hasDueDate ? new Date(dueDate) : null;
  const isOverdue = hasDueDate && !isDueCompleted && dueDateObj && dueDateObj < new Date();
  const formattedDueDate = dueDateObj
    ? dueDateObj.toLocaleDateString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

  // Data de criacao formatada
  const createdDate = new Date(card.createdAt);
  const formattedCreated = createdDate.toLocaleDateString("pt-BR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  // Iniciais do usuario
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Input date value (YYYY-MM-DDTHH:mm)
  const dateInputValue = dueDate ? new Date(dueDate).toISOString().slice(0, 16) : "";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-12 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[768px] mx-4 mb-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Barra de topo */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
              {listTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Imagem de capa">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo principal — 2 colunas */}
        <div className="flex flex-col md:flex-row">
          {/* Coluna esquerda — conteudo principal */}
          <div className="flex-1 p-6">
            {/* Titulo */}
            <div className="flex items-start gap-3 mb-6">
              <div className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") {
                      setTitle(card.title);
                      setEditingTitle(false);
                    }
                  }}
                  className="text-xl font-semibold text-gray-900 outline-none border-b-2 border-violet-500 pb-1 w-full bg-transparent"
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-violet-700 transition-colors"
                >
                  {card.title}
                </h2>
              )}
            </div>

            {/* Acoes rapidas */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adicionar
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                Etiquetas
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Checklist
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                Anexo
              </button>
            </div>

            {/* Membros + Data Entrega */}
            <div className="flex items-center gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Membros</p>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <button className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Data Entrega</p>
                <div className="flex items-center gap-2">
                  {hasDueDate ? (
                    <>
                      <button
                        onClick={toggleDueCompleted}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          isDueCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isDueCompleted && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`text-sm px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          isDueCompleted
                            ? "text-green-700 bg-green-100"
                            : isOverdue
                            ? "text-red-700 bg-red-100"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {formattedDueDate}
                      </button>
                      {isDueCompleted && (
                        <span className="text-xs font-medium text-white bg-green-500 px-1.5 py-0.5 rounded">
                          Concluido
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-xs font-medium text-white bg-red-500 px-1.5 py-0.5 rounded">
                          Em Atraso
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowDatePicker(true)}
                      className="text-sm text-gray-500 px-2 py-1 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      Definir data
                    </button>
                  )}
                </div>
                {/* Date picker inline */}
                {showDatePicker && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <input
                      type="datetime-local"
                      value={dateInputValue}
                      onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveDueDate(dueDate || null)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? "..." : "Salvar"}
                      </button>
                      {hasDueDate && (
                        <button
                          onClick={() => saveDueDate(null)}
                          className="px-3 py-1.5 text-red-600 text-sm border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                        >
                          Remover
                        </button>
                      )}
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700 cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Descricao */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                <h3 className="text-base font-semibold text-gray-800">Descricao</h3>
              </div>
              {editingDescription ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione uma descricao mais detalhada..."
                    className="w-full min-h-[120px] px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-all"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={saveDescription}
                      disabled={saving}
                      className="px-4 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => {
                        setDescription(card.description || "");
                        setEditingDescription(false);
                      }}
                      className="px-4 py-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDescription(true)}
                  className="min-h-[80px] px-4 py-3 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {card.description || "Adicione uma descricao mais detalhada..."}
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita — atividade */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-100 p-6">
            {/* Header atividade */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Comentarios e atividade</h3>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {showDetails ? "Ocultar Detalhes" : "Mostrar Detalhes"}
              </button>
            </div>

            {/* Campo de comentario */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentText.trim()) postComment();
                  }}
                  placeholder="Escrever um comentario..."
                  className="flex-1 px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all placeholder:text-gray-400"
                />
                {commentText.trim() && (
                  <button
                    onClick={postComment}
                    disabled={postingComment}
                    className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {postingComment ? "..." : "Enviar"}
                  </button>
                )}
              </div>
            </div>

            {/* Comentarios e atividades */}
            <div className="space-y-4">
              {/* Comentarios reais do banco */}
              {loadingComments && (
                <p className="text-xs text-gray-400">Carregando...</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                    {comment.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700">{comment.user.name}</p>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 break-words">
                      {comment.text}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Atividade intrinseca: card criado */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{userName}</span>{" "}
                    adicionou este cartao a {listTitle}
                  </p>
                  <p className="text-xs text-violet-600 hover:underline cursor-pointer mt-0.5">
                    {formatRelativeDate(card.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhes expandidos */}
            {showDetails && (
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Criado em</span>
                  <span className="text-gray-700">{formattedCreated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ultima atualizacao</span>
                  <span className="text-gray-700">{formatRelativeDate(card.updatedAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lista</span>
                  <span className="text-gray-700">{listTitle}</span>
                </div>
                {hasDueDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Data entrega</span>
                    <span className={isDueCompleted ? "text-green-600" : isOverdue ? "text-red-600" : "text-gray-700"}>
                      {formattedDueDate}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Excluir cartao
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
