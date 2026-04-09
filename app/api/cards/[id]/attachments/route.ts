import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

// GET /api/cards/[id]/attachments — listar anexos do card
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: { select: { workspaceId: true } } } } },
    });
    if (!card) return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissao" }, { status: 403 });

    const attachments = await prisma.attachment.findMany({
      where: { cardId: id },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/cards/[id]/attachments — criar anexo (link)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { name, url } = await request.json();

    if (!url || !url.trim()) return NextResponse.json({ error: "URL e obrigatoria" }, { status: 400 });

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: { select: { workspaceId: true } } } } },
    });
    if (!card) return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissao" }, { status: 403 });

    const attachment = await prisma.attachment.create({
      data: {
        name: name?.trim() || url.trim(),
        url: url.trim(),
        type: "link",
        cardId: id,
        creatorId: user.id,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/cards/[id]/attachments — deletar anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { attachmentId } = await request.json();

    if (!attachmentId) return NextResponse.json({ error: "attachmentId e obrigatorio" }, { status: 400 });

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: { select: { workspaceId: true } } } } },
    });
    if (!card) return NextResponse.json({ error: "Card nao encontrado" }, { status: 404 });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissao" }, { status: 403 });

    await prisma.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
