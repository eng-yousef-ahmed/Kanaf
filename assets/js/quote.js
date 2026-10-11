/* نموذج طلب عرض السعر: يبني رسالة واتساب جاهزة ويفتحها (بدون خادم) */
(function () {
  "use strict";
  var WA_NUMBER = "966568646500";
  var form = document.getElementById("quoteForm");
  if (!form) { return; }
  var msg = document.getElementById("quoteMsg");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var get = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
    var name = get("name"), phone = get("phone");

    if (!name || !phone) {
      if (msg) { msg.textContent = "من فضلك اكتب الاسم ورقم الجوال."; msg.className = "qf-msg err"; }
      (name ? form.elements.phone : form.elements.name).focus();
      return;
    }

    var lines = [
      "طلب عرض سعر — من موقع كنف",
      "الاسم: " + name,
      "الجوال: " + phone,
      "المدينة / الموقع: " + (get("city") || "—"),
      "نوع النظام: " + get("type"),
      "التفاصيل: " + (get("details") || "—")
    ];
    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");

    if (msg) { msg.textContent = "تم فتح واتساب بالرسالة، اضغط إرسال هناك."; msg.className = "qf-msg ok"; }
  });
})();
