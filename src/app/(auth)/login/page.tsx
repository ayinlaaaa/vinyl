import type { Metadata } from "next";
import AuthForm from "@/app/components/AuthForm";
import { isGuestLoginAllowed } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Sign in | Vinyl" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={next} guestAllowed={isGuestLoginAllowed()} />;
}
