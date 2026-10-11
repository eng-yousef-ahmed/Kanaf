/* شات بوت «مكه» — يقرأ المحتوى من content/chatbot.json ويعمل بالعربي والإنجليزي. */
(function () {
  "use strict";

  var STORAGE_KEY = "kanaf-makkah-v2";
  var pageLang = document.documentElement.lang === "en" ? "en" : "ar";

  var FALLBACK = {
    name: { ar: "مكه", en: "Makkah" },
    role: { ar: "مساعدة مؤسسة كنف", en: "Kanaf assistant" },
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
        hoursLabel: "ساعات المعرض", phoneLabel: "الجوال", emailLabel: "البريد", quickLabel: "اقتراحات"
      },
      en: {
        open: "Open Makkah chat", close: "Close chat", placeholder: "Type your question…", send: "Send",
        typing: "Makkah is typing", managerLabel: "Project Manager", contactLabel: "Contact", addressLabel: "Address",
        hoursLabel: "Showroom hours", phoneLabel: "Mobile", emailLabel: "Email", quickLabel: "Suggestions"
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
    intents: [],
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

  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17.5 4 21l.8-3.6A8 8 0 1 1 12 20a8.4 8.4 0 0 1-3.2-.6"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  }

  function boot(pack) {
    var state = loadState();
    var uiLang = pageLang;

    var root = document.createElement("div");
    root.className = "mk-root";
    root.innerHTML =
      '<button class="mk-launcher" type="button" aria-expanded="false" aria-controls="mkPanel">' +
        icon() + '<span class="mk-launcher-name"></span>' +
      "</button>" +
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
          '<input type="text" maxlength="500" autocomplete="off">' +
          '<button type="submit"></button>' +
        "</form>" +
      "</section>";
    document.body.appendChild(root);

    var launcher = root.querySelector(".mk-launcher");
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
    var lastFocus = null;

    function ui(lang) { return (pack.ui && pack.ui[lang]) || pack.ui.ar; }

    function paintChrome(lang) {
      var U = ui(lang);
      launcher.setAttribute("aria-label", U.open);
      root.querySelector(".mk-launcher-name").textContent = t(pack.name, lang);
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
        paintChrome(uiLang);
        setTimeout(function () { input.focus(); }, 30);
      } else {
        launcher.hidden = false;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
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
      window.setTimeout(function () {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        replies.forEach(function (line, i) {
          pushBot(line, i === replies.length - 1 ? extras : null, lang, true);
        });
      }, window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280);
      if (userText) uiLang = lang;
    }

    function ask(text, intentId) {
      var clean = String(text || "").trim().slice(0, 500);
      if (!clean) return;
      var lang = replyLang(clean);
      if (lang !== uiLang) {
        uiLang = lang;
        paintChrome(lang);
        renderQuick(lang);
      }
      bubble("user", clean, null, lang);
      state.messages.push({ from: "user", text: clean, lang: lang });
      saveState(state);
      var intent = (intentId && findIntent(pack, intentId)) || matchIntent(pack, clean) || pack.fallback;
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

    paintChrome(pageLang);
    renderQuick(pageLang);
    restore();
    if (state.open) setOpen(true);

    launcher.addEventListener("click", function () { setOpen(true); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.open) setOpen(false);
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
