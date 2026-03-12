import { redirect } from "next/navigation";

export default function DocumentsRedirect() {
  redirect("/admin/libraries");
}
