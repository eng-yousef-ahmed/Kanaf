/* سكربت الصفحات الفرعية (صفحات الخدمات): القائمة، شريط التقدم، زر الأعلى،
   الأعمال المرتبطة من content/site-data.js */
(function () {
  "use strict";

  var y = document.getElementById("year");
  if (y) { y.textContent = new Date().getFullYear(); }

  /* شريط التقدم + زر الأعلى */
  var bar = document.getElementById("progressBar"), toTop = document.getElementById("toTop");
  window.addEventListener("scroll", function () {
    var d = document.documentElement;
    if (bar) { bar.style.width = (d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight)) * 100 + "%"; }
    if (toTop) { toTop.classList.toggle("show", window.scrollY > 500); }
  }, { passive: true });
  if (toTop) { toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); }); }

  /* القائمة الجوالة */
  var burger = document.getElementById("burger"), menu = document.getElementById("navLinks");
  if (burger && menu) {
    function closeMenu() { burger.classList.remove("open"); menu.classList.remove("open"); }
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      burger.classList.toggle("open"); menu.classList.toggle("open");
    });
    /* إغلاق القائمة عند الضغط خارجها أو اختيار رابط */
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("open") && !menu.contains(e.target)) { closeMenu(); }
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { closeMenu(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMenu(); }
    });
  }

  /* فلتر معرض الأعمال (في الصفحة الإنجليزية) */
  document.querySelectorAll(".pf-filter button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".pf-filter button").forEach(function (b) { b.classList.remove("on"); });
      btn.classList.add("on");
      var key = btn.getAttribute("data-filter");
      document.querySelectorAll(".pf-card").forEach(function (card) {
        var cats = (card.getAttribute("data-cat") || "").split(" ");
        card.classList.toggle("hide", !(key === "all" || cats.indexOf(key) > -1));
      });
    });
  });

  /* ظهور العناصر */
  document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });

  /* الأعمال المرتبطة */
  var D = window.KANAF_DATA;
  var box = document.getElementById("relatedProjects");
  if (!D || !box) { return; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var EN = document.documentElement.lang === "en";
  var E = window.KANAF_DATA_EN || { projects: {} };
  var root = box.getAttribute("data-root") || "../";
  var wanted = (box.getAttribute("data-cats") || "").split(" ").filter(Boolean);
  var items = (D.projects || []).map(function (p) {
    return EN ? Object.assign({}, p, E.projects[p.id] || {}) : p;
  }).filter(function (p) {
    if (p.portfolio === false) { return false; }
    return (p.cats || []).some(function (c) { return wanted.indexOf(c) > -1; });
  });

  if (!items.length) {
    var wrap = document.getElementById("relatedWrap");
    if (wrap) { wrap.style.display = "none"; }
    return;
  }

  box.innerHTML = items.slice(0, 3).map(function (p) {
    var tags = (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
    var img = p.image ? '<img src="' + root + esc(p.image) + '" alt="' + esc(p.imageAlt || p.title) + '" loading="lazy" onerror="this.style.visibility=\'hidden\'">' : "";
    return '<div class="pf-card" data-cat="' + esc((p.cats || []).join(" ")) + '">' +
      '<div class="pf-media"><span class="pf-cat">' + esc(p.sector) + "</span>" + img + "</div>" +
      '<div class="pf-body"><h4>' + esc(p.shortTitle || p.title) + '</h4><span class="cl">' + esc(p.client) + "</span>" +
      "<p>" + esc(p.shortDesc || p.desc) + "</p>" +
      (tags ? '<div class="pf-tags">' + tags + "</div>" : "") + "</div></div>";
  }).join("");
  box.querySelectorAll(".pf-card").forEach(function (c) { c.classList.add("in"); });
})();
