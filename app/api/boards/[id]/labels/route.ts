import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

// GET /api/boards/[id]/labels — listar labels do board
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const board = await prisma.board.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!board) {
      return NextResponse.json({ error: "Board nao encontrado" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const labels = await prisma.label.findMany({
      where: { boardId: id },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ labels });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/boards/[id]/labels — criar label no board
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    if (!color) {
      return NextResponse.json({ error: "Cor e obrigatoria" }, { status: 400 });
    }

    const board = await prisma.board.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!board) {
      return NextResponse.json({ error: "Board nao encontrado" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const lastLabel = await prisma.label.findFirst({
      where: { boardId: id },
      orderBy: { position: "desc" },
    });
    const position = lastLabel ? lastLabel.position + 1000 : 1000;

    const label = await prisma.label.create({
      data: {
        name: name?.trim() || null,
        color,
        boardId: id,
        position,
      },
    });

    return NextResponse.json({ label }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
