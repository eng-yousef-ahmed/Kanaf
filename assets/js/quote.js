/* نموذج طلب عرض السعر: يبني رسالة واتساب جاهزة ويفتحها (بدون خادم) */
(function () {
  "use strict";
  var WA_NUMBER = "966568646500";
  var form = document.getElementById("quoteForm");
  if (!form) { return; }
  var msg = document.getElementById("quoteMsg");
  var EN = form.getAttribute("data-lang") === "en";
  var T = EN ? {
    need: "Please enter your name and mobile number.",
    badPhone: "Please enter a valid mobile number (e.g. 05XXXXXXXX or +9665XXXXXXXX).",
    opened: "WhatsApp opened with your message. Press send there.",
    head: "Quote request — from the Kanaf website",
    name: "Name", phone: "Mobile", city: "City / location", type: "System", details: "Details", none: "—"
  } : {
    need: "من فضلك اكتب الاسم ورقم الجوال.",
    badPhone: "من فضلك تأكد من رقم الجوال — مثال صحيح: 0512345678 أو +966512345678",
    opened: "تم فتح واتساب بالرسالة، اضغط إرسال هناك.",
    head: "طلب عرض سعر — من موقع كنف",
    name: "الاسم", phone: "الجوال", city: "المدينة / الموقع", type: "نوع النظام", details: "التفاصيل", none: "—"
  };

  function validPhone(raw) {
    /* يقبل 05XXXXXXXX أو 9665XXXXXXXX أو +9665XXXXXXXX مع أي مسافات/شرطات */
    var p = raw.replace(/[\s\-().]/g, "");
    if (/^00966/.test(p)) { p = "+" + p.slice(2); }
    if (/^\+?9665\d{8}$/.test(p)) { return true; }
    return /^05\d{8}$/.test(p);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var get = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
    var name = get("name"), phone = get("phone");

    if (!name || !phone) {
      if (msg) { msg.textContent = T.need; msg.className = "qf-msg err"; }
      (name ? form.elements.phone : form.elements.name).focus();
      return;
    }
    if (!validPhone(phone)) {
      if (msg) { msg.textContent = T.badPhone; msg.className = "qf-msg err"; }
      form.elements.phone.focus();
      return;
    }

    /* توحيد الرقم بالصيغة الدولية قبل الإرسال */
    var p = phone.replace(/[\s\-().]/g, "");
    if (/^00966/.test(p)) { p = "+" + p.slice(2); }
    if (/^05\d{8}$/.test(p)) { p = "+966" + p.slice(1); }
    else if (/^5\d{8}$/.test(p)) { p = "+966" + p; }
    else if (/^9665\d{8}$/.test(p)) { p = "+" + p; }

    var lines = [
      T.head,
      T.name + ": " + name,
      T.phone + ": " + p,
      T.city + ": " + (get("city") || T.none),
      T.type + ": " + get("type"),
      T.details + ": " + (get("details") || T.none)
    ];
    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");

    if (msg) { msg.textContent = T.opened; msg.className = "qf-msg ok"; }
  });
})();
