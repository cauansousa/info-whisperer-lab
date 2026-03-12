import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return <LandingPage />;
}
