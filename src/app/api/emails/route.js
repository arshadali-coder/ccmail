import { supabase } from "@/lib/supabase-admin";

// GET /api/emails?userId=... or GET /api/emails?messageId=...
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const messageId = searchParams.get("messageId");

    if (messageId) {
      // Fetch details of a single message (including body_html)
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          body_html,
          snippet,
          status,
          created_at,
          sender_email,
          sender:profiles!messages_sender_id_fkey (
            id,
            email,
            full_name,
            avatar_url
          ),
          thread:threads (
            id,
            subject
          ),
          recipients:message_recipients (
            recipient_email,
            recipient_type
          )
        `)
        .eq("id", messageId)
        .single();

      if (error) throw error;
      return Response.json(data);
    }

    if (!userId) {
      return Response.json({ error: "userId or messageId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mailbox_entries")
      .select(`
        id,
        folder,
        is_read,
        is_starred,
        created_at,
        message:messages (
          id,
          snippet,
          status,
          created_at,
          sender_email,
          sender:profiles!messages_sender_id_fkey (
            id,
            email,
            full_name,
            avatar_url
          ),
          thread:threads (
            id,
            subject
          ),
          recipients:message_recipients (
            recipient_email,
            recipient_type
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/emails (Update single mailbox entry)
export async function PUT(req) {
  try {
    const { id, is_read, is_starred, folder } = await req.json();

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updateData = {};
    if (is_read !== undefined) updateData.is_read = is_read;
    if (is_starred !== undefined) updateData.is_starred = is_starred;
    if (folder !== undefined) {
      // Map folder UI names to database values
      const folderVal = folder.toLowerCase();
      updateData.folder = folderVal === "bin" || folderVal === "trash" ? "trash" : folderVal;
    }

    const { data, error } = await supabase
      .from("mailbox_entries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/emails (Bulk update mailbox entries)
export async function PATCH(req) {
  try {
    const { ids, is_read, is_starred, folder } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return Response.json({ error: "ids array is required" }, { status: 400 });
    }

    const updateData = {};
    if (is_read !== undefined) updateData.is_read = is_read;
    if (is_starred !== undefined) updateData.is_starred = is_starred;
    if (folder !== undefined) {
      const folderVal = folder.toLowerCase();
      updateData.folder = folderVal === "bin" || folderVal === "trash" ? "trash" : folderVal;
    }

    const { data, error } = await supabase
      .from("mailbox_entries")
      .update(updateData)
      .in("id", ids)
      .select();

    if (error) throw error;

    return Response.json({ success: true, count: data?.length || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
