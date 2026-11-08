import type { Metadata } from "next";
import { connection } from "next/server";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage() {
  // Render per request so the page gets the Content-Security-Policy nonce.
  await connection();
  return <LoginForm />;
}
