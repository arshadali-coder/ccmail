import { Resend } from "resend";
import { supabase } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return Response.json({ error: "Email and userId are required" }, { status: 400 });
    }

    // 1. Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 2. Store OTP in database (using admin client to bypass RLS if needed)
    // Delete existing OTPs for the user to prevent clutter
    await supabase
      .from("recovery_email_otps")
      .delete()
      .eq("user_id", userId);

    const { error: dbError } = await supabase
      .from("recovery_email_otps")
      .insert({
        user_id: userId,
        otp,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) throw dbError;

    // 3. Send email using Resend
    await resend.emails.send({
      from: "CCMail <support@codingcounciljmi.in>",
      to: email,
      subject: "Verify your recovery email",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
          <h2 style="color: #1f2937; margin-bottom: 16px;">CCMail Security</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
            You requested to add a recovery email to your CCMail account. Use the verification code below to verify this change. This code is valid for 10 minutes.
          </p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 24px 0; color: #1a73e8;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            If you did not make this request, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
