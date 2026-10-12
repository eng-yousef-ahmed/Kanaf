/* Optional, consent-based GA4 event measurement for Kanaf.
   Set measurementId to the web stream ID (G-...) to enable it. */
(function () {
  "use strict";

  var config = window.KANAF_ANALYTICS_CONFIG || { measurementId: "G-87FN3L3NQ2" };
  var id = String(config.measurementId || "").trim();
  var consentKey = "kanaf-analytics-consent-v1";
  var language = document.documentElement.lang === "en" ? "en" : "ar";
  var copy = language === "en" ? {
    settings: "Analytics preferences",
    heading: "Help us improve the site",
    message: "Optional analytics help us understand visits and contact actions. We never send names, phone numbers, or form message content.",
    accept: "Allow analytics", reject: "Reject", saved: "Your choice has been saved.",
    unavailable: "Analytics is not configured yet. No analytics data is being sent.", close: "Close"
  } : {
    settings: "إعدادات قياس الاستخدام",
    heading: "ساعدنا على تحسين الموقع",
    message: "تساعدنا التحليلات الاختيارية على فهم الزيارات وطرق التواصل. لا نرسل الأسماء أو أرقام الجوال أو محتوى الرسائل.",
    accept: "السماح بالتحليلات", reject: "رفض", saved: "تم حفظ اختيارك.",
    unavailable: "لم يتم إعداد التحليلات بعد؛ لا تُرسل أي بيانات قياس.", close: "إغلاق"
  };
  var gtag;

  function getConsent() {
    try { return window.localStorage.getItem(consentKey); } catch (_) { return null; }
  }

  function setConsent(value) {
    try { window.localStorage.setItem(consentKey, value); } catch (_) { /* Storage may be disabled. */ }
  }

  function loadTag() {
    if (!id || gtag) return;
    window.dataLayer = window.dataLayer || [];
    gtag = function () { window.dataLayer.push(arguments); };
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", id, { send_page_view: true });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function event(name, params) {
    if (getConsent() !== "granted" || !id || !gtag) return;
    gtag("event", name, params || {});
  }

  function emitVitals() {
    if (!window.PerformanceObserver) return;
    var supported = PerformanceObserver.supportedEntryTypes || [];
    if (supported.indexOf("largest-contentful-paint") !== -1) {
      var lcp = 0;
      var lcpObserver = new PerformanceObserver(function (list) {
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if (last) lcp = Math.round(last.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          lcpObserver.takeRecords().forEach(function (entry) { lcp = Math.round(entry.startTime); });
          if (lcp) event("web_vital", { metric_name: "LCP", metric_value: lcp });
          lcpObserver.disconnect();
        }
      }, { once: true });
    }
    if (supported.indexOf("layout-shift") !== -1) {
      var cls = 0;
      var clsObserver = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) { if (!entry.hadRecentInput) cls += entry.value; });
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          event("web_vital", { metric_name: "CLS", metric_value: Math.round(cls * 1000) / 1000 });
          clsObserver.disconnect();
        }
      }, { once: true });
    }
    if (supported.indexOf("event") !== -1) {
      var interactions = Object.create(null);
      var inpObserver = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.interactionId) interactions[entry.interactionId] = Math.max(interactions[entry.interactionId] || 0, entry.duration);
        });
      });
      inpObserver.observe({ type: "event", buffered: true, durationThreshold: 40 });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          var values = Object.keys(interactions).map(function (key) { return interactions[key]; }).sort(function (a, b) { return b - a; });
          if (values.length) event("web_vital", { metric_name: "INP_candidate", metric_value: Math.round(values[0]) });
          inpObserver.disconnect();
        }
      }, { once: true });
    }
  }

  function recordConsent(choice) {
    setConsent(choice);
    if (choice === "granted") {
      loadTag();
      emitVitals();
      event("analytics_consent", { consent_choice: "granted" });
    }
    closeDialog();
    showNotice(copy.saved);
  }

  var dialog;
  function closeDialog() {
    if (dialog) { dialog.remove(); dialog = null; }
  }

  function showNotice(message) {
    var notice = document.createElement("div");
    notice.className = "analytics-notice";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    document.body.appendChild(notice);
    window.setTimeout(function () { notice.remove(); }, 3500);
  }

  function openDialog() {
    closeDialog();
    dialog = document.createElement("section");
    dialog.className = "analytics-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "analyticsDialogTitle");
    var title = document.createElement("h2");
    title.id = "analyticsDialogTitle";
    title.textContent = copy.heading;
    var desc = document.createElement("p");
    desc.textContent = id ? copy.message : copy.unavailable;
    var actions = document.createElement("div");
    actions.className = "analytics-actions";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "analytics-close";
    close.textContent = copy.close;
    close.addEventListener("click", closeDialog);
    actions.appendChild(close);
    if (id) {
      var reject = document.createElement("button");
      reject.type = "button";
      reject.className = "analytics-reject";
      reject.textContent = copy.reject;
      reject.addEventListener("click", function () { recordConsent("denied"); });
      var accept = document.createElement("button");
      accept.type = "button";
      accept.className = "analytics-accept";
      accept.textContent = copy.accept;
      accept.addEventListener("click", function () { recordConsent("granted"); });
      actions.appendChild(reject);
      actions.appendChild(accept);
    }
    dialog.appendChild(title);
    dialog.appendChild(desc);
    dialog.appendChild(actions);
    document.body.appendChild(dialog);
    (id ? dialog.querySelector(".analytics-accept") : close).focus();
  }

  document.querySelectorAll("[data-analytics-preferences]").forEach(function (button) {
    button.textContent = copy.settings;
    button.addEventListener("click", openDialog);
  });

  if (id && getConsent() === "granted") {
    loadTag();
    emitVitals();
  } else if (id && getConsent() !== "denied") {
    window.addEventListener("load", openDialog, { once: true });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a[href]");
    if (link) {
      var href = link.getAttribute("href") || "";
      var channel = href.indexOf("wa.me/") !== -1 ? "whatsapp" :
        href.indexOf("tel:") === 0 ? "phone" : href.indexOf("mailto:") === 0 ? "email" : "";
      if (channel) event("contact_click", { contact_method: channel, page_path: location.pathname });
      if (/(?:^|\/)services\/[^/]+\.html(?:$|#)/.test(href)) {
        event("service_detail_click", { page_path: location.pathname });
      }
    }
    var summary = e.target.closest && e.target.closest(".pf-details > summary");
    if (summary) event("project_details_open", { page_path: location.pathname });
  });

  document.addEventListener("kanaf:quote-ready", function () {
    event("quote_request_whatsapp", { page_path: location.pathname, language: language });
  });

  window.KanafAnalytics = { event: event, openPreferences: openDialog };
})();
