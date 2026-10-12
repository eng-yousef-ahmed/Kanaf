/* نموذج طلب عرض السعر: يبني رسالة واتساب جاهزة ويفتحها (بدون خادم) */
(function () {
  "use strict";
  var WA_NUMBER = "966568646500";
  var form = document.getElementById("quoteForm");
  if (!form) { return; }
  var msg = document.getElementById("quoteMsg");
  var EN = form.getAttribute("data-lang") === "en";
  var T = EN ? {
    nameError: "Enter your name using at least two characters.",
    phoneError: "Enter a valid phone number with 8 to 15 digits.",
    opened: "Your message is ready in WhatsApp. Review it and press send.",
    fallback: "If WhatsApp did not open, use this link:",
    head: "Quote request — from the Kanaf website",
    name: "Name", phone: "Mobile", city: "City / location", type: "System", details: "Details", none: "—"
  } : {
    nameError: "اكتب الاسم بحرفين على الأقل.",
    phoneError: "اكتب رقم جوال صحيحًا من 8 إلى 15 رقمًا.",
    opened: "جهزنا الرسالة في واتساب. راجعها واضغط إرسال.",
    fallback: "إذا لم يفتح واتساب، استخدم هذا الرابط:",
    head: "طلب عرض سعر — من موقع كنف",
    name: "الاسم", phone: "الجوال", city: "المدينة / الموقع", type: "نوع النظام", details: "التفاصيل", none: "—"
  };

  function clearFieldError(field) {
    field.removeAttribute("aria-invalid");
    var error = field.parentNode.querySelector(".qf-field-error");
    if (error) error.remove();
    field.removeAttribute("aria-describedby");
  }

  function normalizeDigits(value) {
    var arabic = "٠١٢٣٤٥٦٧٨٩", persian = "۰۱۲۳۴۵۶۷۸۹";
    return value.replace(/[٠-٩۰-۹]/g, function (digit) {
      var index = arabic.indexOf(digit);
      if (index < 0) index = persian.indexOf(digit);
      return String(index % 10);
    });
  }

  function setFieldError(field, message) {
    clearFieldError(field);
    field.setAttribute("aria-invalid", "true");
    var error = document.createElement("small");
    error.className = "qf-field-error";
    error.id = field.name + "Error";
    error.textContent = message;
    field.setAttribute("aria-describedby", error.id);
    field.parentNode.appendChild(error);
  }

  form.querySelectorAll("input, textarea, select").forEach(function (field) {
    function onEdit() {
      clearFieldError(field);
      if (msg && msg.classList.contains("err")) { msg.textContent = ""; msg.className = "qf-msg"; }
    }
    field.addEventListener("input", onEdit);
    field.addEventListener("change", onEdit);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var get = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
    var name = get("name"), phone = normalizeDigits(get("phone"));
    clearFieldError(form.elements.name);
    clearFieldError(form.elements.phone);

    var phoneDigits = phone.replace(/\D/g, "");
    if (name.length < 2) {
      setFieldError(form.elements.name, T.nameError);
      if (msg) { msg.textContent = T.nameError; msg.className = "qf-msg err"; }
      form.elements.name.focus();
      return;
    }
    if (!/^[+()\d\s-]+$/.test(phone) || phoneDigits.length < 8 || phoneDigits.length > 15) {
      setFieldError(form.elements.phone, T.phoneError);
      if (msg) { msg.textContent = T.phoneError; msg.className = "qf-msg err"; }
      form.elements.phone.focus();
      return;
    }
    clearFieldError(form.elements.name);
    clearFieldError(form.elements.phone);

    var lines = [
      T.head,
      T.name + ": " + name,
      T.phone + ": " + phone,
      T.city + ": " + (get("city") || T.none),
      T.type + ": " + get("type"),
      T.details + ": " + (get("details") || T.none)
    ];
    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
    document.dispatchEvent(new CustomEvent("kanaf:quote-ready"));

    if (msg) {
      msg.textContent = T.opened + " ";
      msg.className = "qf-msg ok";
      var fallback = document.createElement("a");
      fallback.href = url;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.textContent = T.fallback;
      msg.appendChild(fallback);
    }
  });
})();
