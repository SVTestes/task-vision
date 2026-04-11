// lib/notifications/create-notification.ts
// Helper centralizado para criar notificações no banco.
// Todas as APIs que disparam notificações devem usar este helper.

import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/generated/prisma/enums";

export interface CreateNotificationInput {
  userId: string;       // Quem recebe
  creatorId?: string;   // Quem causou (null = sistema)
  cardId: string;       // Card relacionado
  boardId: string;      // Board (desnormalizado)
  commentId?: string;   // Comentário relacionado (se aplicável)
  type: NotificationType;
  data?: Record<string, string>; // Dados extras (nome card, texto, etc.)
}

/**
 * Cria uma única notificação no banco de dados.
 * Não notifica o próprio criador (skip silencioso se userId === creatorId).
 */
export async function createNotification(input: CreateNotificationInput) {
  // Nunca notificar o próprio autor da ação
  if (input.creatorId && input.userId === input.creatorId) {
    return null;
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        creatorId: input.creatorId || null,
        cardId: input.cardId,
        boardId: input.boardId,
        commentId: input.commentId || null,
        type: input.type,
        data: (input.data || {}) as object,
      },
    });

    return notification;
  } catch (error) {
    // Log silencioso — falha na notificação não deve quebrar a ação principal
    console.error("[Notification] Erro ao criar notificação:", error);
    return null;
  }
}

/**
 * Cria notificações para todos os membros de um card,
 * exceto o próprio criador da ação.
 * 
 * @param excludeUserId - ID do user que causou a ação (não será notificado)
 * @param cardId - ID do card
 * @param boardId - ID do board (desnormalizado)
 * @param type - Tipo da notificação
 * @param data - Dados extras
 * @param commentId - ID do comentário (opcional)
 */
export async function notifyCardMembers(params: {
  excludeUserId: string;
  cardId: string;
  boardId: string;
  type: NotificationType;
  data?: Record<string, string>;
  commentId?: string;
}) {
  const { excludeUserId, cardId, boardId, type, data, commentId } = params;

  try {
    // Busca todos os membros do card
    const cardMembers = await prisma.cardMember.findMany({
      where: { cardId },
      select: { userId: true },
    });

    // Filtra o autor da ação
    const recipientIds = cardMembers
      .map((m) => m.userId)
      .filter((id) => id !== excludeUserId);

    if (recipientIds.length === 0) return [];

    // Cria notificações em batch
    const notifications = await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        creatorId: excludeUserId,
        cardId,
        boardId,
        commentId: commentId || null,
        type,
        data: (data || {}) as object,
      })),
    });

    return notifications;
  } catch (error) {
    console.error("[Notification] Erro ao notificar membros do card:", error);
    return [];
  }
}
