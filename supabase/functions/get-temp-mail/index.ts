import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const trang = await fetch("https://unlimitmail.com/vi/temp-mail", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const html = await trang.text();
    const khop = html.match(/[a-z0-9]{8,}@[a-z0-9.-]+\.[a-z]{2,}/i);
    if (!khop) throw new Error("Không trích xuất được email từ UnlimitMail");
    const email = khop[0];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("phien_tai_khoan")
      .insert({ email_tam: email, trang_thai: "cho_otp" })
      .select()
      .single();
    if (error) throw error;

    return new Response(
      JSON.stringify({ thanh_cong: true, phien_id: data.id, email }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (loi) {
    return new Response(
      JSON.stringify({ thanh_cong: false, loi: String(loi) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
