import { supabase } from "@/lib/supabase-admin";

export async function POST(req) {
  try {
    // 1. Verify a secret token from the request header: Authorization: Bearer <WORKER_SECRET>
    const authHeader = req.headers.get("authorization");
    const secret = process.env.WORKER_SECRET;
    
    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const payload = await req.json();
    const { to, from, subject, body_html, body_text, text } = payload;

    if (!to || !from) {
      return Response.json({ error: "Missing required fields: to and from" }, { status: 400 });
    }

    // 3. Find the recipient user by matching profiles.email = payload.to
    const { data: recipientProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", to.trim().toLowerCase())
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    // If recipient does not exist: return 404, do not create any records
    if (!recipientProfile) {
      return Response.json({ error: "Recipient profile not found" }, { status: 404 });
    }

    // 4. Create a new thread: threads.subject = email subject
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({
        subject: subject || "(No Subject)",
        last_message_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (threadError) throw threadError;

    // 5. Create a message record:
    // snippet = first 150 characters of plain text body
    const plainText = body_text || text || (body_html ? body_html.replace(/<[^>]*>/g, '') : "");
    const snippet = plainText.trim().slice(0, 150);

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        thread_id: thread.id,
        sender_id: null,
        sender_email: from.trim().toLowerCase(),
        body_html: body_html || "",
        snippet: snippet,
        status: "sent"
      })
      .select("id")
      .single();

    if (messageError) throw messageError;

    // 6. Create message recipient entry
    const { error: recError } = await supabase
      .from("message_recipients")
      .insert({
        message_id: message.id,
        recipient_email: to.trim().toLowerCase(),
        recipient_user_id: recipientProfile.id,
        recipient_type: "to"
      });

    if (recError) throw recError;

    // 7. Create an inbox entry:
    // user_id = recipient profile id, message_id = created message id, folder = 'inbox', is_read = false
    const { error: mailboxError } = await supabase
      .from("mailbox_entries")
      .insert({
        user_id: recipientProfile.id,
        message_id: message.id,
        folder: "inbox",
        is_read: false,
        is_starred: false
      });

    if (mailboxError) throw mailboxError;

    // 7. Return: success, threadId, messageId
    return Response.json({
      success: true,
      threadId: thread.id,
      messageId: message.id
    });

  } catch (error) {
    console.error("Error in inbound webhook:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
