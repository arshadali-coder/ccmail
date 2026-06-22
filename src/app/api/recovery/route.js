import { supabase } from "@/lib/supabase-admin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("recovery_emails")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return Response.json(data || null);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
