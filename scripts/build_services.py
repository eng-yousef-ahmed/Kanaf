#!/usr/bin/env python3
"""
يولّد صفحات الخدمات المستقلة (services/*.html) من content/services.json.

الاستخدام (من جذر المشروع):
    python3 scripts/build_services.py

الهيدر والفوتر والأيقونات بتتاخد تلقائياً من index.html عشان تفضل الصفحات
متطابقة مع الموقع الرئيسي. عدّل المحتوى في content/services.json ثم شغّل السكربت.
"""
import html
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://kanaf-systems.netlify.app"
PHONE = "+966568646500"
WA = "https://wa.me/966568646500"
ADDRESS = {
    "@type": "PostalAddress",
    "streetAddress": "7716 زنباع بن سلامة رضي الله عنه، الحمراء أم الجود",
    "addressLocality": "مكة المكرمة",
    "postalCode": "24331",
    "addressCountry": "SA",
}
STEPS = [
    ("دراسة الاحتياج", "معاينة الموقع وفهم طبيعة التشغيل."),
    ("تصميم الحل", "حل مصمم وفق احتياج المنشأة."),
    ("التوريد والتركيب", "توريد الأجهزة وتنفيذ الأعمال بجودة."),
    ("الاختبار والبرمجة", "برمجة الأنظمة واختبارها للجاهزية."),
    ("الدعم والصيانة", "دعم مستمر وصيانة للاستمرارية."),
]


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8", newline="") as f:
        return f.read()


def esc(s):
    return html.escape(str(s), quote=True)


def rewrite_links(fragment, here="services"):
    """يحوّل روابط الصفحة الرئيسية (#section) لروابط للملف الرئيسي، ويعدّل روابط الملفات المجاورة.
    here: المجلد اللي فيه الصفحة (services أو blog) — الاتنين على مستوى واحد تحت الجذر."""
    prefix = "../index.html"
    fragment = fragment.replace('<a class="logo" href="#home" data-nav="home">',
                                '<a class="logo" href="%s">' % prefix)
    fragment = fragment.replace('data-nav="home" class="active"', 'data-nav="home"')
    fragment = re.sub(r'href="#home" data-nav="home"', 'href="%s"' % prefix, fragment)
    fragment = re.sub(r'href="#(\w+)" data-nav="\1"',
                      lambda m: 'href="%s#%s"' % (prefix, m.group(1)), fragment)
    if here == "services":
        fragment = fragment.replace('href="services/', 'href="')
        fragment = fragment.replace('href="blog/index.html"', 'href="../blog/index.html"')
    else:
        fragment = fragment.replace('href="services/', 'href="../services/')
        fragment = fragment.replace('href="blog/index.html"', 'href="index.html"')
    fragment = re.sub(r'\sdata-nav="[^"]*"', "", fragment)
    return fragment


def shared_parts(here="services"):
    """أجزاء الصفحة المشتركة (الأيقونات، الهيدر، الفوتر، زر واتساب) مأخوذة من index.html."""
    index = read("index.html")
    body_start = index.find("<body")
    sprite = index[index.find("<svg", body_start):index.find('<div id="preloader"')]
    header = rewrite_links(index[index.find('<div class="topbar">'):index.find("<main>")], here)
    fs_ = index.find("<footer>")
    footer = rewrite_links(index[fs_:index.find("</footer>") + len("</footer>")], here)
    fl = index.find('<a class="wa-float"')
    floats = index[fl:index.find("<script>", fl)]
    icon_link = re.search(r'<link rel="icon"[^>]*>', index).group(0)
    fonts = "".join(
        '<link rel="stylesheet" href="../assets/fonts/%s">\n' % f
        for f in ["tajawal-400.css", "tajawal-700.css", "tajawal-800.css", "cairo-800.css", "cairo-900.css"]
    )
    return {"sprite": sprite, "header": header, "footer": footer, "floats": floats,
            "icon": icon_link, "fonts": fonts}


def main():
    services = json.loads(read("content/services.json"))["services"]
    parts = shared_parts("services")
    out_dir = os.path.join(ROOT, "services")
    os.makedirs(out_dir, exist_ok=True)
    for svc in services:
        page = render(svc, parts["sprite"], parts["header"], parts["footer"], parts["floats"],
                      parts["icon"], parts["fonts"], services)
        path = os.path.join(out_dir, svc["slug"] + ".html")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(page)
        print("built", os.path.relpath(path, ROOT))
    print("done: %d pages" % len(services))


