/* يبني أقسام المشاريع والعملاء من content/site-data.js
   لا تعدّل هذا الملف عادةً — عدّل البيانات في content/site-data.js */
(function () {
  "use strict";
  var D = window.KANAF_DATA;
  if (!D) { return; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* لو الصورة مش موجودة، الإطار بيفضل بخلفية متدرجة (من CSS) */
  function img(src, alt) {
    if (!src) { return ""; }
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" onerror="this.style.visibility=\'hidden\'">';
  }

  var TICK = '<span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg>';

  var projects = D.projects || [];
  var featured = projects.filter(function (p) { return p.featured; })[0] || projects[0];

  function featuredVisual(p) {
    var locs = (p.locations || []).map(function (l) { return "<span>" + esc(l) + "</span>"; }).join("");
    return '<div class="proj-visual">' + img(p.image, p.imageAlt || p.title) +
      (locs ? '<div class="proj-loc">' + locs + "</div>" : "") + "</div>";
  }

  function featuredStats(p) {
    if (!p.stats || !p.stats.length) { return ""; }
    return '<div class="proj-stats">' + p.stats.map(function (s) {
      return '<div class="pstat"><b>' + esc(s.value) + "</b><small>" + esc(s.label) + "</small></div>";
    }).join("") + "</div>";
  }

  /* الصفحة الرئيسية: المشروع المميز مختصر */
  var homeEl = document.getElementById("homeFeatured");
  if (homeEl && featured) {
    homeEl.innerHTML =
      '<div class="sec-head reveal"><span class="sec-num">سابقة أعمال</span><h2>مشروع مميز: ' + esc(featured.shortTitle || featured.title) + "</h2><p>" + esc(featured.client) + "</p></div>" +
      '<div class="proj-card reveal">' + featuredVisual(featured) +
      '<div class="proj-body"><h3>' + esc(featured.title) + "</h3><p>" + esc(featured.desc) + "</p>" + featuredStats(featured) +
      '<a href="#projects" data-nav="projects" class="link-more">تفاصيل المشروع ومعرض الأعمال ' + ARROW + "</a></div></div>";
  }

  /* صفحة المشاريع: المشروع المميز كامل */
  var projEl = document.getElementById("projFeatured");
  if (projEl && featured) {
    var scope = (featured.scope || []).map(function (t) { return "<li>" + TICK + esc(t) + "</li>"; }).join("");
    projEl.innerHTML =
      '<div class="sec-head reveal"><span class="sec-num">مشروع مميز</span><h2>' + esc(featured.shortTitle || featured.title) + "</h2><p>" + esc(featured.client) + "</p></div>" +
      '<div class="proj-card reveal">' + featuredVisual(featured) +
      '<div class="proj-body"><span class="proj-client">عميل المشروع: ' + esc(featured.client) + "</span>" +
      "<h3>" + esc(featured.title) + "</h3><p>" + esc(featured.desc) + "</p>" + featuredStats(featured) +
      (scope ? '<div class="proj-scope"><h4>نطاق الأعمال المنفذة</h4><ul>' + scope + "</ul></div>" : "") +
      "</div></div>";
  }

  /* معرض الأعمال */
  var gridEl = document.getElementById("portfolioGrid");
  if (gridEl) {
    gridEl.innerHTML = projects.filter(function (p) { return p.portfolio !== false; }).map(function (p) {
      var tags = (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
      return '<div class="pf-card" data-cat="' + esc((p.cats || []).join(" ")) + '">' +
        '<div class="pf-media"><span class="pf-cat">' + esc(p.sector) + "</span>" + img(p.image, p.imageAlt || p.title) + "</div>" +
        '<div class="pf-body"><h4>' + esc(p.shortTitle || p.title) + '</h4><span class="cl">' + esc(p.client) + "</span>" +
        "<p>" + esc(p.shortDesc || p.desc) + "</p>" +
        (tags ? '<div class="pf-tags">' + tags + "</div>" : "") + "</div></div>";
    }).join("");
  }

  /* شعارات العملاء */
  var brandEl = document.getElementById("brandWall");
  if (brandEl && D.brands) {
    brandEl.innerHTML = D.brands.map(function (b) {
      var inner = /^#/.test(b.logo)
        ? '<svg viewBox="' + esc(b.vb || "0 0 480 120") + '"><use href="' + esc(b.logo) + '"/></svg>'
        : img(b.logo, b.name);
      return '<div class="brand-card" data-name="' + esc(b.name) + '">' + inner + "</div>";
    }).join("");
  }

  /* جهات أخرى */
  var clientsEl = document.getElementById("clientsGrid");
  if (clientsEl && D.clients) {
    clientsEl.innerHTML = D.clients.map(function (c, i) {
      var mark = c.logo ? '<span class="client-ic client-logo">' + img(c.logo, c.name) + "</span>"
                        : '<span class="client-ic">' + esc(c.name.charAt(0)) + "</span>";
      return '<div class="client-card reveal d' + (i % 5) + '">' + mark + "<b>" + esc(c.name) + "</b></div>";
    }).join("");
  }
})();
