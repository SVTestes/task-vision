import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

// GET /api/notifications/count — contar notificações não lidas
export async function GET() {
  try {
    const user = await requireUser();

    const count = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
