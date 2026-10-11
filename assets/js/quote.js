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
    opened: "WhatsApp opened with your message. Press send there.",
    head: "Quote request — from the Kanaf website",
    name: "Name", phone: "Mobile", city: "City / location", type: "System", details: "Details", none: "—"
  } : {
    need: "من فضلك اكتب الاسم ورقم الجوال.",
    opened: "تم فتح واتساب بالرسالة، اضغط إرسال هناك.",
    head: "طلب عرض سعر — من موقع كنف",
    name: "الاسم", phone: "الجوال", city: "المدينة / الموقع", type: "نوع النظام", details: "التفاصيل", none: "—"
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var get = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
    var name = get("name"), phone = get("phone");

    if (!name || !phone) {
      if (msg) { msg.textContent = T.need; msg.className = "qf-msg err"; }
      (name ? form.elements.phone : form.elements.name).focus();
      return;
    }

    var lines = [
      T.head,
      T.name + ": " + name,
      T.phone + ": " + phone,
      T.city + ": " + (get("city") || T.none),
      T.type + ": " + get("type"),
      T.details + ": " + (get("details") || T.none)
    ];
    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");

    if (msg) { msg.textContent = T.opened; msg.className = "qf-msg ok"; }
  });
})();
