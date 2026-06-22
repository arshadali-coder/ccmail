import { Resend } from "resend";
import { supabase } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  let messageId = null;
  try {
    const { to, subject, html, senderId } = await req.json();

    if (!to || !senderId) {
      return Response.json({ error: "to and senderId are required" }, { status: 400 });
    }

    // Fetch sender's profile to get their real email and name
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", senderId)
      .single();

    if (senderError || !senderProfile) {
      throw new Error("Sender profile not found in database.");
    }

    // 1. Create a thread
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({
        subject: subject || "(No Subject)",
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (threadError) throw threadError;

    // 2. Create the message in "sending" status
    const snippet = html ? html.replace(/<[^>]*>/g, '').slice(0, 80) : "";
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        thread_id: thread.id,
        sender_id: senderId,
        body_html: html || "",
        snippet: snippet,
        status: "sending"
      })
      .select()
      .single();

    if (msgError) throw msgError;
    messageId = message.id;

    // 3. Find if recipient has a profile in our system
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", to.trim().toLowerCase())
      .maybeSingle();

    // 4. Create the recipient entry
    const { error: recError } = await supabase
      .from("message_recipients")
      .insert({
        message_id: message.id,
        recipient_email: to.trim().toLowerCase(),
        recipient_user_id: recipientProfile ? recipientProfile.id : null,
        recipient_type: "to"
      });

    if (recError) throw recError;

    // 5. Send the email via Resend
    let resendId = null;
    try {
      const fromName = senderProfile.full_name || "CCMail User";
      const fromEmail = senderProfile.email;

      const resendResponse = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: to.trim(),
        subject: subject || "(No Subject)",
        html: html || "",
      });

      if (resendResponse.error) {
        throw new Error(resendResponse.error.message || "Resend API error");
      }
      resendId = resendResponse.data?.id;
    } catch (sendErr) {
      // Update message to failed
      await supabase
        .from("messages")
        .update({ status: "failed" })
        .eq("id", messageId);
      throw sendErr;
    }

    // 6. Update message status to "sent"
    await supabase
      .from("messages")
      .update({ status: "sent" })
      .eq("id", messageId);

    // 7. Create mailbox entry for the sender (folder: "sent")
    await supabase
      .from("mailbox_entries")
      .insert({
        user_id: senderId,
        message_id: messageId,
        folder: "sent",
        is_read: true,
        is_starred: false
      });

    // 8. Create mailbox entry for the recipient if they are registered (folder: "inbox")
    if (recipientProfile) {
      await supabase
        .from("mailbox_entries")
        .insert({
          user_id: recipientProfile.id,
          message_id: messageId,
          folder: "inbox",
          is_read: false,
          is_starred: false
        });
    }

    return Response.json({
      success: true,
      messageId: messageId,
      resendId: resendId
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return Response.json(
      { error: error.message || "Failed to process sending" },
      { status: 500 }
    );
  }
}