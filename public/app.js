// Điều phối toàn bộ quy trình qua các Edge Function của Supabase
const SUPABASE_URL = "https://aynnvioaytpgxkfnpipy.supabase.co";
const SUPABASE_ANON = "sb_publishable_aHvZ_Bau-c2uKGBRVIyjWg_SujI3UVE";
const SITE_KEY_CAPTCHA = "SITE_KEY_THAT_CUA_VMOS";

const logEl = document.getElementById("log");
const ghiLog = (txt) => {
  logEl.textContent += `[${new Date().toLocaleTimeString()}] ${txt}\n`;
  logEl.scrollTop = logEl.scrollHeight;
};

async function goiHam(ten, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${ten}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "apikey": SUPABASE_ANON,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

function choGiaiCaptcha() {
  return new Promise((resolve) => {
    const khoi = document.getElementById("khoi-captcha");
    const widget = document.getElementById("recaptcha-widget");
    widget.innerHTML = "";
    khoi.style.display = "block";
    window.grecaptcha.render(widget, {
      sitekey: SITE_KEY_CAPTCHA,
      callback: (token) => {
        khoi.style.display = "none";
        resolve(token);
      },
    });
  });
}

document.getElementById("btn-chay").addEventListener("click", async () => {
  try {
    ghiLog("Bước 1: Lấy email tạm...");
    const b1 = await goiHam("get-temp-mail", {});
    if (!b1.thanh_cong) throw new Error(b1.loi);
    ghiLog("Email tạm: " + b1.email);

    ghiLog("Bước 2: Chờ OTP...");
    const b2 = await goiHam("check-otp", { phien_id: b1.phien_id });
    if (!b2.thanh_cong) throw new Error("Không lấy được OTP");
    ghiLog("OTP: " + b2.ma_otp);

    ghiLog("Vui lòng giải CAPTCHA bên dưới...");
    const captchaToken = await choGiaiCaptcha();
    ghiLog("Đã nhận CAPTCHA token");

    ghiLog("Bước 3: Đổi mật khẩu VMOS...");
    const b3 = await goiHam("change-password", {
      phien_id: b1.phien_id,
      captcha_token: captchaToken,
    });
    if (!b3.thanh_cong) throw new Error("Đổi mật khẩu thất bại: " + JSON.stringify(b3));

    ghiLog("=== HOÀN TẤT ===");
    ghiLog("Kết quả: " + b3.chuoi);

    const ds = JSON.parse(localStorage.getItem("ds_tk") || "[]");
    ds.push(b3.chuoi);
    localStorage.setItem("ds_tk", JSON.stringify(ds));
    ghiLog("Đã lưu. Tổng tài khoản trong phiên: " + ds.length);
  } catch (loi) {
    ghiLog("LỖI: " + loi.message);
  }
});

document.getElementById("btn-tai").addEventListener("click", () => {
  const ds = JSON.parse(localStorage.getItem("ds_tk") || "[]");
  if (!ds.length) { ghiLog("Chưa có tài khoản nào để tải"); return; }
  const blob = new Blob([ds.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "accounts.txt";
  a.click();
  ghiLog("Đã tải " + ds.length + " tài khoản");
});

document.getElementById("btn-xoa").addEventListener("click", () => {
  logEl.textContent = "";
});
