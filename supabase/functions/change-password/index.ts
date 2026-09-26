import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

function taoMatKhau(doDai = 10): string {
  let mk = "";
  for (let i = 0; i < doDai; i++) mk += Math.floor(Math.random() * 10).toString();
  return mk;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { phien_id, captcha_token } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: phien } = await supabase
      .from("phien_tai_khoan")
      .select("*")
      .eq("id", phien_id)
      .single();
    if (!phien?.ma_otp) {
      return new Response(JSON.stringify({ loi: "Chưa có OTP" }), { status: 400, headers: CORS });
    }

    const xacNhan = await fetch("https://api.vmos.com/v1/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: phien.email_tam,
        otp: phien.ma_otp,
        captcha_token: captcha_token ?? null,
      }),
    });
    const duLieu = await xacNhan.json();
    const token = duLieu.token;
    if (!token) {
      return new Response(
        JSON.stringify({ loi: "Xác minh thất bại", phan_hoi: duLieu }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const matKhauMoi = taoMatKhau();
    const doiMk = await fetch("https://api.vmos.com/v1/user/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ new_password: matKhauMoi }),
    });

    const chuoiDauRa = `${phien.email_tam}|${matKhauMoi}`;

    await supabase
      .from("phien_tai_khoan")
      .update({
        mat_khau_vmos: matKhauMoi,
        chuoi_dau_ra: chuoiDauRa,
        trang_thai: doiMk.ok ? "hoan_tat" : "loi",
        cap_nhat_luc: new Date().toISOString(),
      })
      .eq("id", phien_id);

    if (doiMk.ok) {
      await supabase
        .from("tai_khoan_hoan_tat")
        .upsert({ email: phien.email_tam, mat_khau: matKhauMoi }, { onConflict: "email" });
    }

    await supabase.from("nhat_ky").insert({
      phien_id,
      hanh_dong: "change_password",
      chi_tiet: { thanh_cong: doiMk.ok, chuoi: chuoiDauRa },
    });

    return new Response(
      JSON.stringify({
        thanh_cong: doiMk.ok,
        email: phien.email_tam,
        mat_khau: matKhauMoi,
        chuoi: chuoiDauRa,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (loi) {
    return new Response(
      JSON.stringify({ thanh_cong: false, loi: String(loi) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
