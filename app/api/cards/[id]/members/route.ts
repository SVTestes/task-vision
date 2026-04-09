import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

// GET /api/cards/[id]/members — listar membros do card
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
        list: { include: { board: { select: { workspaceId: true } } } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!card) return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissao" }, { status: 403 });

    const members = card.members.map((m) => m.user);
    return NextResponse.json({ members });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/cards/[id]/members — adicionar membro ao card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) return NextResponse.json({ error: "userId e obrigatorio" }, { status: 400 });

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: { select: { workspaceId: true } } } } },
    });
    if (!card) return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissao" }, { status: 403 });

    // Verifica se o usuario a ser adicionado é membro do workspace
    const targetMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });
    if (!targetMembership) return NextResponse.json({ error: "Usuario nao e membro do workspace" }, { status: 400 });

    const existing = await prisma.cardMember.findUnique({
      where: { cardId_userId: { cardId: id, userId } },
    });
    if (existing) return NextResponse.json({ error: "Ja e membro" }, { status: 409 });

    await prisma.cardMember.create({ data: { cardId: id, userId } });

    const addedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ member: addedUser }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/cards/[id]/members — remover membro do card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) return NextResponse.json({ error: "userId e obrigatorio" }, { status: 400 });

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: { select: { workspaceId: true } } } } },
    });
    if (!card) return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissao" }, { status: 403 });

    await prisma.cardMember.delete({
      where: { cardId_userId: { cardId: id, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