def render(svc, sprite, header, footer, floats, icon_link, fonts, all_services):
    name = svc["name"]
    slug = svc["slug"]
    url = "%s/services/%s.html" % (SITE, slug)
    title = "%s | مؤسسة كنف" % name
    desc = svc["lead"]
    cats = " ".join(svc.get("cats", []))

    # ----- JSON-LD -----
    service_ld = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": name,
        "description": desc,
        "url": url,
        "serviceType": name,
        "areaServed": {"@type": "City", "name": "مكة المكرمة"},
        "provider": {
            "@type": "LocalBusiness",
            "name": "مؤسسة كنف الأمان للمراقبة الأمنية",
            "alternateName": "KANAF Systems",
            "url": SITE + "/",
            "telephone": PHONE,
            "email": "Kanaf.S.Systems@gmail.com",
            "address": ADDRESS,
        },
    }
    faq_ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in svc.get("faq", [])
        ],
    }
    crumb_ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "خدماتنا", "item": SITE + "/#services"},
            {"@type": "ListItem", "position": 3, "name": name, "item": url},
        ],
    }
    ld = "".join(
        '<script type="application/ld+json">%s</script>\n' % json.dumps(x, ensure_ascii=False)
        for x in ([service_ld, crumb_ld] + ([faq_ld] if svc.get("faq") else []))
    )

    # ----- الأقسام -----
    intro = "".join("<p>%s</p>" % esc(p) for p in svc.get("intro", []))
    includes = "".join(
        '<li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>%s</li>' % esc(x)
        for x in svc.get("includes", [])
    )
    for_who = "".join("<span>%s</span>" % esc(x) for x in svc.get("forWho", []))
    steps = "".join(
        '<li><span class="st-n">%02d</span><div><h4>%s</h4><p>%s</p></div></li>' % (i + 1, esc(t), esc(d))
        for i, (t, d) in enumerate(STEPS)
    )
    faqs = ""
    for i, f in enumerate(svc.get("faq", [])):
        faqs += (
            '<details class="faq reveal%s"%s><summary>%s<span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>'
            '<div class="faq-body"><p>%s</p></div></details>\n'
        ) % (" d%d" % min(i, 4) if i else "", " open" if i == 0 else "", esc(f["q"]), esc(f["a"]))

    others = "".join(
        '<a href="%s.html">%s</a>' % (o["slug"], esc(o["name"]))
        for o in all_services if o["slug"] != slug
    )

    return (
        '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n'
        '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>%(title)s</title>\n'
        '<meta name="description" content="%(desc)s">\n'
        '<meta name="keywords" content="%(keywords)s">\n'
        '<link rel="canonical" href="%(url)s">\n'
        '<meta property="og:type" content="article">\n'
        '<meta property="og:locale" content="ar_SA">\n'
        '<meta property="og:site_name" content="مؤسسة كنف — KANAF Systems">\n'
        '<meta property="og:title" content="%(title)s">\n'
        '<meta property="og:description" content="%(desc)s">\n'
        '<meta property="og:url" content="%(url)s">\n'
        '<meta name="twitter:card" content="summary">\n'
        '%(icon)s\n'
        '%(fonts)s'
        '<link rel="stylesheet" href="../assets/css/site.css">\n'
        '<link rel="stylesheet" href="../assets/css/extra.css">\n'
        '<link rel="stylesheet" href="../assets/css/services.css">\n'
        '%(ld)s'
        '</head>\n<body class="svc-page">\n'
        '%(sprite)s\n'
        '<div id="progressBar"></div>\n'
        '%(header)s\n'
        '<main>\n'
        '<div class="page-hero"><div class="container">\n'
        '  <div class="crumbs"><a href="../index.html">الرئيسية</a><i>/</i><a href="../index.html#services">خدماتنا</a><i>/</i><span>%(name)s</span></div>\n'
        '  <span class="svc-eyebrow">%(eyebrow)s</span>\n'
        '  <h1>%(name)s</h1>\n'
        '  <p>%(lead)s</p>\n'
        '  <div class="svc-hero-actions">\n'
        '    <a class="btn btn-white" href="%(wa)s" target="_blank" rel="noopener">واتساب مباشر</a>\n'
        '    <a class="btn btn-darkline" href="tel:%(phone)s">اتصل بنا الآن</a>\n'
        '    <a class="btn btn-darkline" href="../index.html#contact">اطلب عرض سعر</a>\n'
        '  </div>\n'
        '</div></div>\n'
        '<div class="pad"><div class="container svc-layout">\n'
        '  <article class="svc-main">\n'
        '    <div class="svc-block reveal"><h2>نبذة عن الخدمة</h2>%(intro)s</div>\n'
        '    <div class="svc-block reveal"><h2>ماذا تشمل الخدمة؟</h2><ul class="svc-list">%(includes)s</ul></div>\n'
        '    <div class="svc-block reveal"><h2>مناسبة لـ</h2><div class="chips">%(for_who)s</div></div>\n'
        '    <div class="svc-block reveal"><h2>آلية العمل</h2><ol class="svc-steps">%(steps)s</ol></div>\n'
        '  </article>\n'
        '  <aside class="svc-side">\n'
        '    <div class="side-card reveal">\n'
        '      <h3>جاهزون لدراسة احتياجكم</h3>\n'
        '      <p>المعاينة وعرض السعر بدون التزام.</p>\n'
        '      <a class="btn btn-green" href="%(wa)s" target="_blank" rel="noopener">واتساب مباشر</a>\n'
        '      <a class="btn btn-line" href="tel:%(phone)s">%(phone_disp)s</a>\n'
        '    </div>\n'
        '    <div class="side-card reveal d1">\n'
        '      <h3>خدمات أخرى</h3>\n'
        '      <nav class="svc-others">%(others)s<a href="../index.html#services">كل الخدمات ←</a></nav>\n'
        '    </div>\n'
        '  </aside>\n'
        '</div></div>\n'
        '<div class="pad services-sec related-wrap" id="relatedWrap"><div class="container">\n'
        '  <div class="sec-head reveal"><span class="sec-num">أعمال مرتبطة</span><h2>من تنفيذ كنف</h2><p>نماذج من مشاريعنا في هذا المجال.</p></div>\n'
        '  <div class="portfolio-grid reveal" id="relatedProjects" data-cats="%(cats)s"></div>\n'
        '</div></div>\n'
        + ('<div class="pad" id="faq"><div class="container">\n'
           '  <div class="sec-head reveal"><span class="sec-num">أسئلة شائعة</span><h2>إجابات عن %(name)s</h2></div>\n'
           '  <div class="faq-list">%(faqs)s</div>\n'
           '</div></div>\n' if faqs else '')
        + '<div class="pad-b" id="quote"><div class="container"><div class="cta-inner reveal">\n'
          '  <div><h3>ابدأ مشروعك مع كنف اليوم</h3><p>أرسل احتياجك وسنتواصل معك لدراسة المنشأة وتقديم الحل المناسب.</p></div>\n'
          '  <div style="display:flex;gap:14px;flex-wrap:wrap"><a class="btn btn-white" href="%(wa)s" target="_blank" rel="noopener">واتساب مباشر</a><a class="btn btn-darkline" href="../index.html#contact">نموذج طلب عرض السعر</a></div>\n'
          '</div></div></div>\n'
        '</main>\n'
        '%(footer)s\n'
        '%(floats)s\n'
        '<button id="toTop" aria-label="العودة للأعلى"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></button>\n'
        '<script src="../content/site-data.js"></script>\n'
        '<script src="../assets/js/site.js"></script>\n'
        '</body>\n</html>\n'
    ) % {
        "title": esc(title), "desc": esc(desc), "keywords": esc(svc.get("keywords", "")),
        "url": url, "icon": icon_link, "fonts": fonts, "ld": ld, "sprite": sprite,
        "header": header, "footer": footer, "floats": floats, "name": esc(name),
        "eyebrow": esc(svc.get("eyebrow", "")), "lead": esc(desc), "wa": WA, "phone": PHONE,
        "phone_disp": "+966 56 864 6500", "intro": intro, "includes": includes, "for_who": for_who,
        "steps": steps, "others": others, "cats": esc(cats), "faqs": faqs,
    }


if __name__ == "__main__":
    sys.exit(main())
