import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";
import { notifyCardMembers } from "@/lib/notifications/create-notification";

// GET /api/cards/[id] — buscar detalhes do card
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: {
              select: { id: true, title: true, workspaceId: true },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });
    }

    // Verifica permissao
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: card.list.board.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    return NextResponse.json({ card });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH /api/cards/[id] — atualizar card (titulo, descricao, mover para outra lista)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const { title, description, listId, position, dueDate, isDueCompleted } = body;

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          select: { id: true, title: true, board: { select: { id: true, workspaceId: true } } },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });
    }

    // Verifica permissao
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: card.list.board.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    // Monta objeto de update apenas com campos enviados
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (listId !== undefined) updateData.listId = listId;
    if (position !== undefined) updateData.position = position;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (isDueCompleted !== undefined) updateData.isDueCompleted = isDueCompleted;

    const updated = await prisma.card.update({
      where: { id },
      data: updateData,
    });

    // Notificação: card movido de lista
    if (listId !== undefined && listId !== card.listId) {
      const newList = await prisma.list.findUnique({ where: { id: listId }, select: { title: true } });
      notifyCardMembers({
        excludeUserId: user.id,
        cardId: id,
        boardId: card.list.board.id,
        type: "CARD_MOVED",
        data: {
          cardTitle: card.title,
          fromList: card.list.title,
          toList: newList?.title || "Lista desconhecida",
        },
      });
    }

    // Notificação: due date definido/alterado
    if (dueDate !== undefined && dueDate !== null) {
      const parsedDate = new Date(dueDate);
      const isOverdue = parsedDate.getTime() < Date.now();
      notifyCardMembers({
        excludeUserId: user.id,
        cardId: id,
        boardId: card.list.board.id,
        type: isOverdue ? "DUE_DATE_OVERDUE" : "DUE_DATE_SOON",
        data: {
          cardTitle: card.title,
          dueDate: parsedDate.toISOString(),
        },
      });
    }

    // Notificação: conclusão/desconclusão do card
    if (isDueCompleted !== undefined && isDueCompleted !== card.isDueCompleted) {
      notifyCardMembers({
        excludeUserId: user.id,
        cardId: id,
        boardId: card.list.board.id,
        type: isDueCompleted ? "CARD_COMPLETED" : "CARD_UNCOMPLETED",
        data: {
          cardTitle: card.title,
        },
      });
    }

    return NextResponse.json({ card: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/cards/[id] — deletar card
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: {
              select: { workspaceId: true },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: card.list.board.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    await prisma.card.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
