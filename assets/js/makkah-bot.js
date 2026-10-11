/* =====================================================================
   شات بوت «مكة» — المساعد الذكي لمؤسسة كنف
   ---------------------------------------------------------------------
   • يستخرج قائمة الخدمات تلقائيًا من content/services.json (بدون تكرار).
   • يفهم العربية والإنجليزية، ويعرض أزرار اقتراحات جاهزة.
   • يوجّه العميل لعرض السعر / واتساب / الهاتف / العنوان في مكة.
   • يعمل في كل الصفحات (عربية وإنجليزية) بنفس الملف.
   ===================================================================== */
(function () {
  "use strict";

  var fab = document.getElementById("mkFab");
  var panel = document.getElementById("mkPanel");
  var log = document.getElementById("mkLog");
  var chipsBox = document.getElementById("mkChips");
  var form = document.getElementById("mkForm");
  var input = document.getElementById("mkInput");
  if (!fab || !panel || !log || !form || !input) { return; }

  var EN = document.documentElement.lang === "en";
  var WA = "https://wa.me/966568646500";
  var PHONE = "+966568646500";
  var opened = false, greeted = false, busy = false;

  /* ---------- النصوص ---------- */
  var T = EN ? {
    hello: "Hi, I'm <b>Makkah</b> — Kanaf's smart assistant 👋<br>How can I help you today?",
    chips: ["CCTV cameras", "Access control", "Fire alarm", "Networks", "Maintenance contracts", "Get a quote", "Location", "Contact us"],
    servicesIntro: "We supply, install and maintain the following systems in Makkah:",
    more: "You can also open our full services page from here: ",
    quote: "Great! Fill in your details in the quote form on this page and WhatsApp will open with a ready message, or contact us directly:",
    waLink: "Chat on WhatsApp", callLink: "Call +966 56 864 6500", servicesLink: "All services",
    location: "Our showroom is in Makkah — Al Hamra, Umm Al Joud, 7716 Zunbaa bin Salama St.<br>You can see us on the map here: ", locationLink: "Open location",
    hours: "We respond around the clock on WhatsApp and phone.",
    contact: "Phone / WhatsApp: <a href=\"tel:" + PHONE + "\">" + PHONE + "</a><br>Email: <a href=\"mailto:Kanaf.S.Systems@gmail.com\">Kanaf.S.Systems@gmail.com</a>",
    pricing: "Prices depend on the site survey and the number of units. Request a free quote and we'll send you a detailed offer:",
    maint: "We offer periodic maintenance and annual maintenance contracts for CCTV and security systems: ",
    blog: "We publish expert articles on our blog: ", blogLink: "Read the blog",
    about: "Kanaf Security Systems — Saudi company founded in 2024 in Makkah: CCTV, security systems, fire alarms and technical infrastructure. Rated 4.8★ on Google Maps.",
    thanks: "You're welcome! Anything else? 😊",
    fallback: "I didn't catch that — choose one of these topics and I'll answer right away:",
    typing: "Makkah is typing…"
  } : {
    hello: "أهلًا بك، أنا <b>مكة</b> — المساعد الذكي لمؤسسة كنف 👋<br>كيف أقدر أساعدك اليوم؟",
    chips: ["كاميرات المراقبة", "التحكم بالدخول", "إنذار الحريق", "الشبكات", "عقود الصيانة", "عرض سعر", "موقعنا", "تواصل معنا"],
    servicesIntro: "نوفر في مكة توريد وتركيب وصيانة الأنظمة التالية:",
    more: "يمكنك أيضًا فتح صفحة خدماتنا الكاملة من هنا: ",
    quote: "ممتاز! املأ نموذج طلب عرض السعر في صفحة «تواصل معنا» وسيُفتح واتساب برسالة جاهزة لفريقنا، أو تواصل مباشرة:",
    waLink: "واتساب مباشر", callLink: "اتصل: ‎+966 56 864 6500", servicesLink: "كل الخدمات",
    location: "معرضنا في مكة المكرمة — الحمراء أم الجود، شارع زنباع بن سلامة 7716.<br>شاهد الموقع على الخريطة: ", locationLink: "فتح الموقع",
    hours: "نرد على استفساراتكم على مدار الساعة عبر الواتساب والاتصال.",
    contact: "الهاتف / واتساب: <a href=\"tel:" + PHONE + "\">" + PHONE + "</a><br>البريد: <a href=\"mailto:Kanaf.S.Systems@gmail.com\">Kanaf.S.Systems@gmail.com</a>",
    pricing: "الأسعار تعتمد على معاينة الموقع وعدد الوحدات — اطلب عرض سعر مجاني ويصلك تفصيل كامل:",
    maint: "نقدم صيانة دورية وعقود صيانة سنوية لكاميرات المراقبة والأنظمة الأمنية: ",
    blog: "لدينا مقالات متخصصة في مدونة كنف: ", blogLink: "اقرأ المدونة",
    about: "مؤسسة كنف — شركة سعودية تأسست 2024م في مكة المكرمة، متخصصة في كاميرات المراقبة والأنظمة الأمنية وإنذار الحريق والشبكات. تقييمنا 4.8★ على خرائط جوجل.",
    thanks: "على الرحب والسعة! هل تحتاج شيء آخر؟ 😊",
    fallback: "لم أفهم سؤالك تمامًا — اختر أحد هذه المواضيع وسأجيبك فورًا:",
    typing: "مكة تكتب…"
  };

  /* ---------- بيانات الخدمات (من ملفات JSON — مصدر واحد بلا تكرار) ---------- */
  var SERVICES = [];
  (function () {
    var L = window.KANAF_SERVICES || [];
    L.forEach(function (s) {
      SERVICES.push({
        slug: s.slug,
        name: (EN && s.enName) ? s.enName : s.name,
        blurb: EN ? (s.enLead || "") : (s.lead || "")
      });
    });
  })();

  /* كلمات مفتاحية لكل خدمة (تشابه أسماء الملفات والمسميات) */
  var KEYWORDS = [
    [/cctv|كاميرات|camera|مراقب|surveillance|dvr|nvr/i, "cctv", "CCTV Cameras"],
    [/access|دخول|إنتركم|intercom|بصمة|gate/i, "access-control", "Access Control"],
    [/fire|حريق|دخان|smoke|safety|سلامة/i, "fire-alarm", "Fire Alarm"],
    [/network|شبكات|إنترنت|internet|بنية|infrastructure/i, "networks", "Networks"],
    [/maintain|صيانة/i, "maintenance-contracts", "Maintenance"],
    [/services|خدمة|خدمات|كل الخدمات|all services/i, "__services__", "Services"],
    [/quote|سعر|price|cost|عرض/i, "__quote__", "Quote"],
    [/location|موقع|خريطة|map|عنوان|address|معرض/i, "__loc__", "Location"],
    [/contact|تواصل|هاتف|phone|واتساب|whatsapp|بريد|email/i, "__contact__", "Contact"],
    [/blog|مدونة|مقال|article/i, "__blog__", "Blog"],
    [/about|عن|من نحن|company|شركة|كنف|kanaf/i, "__about__", "About"]
  ];

  /* ---------- أدوات العرض ---------- */
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addMsg(html, who) {
    var el = document.createElement("div");
    el.className = "mk-msg " + (who || "bot");
    el.innerHTML = html;
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function showTyping(cb, delay) {
    var t = document.createElement("div");
    t.className = "mk-typing";
    t.setAttribute("role", "status");
    t.setAttribute("aria-label", T.typing);
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t); scrollDown();
    setTimeout(function () {
      t.remove();
      cb();
    }, delay || (550 + Math.random() * 450));
  }

  function setChips(list) {
    chipsBox.innerHTML = "";
    list.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mk-chip";
      b.textContent = c.label;
      b.addEventListener("click", function () { handle(c.text, c.label); });
      chipsBox.appendChild(b);
    });
  }

  function rootPath() {
    /* الصفحة الرئيسية العربية جذرها ''، الفرعية '../'، الإنجليزية '' أو '../' حسب المسار */
    var p = location.pathname;
    if (/\/(services|blog)\//.test(p)) { return "../"; }
    if (/\/en\/?$|\/en\/index/.test(p)) { return "../"; }
    return "";
  }

  function link(href, label) {
    return '<a href="' + href + '" target="_blank" rel="noopener">' + label + "</a>";
  }

  /* ---------- منطق الرد ---------- */
  function serviceAnswer(slug, name) {
    var root = rootPath();
    var svc = SERVICES.filter(function (s) { return s.slug === slug; })[0];
    if (svc && svc.name) { name = svc.name; }
    var page = EN ? root + "en/services/" + slug + ".html" : root + "services/" + slug + ".html";
    var txt = "◈ " + name;
    if (svc && svc.blurb) { txt += "<br>" + svc.blurb; }
    txt += "<br>" + T.more + link(page, T.servicesLink) +
      "<br>" + link(WA, T.waLink) + " • " + link("tel:" + PHONE, EN ? "Call us" : "اتصل بنا");
    return txt;
  }

  function menuAnswer() {
    var names = SERVICES.map(function (s) { return "• " + s.name; }).join("<br>");
    return T.servicesIntro + "<br>" + (names || "CCTV • Access Control • Fire Alarm • Networks • Maintenance") +
      "<br>" + T.more + link(rootPath() + (EN ? "en/index.html#services" : "index.html#services"), T.servicesLink);
  }

  function reply(q, label) {
    var text = q.toLowerCase();
    /* بحث عن خدمة بالاسم الصريح */
    for (var i = 0; i < SERVICES.length; i++) {
      var nm = SERVICES[i].name;
      if (nm && (text.indexOf(nm.toLowerCase()) > -1 || label === nm)) {
        return serviceAnswer(SERVICES[i].slug, nm);
      }
    }
    for (var k = 0; k < KEYWORDS.length; k++) {
      if (KEYWORDS[k][0].test(text) || (label && KEYWORDS[k][0].test(label))) {
        var key = KEYWORDS[k][1];
        var root = rootPath();
        if (key === "__services__" || label === "كل الخدمات" || label === "All services") { return menuAnswer(); }
        if (key === "__quote__") {
          return T.quote + "<br>" + link(WA, T.waLink) + " • " + link("tel:" + PHONE, T.callLink) +
            "<br>" + link(root + (EN ? "en/index.html#contact" : "index.html#contact"), EN ? "Quote form" : "نموذج عرض السعر");
        }
        if (key === "__loc__") { return T.location + link(root + (EN ? "en/index.html#location" : "index.html#location"), T.locationLink); }
        if (key === "__contact__") { return T.contact + "<br>" + T.hours; }
        if (key === "__blog__") { return T.blog + link(root + (EN ? "en/blog/index.html" : "blog/index.html"), T.blogLink); }
        if (key === "__about__") { return T.about; }
        if (key === "maintenance-contracts") {
          return T.maint + link(root + (EN ? "en/services/" : "services/") + "cctv-maintenance.html", EN ? "CCTV Maintenance" : "صيانة الكاميرات") +
            " • " + link(root + (EN ? "en/services/" : "services/") + "maintenance-contracts.html", EN ? "Contracts" : "العقود");
        }
        return serviceAnswer(key, KEYWORDS[k][2]);
      }
    }
    if (/thanks|شكر|ممتاز|حلو|تمام|ok\b/.test(text)) { return T.thanks; }
    return null; /* لم يُفهم */
  }

  function handle(q, label) {
    if (busy) { return; }
    busy = true;
    addMsg((label || q).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }), "me");
    showTyping(function () {
      var ans = reply(q, label);
      if (ans === null) {
        addMsg(T.fallback);
        setChips(defaultChips());
      } else {
        addMsg(ans);
        setChips(followUps());
      }
      busy = false;
    });
  }

  function defaultChips() {
    return T.chips.map(function (c, i) { return { label: c, text: c, key: i }; });
  }
  function followUps() {
    return EN
      ? [{ label: "Get a quote", text: "quote" }, { label: "Location", text: "location" }, { label: "All services", text: "services" }, { label: "Contact us", text: "contact" }]
      : [{ label: "عرض سعر", text: "quote" }, { label: "موقعنا", text: "location" }, { label: "كل الخدمات", text: "services" }, { label: "تواصل معنا", text: "contact" }];
  }

  /* ---------- فتح/إغلاق ---------- */
  function open() {
    panel.hidden = false;
    fab.classList.add("open");
    document.getElementById("mkBot").classList.add("open");
    fab.setAttribute("aria-expanded", "true");
    opened = true;
    if (!greeted) {
      greeted = true;
      showTyping(function () {
        addMsg(T.hello);
        setChips(defaultChips());
        setTimeout(function () { input.focus(); }, 300);
      }, 650);
    }
  }
  function close() {
    panel.hidden = true;
    document.getElementById("mkBot").classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
  }
  fab.addEventListener("click", function () { opened ? close() : open(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && opened) { close(); }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) { return; }
    input.value = "";
    handle(v, v);
  });
})();
