import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase
    .from("tai_khoan_hoan_tat")
    .select("chuoi")
    .order("tao_luc", { ascending: true });

  const noiDung = (data ?? []).map((r) => r.chuoi).join("\n");

  return new Response(noiDung, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=accounts.txt",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
