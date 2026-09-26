import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const { phien_id } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: phien } = await supabase
    .from("phien_tai_khoan")
    .select("*")
    .eq("id", phien_id)
    .single();
  if (!phien) return new Response(JSON.stringify({ loi: "Không có phiên" }), { status: 404, headers: CORS });

  let ma_otp: string | null = null;
  for (let i = 0; i < 25; i++) {
    const phanHoi = await fetch(
      `https://unlimitmail.com/vi/temp-mail?email=${encodeURIComponent(phien.email_tam)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const html = await phanHoi.text();
    const khop = html.match(/\b\d{6}\b/);
    if (khop) { ma_otp = khop[0]; break; }
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (ma_otp) {
    await supabase
      .from("phien_tai_khoan")
      .update({ ma_otp, trang_thai: "da_co_otp", cap_nhat_luc: new Date().toISOString() })
      .eq("id", phien_id);
  }

  return new Response(
    JSON.stringify({ thanh_cong: !!ma_otp, ma_otp }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
