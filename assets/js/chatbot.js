/* شات بوت «مكه» — يقرأ المحتوى من content/chatbot.json ويعمل بالعربي والإنجليزي. */
(function () {
  "use strict";

  var STORAGE_KEY = "kanaf-makkah-v2";
  var pageLang = document.documentElement.lang === "en" ? "en" : "ar";

  var FALLBACK = {
    name: { ar: "مكه", en: "Makkah" },
    role: { ar: "المساعد الذكي لموقع كنف", en: "Smart assistant for the Kanaf website" },
    avatar: { ar: "م", en: "M" },
    manager: {
      name: { ar: "المهندس محمد طلعت", en: "Eng. Mohamed Talat" },
      title: { ar: "مدير المشروعات", en: "Project Manager" },
      phoneDisplay: "+966 56 864 6500",
      note: {
        ar: "رقم التواصل معه: +966 56 864 6500 — اتصال أو واتساب.",
        en: "His contact number is +966 56 864 6500 — call or WhatsApp."
      }
    },
    contact: {
      phone: "+966568646500",
      phoneDisplay: "+966 56 864 6500",
      email: "Kanaf.S.Systems@gmail.com",
      address: {
        ar: "7716 زنباع بن سلامة، الحمراء أم الجود، مكة المكرمة 24331",
        en: "7716 Zunbaa bin Salama St., Umm Al Joud, Makkah 24331"
      },
      hours: {
        ar: "السبت – الخميس: 9 صباحاً – 10 مساءً · الجمعة: مغلق",
        en: "Saturday–Thursday: 9:00–22:00 · Friday: closed"
      }
    },
    ui: {
      ar: {
        open: "افتح محادثة مكه", close: "إغلاق المحادثة", placeholder: "اكتب سؤالك…", send: "إرسال",
        typing: "مكه تكتب", managerLabel: "مدير المشروعات", contactLabel: "التواصل", addressLabel: "العنوان",
        hoursLabel: "ساعات المعرض", phoneLabel: "الجوال", emailLabel: "البريد", quickLabel: "اقتراحات",
        hello: "أهلاً", helloAria: "فقاعة ترحيب مكه"
      },
      en: {
        open: "Open Makkah chat", close: "Close chat", placeholder: "Type your question…", send: "Send",
        typing: "Makkah is typing", managerLabel: "Project Manager", contactLabel: "Contact", addressLabel: "Address",
        hoursLabel: "Showroom hours", phoneLabel: "Mobile", emailLabel: "Email", quickLabel: "Suggestions",
        hello: "Hi", helloAria: "Makkah greeting bubble"
      }
    },
    welcome: {
      ar: ["أهلاً بك، أنا مكه. تعذر تحميل ملف الإجابات، وتقدر تتواصل مباشرة من الأزرار."],
      en: ["Hello, I'm Makkah. The answer file could not be loaded. Use the buttons to reach us directly."]
    },
    quickReplies: [
      { id: "manager", label: { ar: "مدير المشروعات", en: "Project manager" } },
      { id: "contact", label: { ar: "التواصل", en: "Contact" } }
    ],
    actionCatalog: [
      { id: "call", label: { ar: "اتصال", en: "Call" }, href: "tel:+966568646500" },
      { id: "whatsapp", label: { ar: "واتساب", en: "WhatsApp" }, href: "https://wa.me/966568646500" },
      { id: "email", label: { ar: "بريد", en: "Email" }, href: "mailto:Kanaf.S.Systems@gmail.com" }
    ],
    intents: [
      {
        id: "identity",
        keywords: [
          "انت مين", "انتي مين", "حضرتك مين", "من انت", "من انتي", "عرفني بنفسك", "اسمك ايه",
          "who are you", "what's your name", "who r u", "enta meen"
        ],
        reply: {
          ar: ["أنا مكه، المساعد الذكي لموقع مؤسسة كنف. أقدر أوجهك للخدمة أو المعلومة اللي تدور عليها، وأنا مساعدة مدير المشروعات المهندس محمد طلعت."],
          en: ["I'm Makkah, the smart assistant for the Kanaf website. I can guide you to the service or information you're looking for, and I'm the assistant to the project manager, Eng. Mohamed Talat."]
        },
        show: ["manager"],
        actions: ["call", "whatsapp"]
      }
    ],
    fallback: {
      reply: {
        ar: ["تواصل مع مؤسسة كنف مباشرة عبر الاتصال أو واتساب على +966 56 864 6500."],
        en: ["Contact Kanaf directly by call or WhatsApp on +966 56 864 6500."]
      },
      actions: ["call", "whatsapp", "email"],
      show: ["manager", "contact"]
    }
  };

  function t(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.ar || value.en || "";
  }

  function lines(value, lang) {
    var v = t(value, lang);
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && !value.ar && !value.en) return [];
    if (Array.isArray(v)) return v;
    return v ? [v] : [];
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function replyLang(text) {
    var latin = (String(text).match(/[A-Za-z]/g) || []).length;
    var arabic = (String(text).match(/[\u0600-\u06FF]/g) || []).length;
    if (latin > arabic && latin >= 3) return "en";
    if (arabic > latin && arabic >= 2) return "ar";
    return pageLang;
  }

  /* norm() يسيب مسافات حول النص، فمطابقة الكلمات بتكون بحدود مسافات
     لأن \b في جافاسكريبت ما يعرفش الحروف العربية. */
  function pad(q) { return " " + norm(q) + " "; }

  function token(q, word) { return q.indexOf(" " + word + " ") !== -1; }

  function anyToken(q, words) {
    for (var i = 0; i < words.length; i++) if (token(q, words[i])) return true;
    return false;
  }

  /* العربيزي (عربي مكتوب بحروف لاتينية) — يُرد عليه بالعربي لأنه نفس لغة السؤال. */
  var ARABIZI = ["meen", "enta", "enti", "enty", "anta", "anti", "ismak", "ismik", "esmak",
    "esmik", "ismk", "3arfni", "3arfeeni", "shukran", "mumkin", "3aiz", "3aiza", "3andak",
    "keef", "kayfa", "aish", "esh", "3arbi", "3arabi", "yalla", "eh", "eih"];

  /* سؤال الهوية عن «مكه» نفسها: «انت مين»، «عرفني بنفسك»، «who are you»، «who r u»…
     منفصل تماماً عن «من أنتم» (عن المؤسسة) و«مين المدير» (عن المهندس محمد طلعت). */
  var SELF = ["انت", "انتي", "انتي", "حضرتك", "حضرتكي", "you", "u",
    "enta", "enti", "enty", "anta", "anti"];
  var WHO = ["مين", "who", "whom", "من", "whos"];
  var NAME = ["اسمك", "name", "ismak", "ismik", "esmak", "esmik", "ismk"];
  var NAME_ASK = ["ما", "ايش", "ايه", "شو", "عرفني", "whats", "what", "wht", "ur", "your",
    "tell", "know", "eh", "eih"];
  var PLURAL = ["انتم", "انتوا", "guys", "yall"];

  function isIdentity(text) {
    var q = pad(text);
    if (anyToken(q, PLURAL) || q.indexOf(" you all ") !== -1) return false;
    if (anyToken(q, WHO) && anyToken(q, SELF)) return true;
    if (anyToken(q, NAME) && anyToken(q, NAME_ASK)) return true;
    /* «عرفني بنفسك» / «عرفينا بنفسك» / «عرف عن نفسك» */
    if (q.indexOf("عرف") !== -1 && q.indexOf("نفسك") !== -1) return true;
    return false;
  }

  function probeIdentity(pack, text) {
    if (!isIdentity(text)) return null;
    return findIntent(pack, "identity");
  }

  function detectLang(text) {
    if (anyToken(pad(text), ARABIZI)) return "ar";
    return replyLang(text);
  }

  function scriptSrc() {
    var list = document.getElementsByTagName("script");
    for (var i = 0; i < list.length; i++) {
      if ((list[i].getAttribute("src") || "").indexOf("chatbot.js") !== -1) return list[i].src;
    }
    return "";
  }

  function siteRoot() {
    var src = scriptSrc();
    try {
      if (src) return new URL("../../", src);
    } catch (e) { /* ignore */ }
    return new URL("./", location.href);
  }

  function jsonUrl() {
    try {
      return new URL("../../content/chatbot.json", scriptSrc() || location.href).href;
    } catch (e) {
      return "content/chatbot.json";
    }
  }

  function safeHref(href) {
    if (!href) return "";
    if (/^(https?:\/\/|tel:|mailto:)/i.test(href)) return href;
    if (/^[a-z0-9_./#?-]+$/i.test(href)) return href;
    return "";
  }

  function absHref(href, lang) {
    var raw = safeHref(t(href, lang));
    if (!raw) return "";
    if (/^(https?:\/\/|tel:|mailto:)/i.test(raw)) return raw;
    try { return new URL(raw, siteRoot()).href; } catch (e) { return raw; }
  }

  function findIntent(pack, id) {
    var list = pack.intents || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function includesKeyword(q, nk) {
    if (!nk || nk.length < 2) return false;
    if (q === nk) return true;
    var latin = /^[a-z0-9 ]+$/.test(nk);
    if (latin && nk.replace(/\s/g, "").length < 4) {
      return (" " + q + " ").indexOf(" " + nk + " ") !== -1;
    }
    return q.indexOf(nk) !== -1;
  }

  function matchIntent(pack, text) {
    var q = norm(text);
    if (!q) return null;
    var best = null;
    var bestScore = 0;
    (pack.intents || []).forEach(function (intent) {
      var score = 0;
      (intent.keywords || []).forEach(function (k) {
        var nk = norm(k);
        if (includesKeyword(q, nk)) score += nk.length;
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    return best;
  }

  function loadState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return { open: false, messages: [] };
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.messages)) return { open: false, messages: [] };
      return data;
    } catch (e) {
      return { open: false, messages: [] };
    }
  }

  function saveState(state) {
    try {
      var copy = {
        open: !!state.open,
        messages: state.messages.slice(-40)
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch (e) { /* private mode */ }
  }

  /* حارسة الأمن «مكه» — بدل أيقونة فقاعة المحادثة.
     شعار المؤسسة على الصدر هو الرمز الحقيقي #kanafEmblem الموجود في كل صفحات الموقع
     (نفس الرمز الذي ينتجه scripts/build_pages.py)، بدون أي مكتبة خارجية. */
  function guardSvg() {
    return '' +
    '<svg class="mk-guard" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' +
      '<ellipse class="mk-g-shadow" cx="60" cy="134" rx="29" ry="4.6"/>' +
      '<g class="mk-g-legs">' +
        '<path d="M47 98h12v27H47z" fill="#16233c"/>' +
        '<path d="M61 98h12v27H61z" fill="#16233c"/>' +
        '<rect x="43" y="123" width="18" height="9" rx="4" fill="#0e1216"/>' +
        '<rect x="59" y="123" width="18" height="9" rx="4" fill="#0e1216"/>' +
      '</g>' +
      '<g class="mk-g-arm-back">' +
        '<path d="M43 62q-11 3-13 17-1 9 1 15 3 5 8 1-3-8-2-15 1-10 8-13z" fill="#16233c"/>' +
        '<circle cx="34" cy="97" r="5.4" fill="#e8b48c"/>' +
      '</g>' +
      '<g class="mk-g-head">' +
        '<rect x="54" y="45" width="12" height="12" fill="#d9a077"/>' +
        '<ellipse cx="43" cy="37" rx="3.2" ry="4.4" fill="#d9a077"/>' +
        '<ellipse cx="77" cy="37" rx="3.2" ry="4.4" fill="#d9a077"/>' +
        '<ellipse cx="60" cy="34" rx="17" ry="18" fill="#e8b48c"/>' +
        '<g class="mk-g-look"><g class="mk-g-eyes">' +
          '<ellipse cx="53" cy="38" rx="3.1" ry="3.6" fill="#14181c"/>' +
          '<ellipse cx="67" cy="38" rx="3.1" ry="3.6" fill="#14181c"/>' +
          '<circle cx="54.1" cy="36.7" r="1" fill="#fff"/>' +
          '<circle cx="68.1" cy="36.7" r="1" fill="#fff"/>' +
        '</g></g>' +
        '<path d="M53 46q7 5 14 0" fill="none" stroke="#a9714f" stroke-width="2" stroke-linecap="round"/>' +
        '<g class="mk-g-cap">' +
          '<path d="M43 24q17-20 34 0z" fill="#1b2a4a"/>' +
          '<rect x="41.5" y="21.5" width="37" height="6.5" rx="3.2" fill="#16233c"/>' +
          '<path d="M38.5 27.5q21.5 8.5 43 0 1.2 4.2-3 5.3-18.5 5.2-37 0-4.2-1.1-3-5.3z" fill="#0e1216"/>' +
          '<path d="M60 10.5l5.4 2.6-1 6.4-4.4 3.4-4.4-3.4-1-6.4z" fill="var(--green2,#63a97a)"/>' +
        '</g>' +
      '</g>' +
      '<g class="mk-g-torso">' +
        '<path d="M37 61q23-9 46 0l3 40q-26 7-52 0z" fill="#1b2a4a"/>' +
        '<path d="M60 55l11 6-11 12-11-12z" fill="#243759"/>' +
        '<path d="M37 61q23-9 46 0" fill="none" stroke="var(--green2,#63a97a)" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M37 61l13-4 2 7-13 4z" fill="var(--green,#4f8c62)"/>' +
        '<path d="M83 61l-13-4-2 7 13 4z" fill="var(--green,#4f8c62)"/>' +
        '<rect x="39" y="90" width="42" height="6.5" rx="3.2" fill="#0e1216"/>' +
        '<rect x="55" y="89" width="10" height="8.5" rx="2" fill="var(--green2,#63a97a)"/>' +
        '<g class="mk-g-badge">' +
          '<rect x="47" y="64" width="26" height="27" rx="5.5" fill="#f7f5f1" stroke="var(--green2,#63a97a)" stroke-width="1.6"/>' +
          '<svg x="49.6" y="66.4" width="20.8" height="21.7" viewBox="0 0 240 250"><use href="#kanafEmblem"/></svg>' +
        '</g>' +
      '</g>' +
      '<g class="mk-g-arm-wave">' +
        '<path d="M77 62q12 1 16-8 4-9 2-18-1-5-6-4-5 1-4 6 1 8-2 12-4 5-9 5z" fill="#1b2a4a"/>' +
        '<path d="M88 44q6-2 9-7l4 3q-4 6-10 8z" fill="var(--green2,#63a97a)"/>' +
        '<circle cx="97" cy="34" r="5.8" fill="#e8b48c"/>' +
      '</g>' +
    '</svg>';
  }

  function boot(pack) {
    var state = loadState();
    var uiLang = pageLang;

    var root = document.createElement("div");
    root.className = "mk-root";
    root.innerHTML =
      '<button class="mk-launcher" type="button" aria-expanded="false" aria-controls="mkPanel">' +
        '<span class="mk-hello" aria-hidden="true"></span>' +
        guardSvg() +
        '<span class="mk-launcher-name"></span>' +
      "</button>" +
      '<div class="mk-backdrop" aria-hidden="true"></div>' +
      '<section class="mk-panel" id="mkPanel" role="dialog" aria-modal="true" hidden>' +
        '<header class="mk-head">' +
          '<span class="mk-avatar" aria-hidden="true"></span>' +
          '<span class="mk-id"><strong id="mkTitle"></strong><small></small></span>' +
          '<button class="mk-close" type="button" aria-label=""></button>' +
        "</header>" +
        '<div class="mk-log" aria-live="polite"></div>' +
        '<div class="mk-quick" role="group"></div>' +
        '<form class="mk-form">' +
          '<label class="mk-sr"></label>' +
          '<input type="text" maxlength="500" autocomplete="off" enterkeyhint="send">' +
          '<button type="submit"></button>' +
        "</form>" +
      "</section>";
    document.body.appendChild(root);

    var launcher = root.querySelector(".mk-launcher");
    var backdrop = root.querySelector(".mk-backdrop");
    var panel = root.querySelector(".mk-panel");
    var log = root.querySelector(".mk-log");
    var quick = root.querySelector(".mk-quick");
    var form = root.querySelector(".mk-form");
    var input = form.querySelector("input");
    var sendBtn = form.querySelector("button");
    var closeBtn = root.querySelector(".mk-close");
    var title = root.querySelector("#mkTitle");
    var role = root.querySelector(".mk-id small");
    var avatar = root.querySelector(".mk-avatar");
    var hello = root.querySelector(".mk-hello");
    var lastFocus = null;
    var previousBodyOverflow = "";
    var replyPending = false;

    function ui(lang) { return (pack.ui && pack.ui[lang]) || pack.ui.ar; }

    function paintChrome(lang) {
      var U = ui(lang);
      launcher.setAttribute("aria-label", U.open);
      root.querySelector(".mk-launcher-name").textContent = t(pack.name, lang);
      hello.textContent = U.hello || (lang === "en" ? "Hi" : "أهلاً");
      title.textContent = t(pack.name, lang);
      role.textContent = t(pack.role, lang);
      avatar.textContent = t(pack.avatar, lang);
      closeBtn.setAttribute("aria-label", U.close);
      closeBtn.textContent = "×";
      input.placeholder = U.placeholder;
      input.setAttribute("aria-label", U.placeholder);
      sendBtn.textContent = U.send;
      quick.setAttribute("aria-label", U.quickLabel);
      panel.setAttribute("aria-labelledby", "mkTitle");
      panel.lang = lang;
      panel.dir = lang === "en" ? "ltr" : "rtl";
    }

    function actionById(id) {
      var list = pack.actionCatalog || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    }

    function addActions(parent, ids, lang) {
      if (!ids || !ids.length) return;
      var bar = document.createElement("div");
      bar.className = "mk-actions";
      ids.forEach(function (id) {
        var spec = actionById(id);
        if (!spec) return;
        var href = absHref(spec.href, lang);
        if (!href) return;
        var a = document.createElement("a");
        a.href = href;
        a.textContent = t(spec.label, lang);
        if (/^https?:/i.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
        bar.appendChild(a);
      });
      if (bar.childNodes.length) parent.appendChild(bar);
    }

    function addCard(parent, kind, lang) {
      var U = ui(lang);
      var card = document.createElement("div");
      card.className = "mk-card";
      if (kind === "manager" && pack.manager) {
        card.appendChild(Object.assign(document.createElement("span"), { className: "mk-k", textContent: U.managerLabel }));
        var name = document.createElement("b");
        name.textContent = t(pack.manager.name, lang);
        card.appendChild(name);
        var titleEl = document.createElement("span");
        titleEl.className = "mk-sub";
        titleEl.textContent = t(pack.manager.title, lang);
        card.appendChild(titleEl);
        var mgrPhone = pack.manager.phoneDisplay || (pack.contact && pack.contact.phoneDisplay);
        if (mgrPhone) {
          var mgrNum = document.createElement("b");
          mgrNum.className = "mk-ltr";
          mgrNum.textContent = mgrPhone;
          card.appendChild(mgrNum);
        }
        if (pack.manager.note) {
          var note = document.createElement("p");
          note.textContent = t(pack.manager.note, lang);
          card.appendChild(note);
        }
      }
      if (kind === "contact" && pack.contact) {
        var c = pack.contact;
        card.appendChild(Object.assign(document.createElement("span"), { className: "mk-k", textContent: U.contactLabel }));
        var phone = document.createElement("b");
        phone.className = "mk-ltr";
        phone.textContent = c.phoneDisplay || c.phone;
        card.appendChild(phone);
        var mail = document.createElement("span");
        mail.className = "mk-ltr";
        mail.textContent = c.email;
        card.appendChild(mail);
        [["addressLabel", c.address], ["hoursLabel", c.hours]].forEach(function (row) {
        var line = document.createElement("p");
        var lab = document.createElement("b");
        lab.textContent = U[row[0]] + ": ";
        line.appendChild(lab);
        line.appendChild(document.createTextNode(t(row[1], lang)));
        card.appendChild(line);
      });
      }
      parent.appendChild(card);
    }

    function addLinks(parent, links, lang) {
      if (!links || !links.length) return;
      var wrap = document.createElement("div");
      wrap.className = "mk-links";
      links.forEach(function (link) {
        var href = absHref(link.href, lang);
        if (!href) return;
        var a = document.createElement("a");
        a.href = href;
        a.textContent = t(link.label, lang);
        wrap.appendChild(a);
      });
      if (wrap.childNodes.length) parent.appendChild(wrap);
    }

    function bubble(from, text, extras, lang) {
      var msg = document.createElement("div");
      msg.className = "mk-msg " + (from === "user" ? "user" : "bot");
      msg.lang = lang || pageLang;
      msg.dir = msg.lang === "en" ? "ltr" : "rtl";
      var p = document.createElement("p");
      p.textContent = text;
      msg.appendChild(p);
      if (extras) {
        (extras.show || []).forEach(function (kind) { addCard(msg, kind, lang); });
        addLinks(msg, extras.links, lang);
        addActions(msg, extras.actions, lang);
      }
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;
      return msg;
    }

    function renderQuick(lang) {
      quick.innerHTML = "";
      (pack.quickReplies || []).forEach(function (q) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = t(q.label, lang);
        b.addEventListener("click", function () { ask(t(q.label, lang), q.id); });
        quick.appendChild(b);
      });
    }

    function setOpen(open) {
      state.open = open;
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
      launcher.hidden = open;
      root.classList.toggle("is-open", open);
      saveState(state);
      if (open) {
        lastFocus = document.activeElement;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        paintChrome(uiLang);
        setTimeout(function () { if (state.open) input.focus(); }, 30);
      } else {
        document.body.style.overflow = previousBodyOverflow;
        launcher.hidden = false;
        if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
        else launcher.focus();
      }
    }

    function extrasOf(intent) {
      if (!intent) return null;
      return { show: intent.show || [], links: intent.links || [], actions: intent.actions || [] };
    }

    function pushBot(text, extras, lang, persist) {
      bubble("bot", text, extras, lang);
      if (persist) {
        state.messages.push({ from: "bot", text: text, lang: lang, extras: extras || null });
        saveState(state);
      }
    }

    function answer(intent, lang, userText) {
      var chosen = intent || pack.fallback;
      var replies = lines(chosen.reply, lang);
      if (!replies.length) replies = lines(pack.fallback.reply, lang);
      var extras = extrasOf(chosen);
      var typing = document.createElement("div");
      typing.className = "mk-msg bot mk-typing";
      typing.textContent = ui(lang).typing;
      log.appendChild(typing);
      log.scrollTop = log.scrollHeight;
      replyPending = true;
      input.disabled = true;
      sendBtn.disabled = true;
      quick.querySelectorAll("button").forEach(function (button) { button.disabled = true; });
      window.setTimeout(function () {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        replies.forEach(function (line, i) {
          pushBot(line, i === replies.length - 1 ? extras : null, lang, true);
        });
        replyPending = false;
        input.disabled = false;
        sendBtn.disabled = false;
        quick.querySelectorAll("button").forEach(function (button) { button.disabled = false; });
      }, window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280);
      if (userText) uiLang = lang;
    }

    function ask(text, intentId) {
      if (replyPending) return;
      var clean = String(text || "").trim().slice(0, 500);
      if (!clean) return;
      var lang = detectLang(clean);
      if (lang !== uiLang) {
        uiLang = lang;
        paintChrome(lang);
        renderQuick(lang);
      }
      bubble("user", clean, null, lang);
      state.messages.push({ from: "user", text: clean, lang: lang });
      saveState(state);
      var intent = (intentId && findIntent(pack, intentId)) || probeIdentity(pack, clean) ||
        matchIntent(pack, clean) || pack.fallback;
      answer(intent, lang, clean);
      input.value = "";
    }

    function restore() {
      if (!state.messages.length) {
        lines(pack.welcome, pageLang).forEach(function (line) {
          pushBot(line, null, pageLang, true);
        });
        return;
      }
      state.messages.forEach(function (m) {
        bubble(m.from, m.text, m.from === "bot" ? m.extras : null, m.lang || pageLang);
      });
    }

    /* العينان والرأس يميلون نحو مؤشر الماوس — rAF واحد لكل إطار، وما يشتغلش على اللمس. */
    function trackCursor() {
      var guard = launcher.querySelector(".mk-guard");
      if (!guard || !window.matchMedia || !window.requestAnimationFrame) return;
      if (!window.matchMedia("(pointer: fine)").matches) return;
      var pending = 0, px = 0, py = 0;
      function apply() {
        pending = 0;
        if (launcher.hidden) return;
        var r = guard.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = (px - (r.left + r.width / 2)) / (r.width / 2);
        var ny = (py - (r.top + r.height * 0.28)) / (r.height / 2);
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));
        launcher.style.setProperty("--mk-ex", (nx * 3.4).toFixed(2) + "px");
        launcher.style.setProperty("--mk-ey", (ny * 2.6).toFixed(2) + "px");
        launcher.style.setProperty("--mk-hr", (nx * 6).toFixed(2) + "deg");
      }
      document.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY;
        if (!pending) pending = window.requestAnimationFrame(apply);
      }, { passive: true });
      document.addEventListener("pointerleave", function () {
        launcher.style.setProperty("--mk-ex", "0px");
        launcher.style.setProperty("--mk-ey", "0px");
        launcher.style.setProperty("--mk-hr", "0deg");
      });
    }

    paintChrome(pageLang);
    renderQuick(pageLang);
    restore();
    trackCursor();
    if (state.open) setOpen(true);

    launcher.addEventListener("click", function () { setOpen(true); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    backdrop.addEventListener("click", function () { setOpen(false); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });
    document.addEventListener("keydown", function (e) {
      if (!state.open) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      var focusable = panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) { e.preventDefault(); return; }
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    });
  }

  function start(pack) {
    if (document.body) boot(pack);
    else document.addEventListener("DOMContentLoaded", function () { boot(pack); });
  }

  if (window.fetch) {
    fetch(jsonUrl(), { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("chatbot.json"); return r.json(); })
      .then(start)
      .catch(function () { start(FALLBACK); });
  } else {
    start(FALLBACK);
  }
})();
