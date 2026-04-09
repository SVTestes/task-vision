import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

// GET /api/cards/[id]/labels — listar labels atribuidas ao card
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
          include: { board: { select: { workspaceId: true } } },
        },
        labels: {
          include: { label: true },
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

    const labels = card.labels.map((cl) => cl.label);
    return NextResponse.json({ labels });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/cards/[id]/labels — atribuir label ao card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const { labelId } = body;

    if (!labelId) {
      return NextResponse.json({ error: "labelId e obrigatorio" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: { board: { select: { workspaceId: true } } },
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

    // Verifica se ja existe
    const existing = await prisma.cardLabel.findUnique({
      where: { cardId_labelId: { cardId: id, labelId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Label ja atribuida" }, { status: 409 });
    }

    const cardLabel = await prisma.cardLabel.create({
      data: { cardId: id, labelId },
      include: { label: true },
    });

    return NextResponse.json({ label: cardLabel.label }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/cards/[id]/labels — remover label do card (labelId no body)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const { labelId } = body;

    if (!labelId) {
      return NextResponse.json({ error: "labelId e obrigatorio" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: { board: { select: { workspaceId: true } } },
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

    await prisma.cardLabel.delete({
      where: { cardId_labelId: { cardId: id, labelId } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
