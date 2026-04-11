import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

// GET /api/workspaces/:id — busca workspace com boards e members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        boards: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            position: true,
            background: true,
            createdAt: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { boards: true, members: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace nao encontrado" },
        { status: 404 }
      );
    }

    // Verifica se o usuario tem acesso (owner, member, ou admin)
    const isOwner = workspace.ownerId === user.id;
    const isMember = workspace.members.some((m) => m.userId === user.id);
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isMember && !isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ workspace });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH /api/workspaces/:id — atualizar workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Workspace nao encontrado" },
        { status: 404 }
      );
    }

    // Apenas owner ou admin pode editar
    if (existing.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name || name.length > 128) {
        return NextResponse.json(
          { error: "Nome invalido" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (body.description !== undefined) {
      if (body.description && body.description.length > 1024) {
        return NextResponse.json(
          { error: "Descricao muito longa" },
          { status: 400 }
        );
      }
      data.description = body.description?.trim() || null;
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data,
    });

    return NextResponse.json({ workspace });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/workspaces/:id — deletar workspace (cascade)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Workspace nao encontrado" },
        { status: 404 }
      );
    }

    // Apenas owner ou admin pode deletar
    if (existing.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.workspace.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
