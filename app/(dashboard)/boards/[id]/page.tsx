import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BoardClient } from "@/components/board/board-client";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cardId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const { cardId } = await searchParams;

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      workspace: {
        select: { id: true, name: true, ownerId: true },
      },
      lists: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  // Verifica se o usuario tem acesso ao workspace do board
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: board.workspaceId,
        userId: user.id,
      },
    },
  });

  if (!membership && user.role !== "ADMIN") {
    notFound();
  }

  // Serializa dates para JSON (Next.js Server Components)
  const serializedBoard = {
    ...board,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    lists: board.lists.map((list) => ({
      ...list,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      cards: list.cards.map((card) => ({
        ...card,
        dueDate: card.dueDate ? card.dueDate.toISOString() : null,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      })),
    })),
  };

  return (
    <BoardClient
      board={serializedBoard}
      userName={user.name}
      initialCardId={cardId}
    />
  );
}
