import { supabase } from "@/lib/supabase-admin";

export async function POST(req) {
  try {
    const { userId, fullName, position, dob, signature, recoveryEmail } = await req.json();

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    // 1. Update the profile details
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        position: position || null,
        dob: dob || null,
        signature: signature || null,
        onboarded: true
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. If recovery email is provided, upsert it as verified
    if (recoveryEmail && recoveryEmail.trim()) {
      const { error: recoveryError } = await supabase
        .from("recovery_emails")
        .upsert({
          user_id: userId,
          recovery_email: recoveryEmail.trim().toLowerCase(),
          is_verified: true,
          verified_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (recoveryError) throw recoveryError;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Onboarding API Error:", error);
    return Response.json({ error: error.message || "Failed to save onboarding data" }, { status: 500 });
  }
}
