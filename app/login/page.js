import { authOptions } from "@/lib/authOptions";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const providers = {};
  for (const p of authOptions.providers) {
    providers[p.id] = { id: p.id, name: p.name };
  }
  return <LoginClient providers={providers} />;
}