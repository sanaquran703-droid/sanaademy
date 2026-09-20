import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserNotifications, getUnreadCount, markAllAsRead } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.id),
    getUnreadCount(session.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markAllAsRead(session.id);
  return NextResponse.json({ ok: true });
}
