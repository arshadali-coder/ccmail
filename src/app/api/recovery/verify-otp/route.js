import { supabase } from "@/lib/supabase-admin";

export async function POST(req) {
  try {
    const { email, otp, userId } = await req.json();

    if (!email || !otp || !userId) {
      return Response.json({ error: "Email, otp, and userId are required" }, { status: 400 });
    }

    // 1. Fetch OTP record
    const { data: records, error: fetchError } = await supabase
      .from("recovery_email_otps")
      .select("*")
      .eq("user_id", userId)
      .eq("otp", otp.trim());

    if (fetchError) throw fetchError;

    if (!records || records.length === 0) {
      return Response.json({ error: "Invalid verification code" }, { status: 400 });
    }

    const otpRecord = records[0];

    // 2. Check if expired
    const isExpired = new Date() > new Date(otpRecord.expires_at);
    if (isExpired) {
      // Delete the expired OTP
      await supabase.from("recovery_email_otps").delete().eq("id", otpRecord.id);
      return Response.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // 3. Upsert the recovery email
    // Check if recovery email exists
    const { error: upsertError } = await supabase
      .from("recovery_emails")
      .upsert({
        user_id: userId,
        recovery_email: email.trim(),
        is_verified: true,
        verified_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) throw upsertError;

    // 4. Clean up the OTP record
    await supabase
      .from("recovery_email_otps")
      .delete()
      .eq("id", otpRecord.id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
