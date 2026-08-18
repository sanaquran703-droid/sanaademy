export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201023290018";

export const whatsappLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

// Shared constants safe for both server and client components.
export const DASHBOARD_ROUTES = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
} as const;

export type UserRole = keyof typeof DASHBOARD_ROUTES;
