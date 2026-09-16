import type { Metadata } from "next";
import AuthForm from "@/app/components/AuthForm";
import { isGuestLoginAllowed } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Create account | Vinyl" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" next={next} guestAllowed={isGuestLoginAllowed()} />;
}
