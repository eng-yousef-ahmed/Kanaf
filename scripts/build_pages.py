#!/usr/bin/env python3
"""
يولّد كل الصفحات الفرعية للموقع بالعربية والإنجليزية:

  العربية:   services/*.html   ·  blog/index.html  ·  blog/*.html
  English:   en/index.html     ·  en/services/*.html  ·  en/blog/index.html  ·  en/blog/*.html

المصادر:
  content/services.json        محتوى الخدمات (عربي)
  content/services.en.json     محتوى الخدمات (إنجليزي)
  content/posts.json           المقالات (عربي)
  content/posts.en.json        المقالات (إنجليزي)
  content/en/home-main.html    جسم الصفحة الرئيسية الإنجليزية
  index.html                   الهيدر والفوتر والأيقونات العربية

الاستخدام (من جذر المشروع):
    python3 scripts/build_pages.py
"""
import html
import json
import os
import posixpath
import re
import sys
from datetime import date  # noqa: F401  (kept for future use)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://kanaf-systems.netlify.app"
PHONE = "+966568646500"
WA = "https://wa.me/966568646500"
EMAIL = "Kanaf.S.Systems@gmail.com"
ADDRESS = {
    "@type": "PostalAddress",
    "streetAddress": "7716 زنباع بن سلامة رضي الله عنه، الحمراء أم الجود",
    "addressLocality": "مكة المكرمة", "postalCode": "24331", "addressCountry": "SA",
}
ADDRESS_EN = {
    "@type": "PostalAddress",
    "streetAddress": "7716 Zunbaa bin Salama Street, Al Hamra, Umm Al Joud",
    "addressLocality": "Makkah", "postalCode": "24331", "addressCountry": "SA",
}

MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
             "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
MONTHS_EN = ["January", "February", "March", "April", "May", "June",
             "July", "August", "September", "October", "November", "December"]

LABELS = {
    "ar": {
        "lang": "ar", "dir": "rtl", "home": "الرئيسية", "services": "خدماتنا", "blog": "المدونة",
        "intro": "نبذة عن الخدمة", "includes": "ماذا تشمل الخدمة؟", "for_who": "مناسبة لـ",
        "steps": "آلية العمل", "steps_items": [
            ("دراسة الاحتياج", "معاينة الموقع وفهم طبيعة التشغيل."),
            ("تصميم الحل", "حل مصمم وفق احتياج المنشأة."),
            ("التوريد والتركيب", "توريد الأجهزة وتنفيذ الأعمال بجودة."),
            ("الاختبار والبرمجة", "برمجة الأنظمة واختبارها للجاهزية."),
            ("الدعم والصيانة", "دعم مستمر وصيانة للاستمرارية."),
        ],
        "wa": "واتساب مباشر", "call": "اتصل بنا الآن", "quote": "اطلب عرض سعر",
        "quote_form": "نموذج طلب عرض السعر", "cta_side_h": "جاهزون لدراسة احتياجاتكم",
        "cta_side_p": "المعاينة وعرض السعر بدون التزام.", "others": "خدمات أخرى",
        "all_services": "كل الخدمات ←", "related_tag": "أعمال مرتبطة", "related_h": "من تنفيذ كنف",
        "related_p": "نماذج من مشاريعنا في هذا المجال.", "faq_tag": "أسئلة شائعة",
        "faq_h": "إجابات عن", "cta2_h": "ابدأ مشروعك مع كنف اليوم",
        "cta2_p": "أرسل احتياجك وسنتواصل معك لدراسة المنشأة وتقديم الحل المناسب.",
        "service_tag": "خدمة ذات صلة", "details": "التفاصيل ←", "read": "دقائق قراءة",
        "read_more": "اقرأ المقال", "need": "هل تحتاج تنفيذ هذا؟", "other_posts": "مقالات أخرى",
        "blog_title": "المدونة | مؤسسة كنف — نصائح كاميرات المراقبة والأنظمة الأمنية",
        "blog_desc": "مقالات عملية عن كاميرات المراقبة والأنظمة الأمنية وإنذار الحريق والشبكات، من فريق مؤسسة كنف بمكة المكرمة.",
        "blog_h": 'مدونة <span class="grad">كنف</span>',
        "blog_p": "مقالات عملية تساعدك على اتخاذ قرار أفضل في كاميرات المراقبة والأنظمة الأمنية والشبكات.",
        "blog_cta_h": "تحتاج استشارة لموقعك؟", "blog_cta_p": "أرسل احتياجك وسنتواصل معك لدراسة المنشأة وتقديم الحل المناسب.",
        "blog_cta_btn": "طلب عرض سعر", "crumb_home": "الرئيسية", "contact_link": "../index.html#contact",
        "quote_btn_text": "نموذج طلب عرض السعر", "eyebrow_suffix": "",
        "switch": "English", "switch_href": "@@en/index.html",
        "faq_blog": "دليل الشراء",
    },
    "en": {
        "lang": "en", "dir": "ltr", "home": "Home", "services": "Services", "blog": "Blog",
        "intro": "About this service", "includes": "What is included?", "for_who": "Suitable for",
        "steps": "How we work", "steps_items": [
            ("Needs study", "Surveying the site and understanding how it operates."),
            ("Solution design", "A solution designed around the facility's needs."),
            ("Supply & installation", "Supplying the equipment and executing the works to a high standard."),
            ("Testing & programming", "Programming the systems and testing them for readiness."),
            ("Support & maintenance", "Ongoing support and maintenance for continuity."),
        ],
        "wa": "WhatsApp us", "call": "Call now", "quote": "Request a quote",
        "quote_form": "Quote request form", "cta_side_h": "Let's study your needs",
        "cta_side_p": "Survey and quotation with no obligation.", "others": "Other services",
        "all_services": "All services →", "related_tag": "Related work", "related_h": "Projects by Kanaf",
        "related_p": "Examples of our projects in this field.", "faq_tag": "FAQ",
        "faq_h": "Answers about", "cta2_h": "Start your project with Kanaf today",
        "cta2_p": "Send us your requirements and we will get back to you to study your facility and propose the right solution.",
        "service_tag": "Related service", "details": "Details →", "read": "min read",
        "read_more": "Read article", "need": "Need this done?", "other_posts": "More articles",
        "blog_title": "Blog | Kanaf — CCTV & security systems tips",
        "blog_desc": "Practical articles on CCTV cameras, security systems, fire alarms and networks, by the Kanaf team in Makkah.",
        "blog_h": 'Kanaf <span class="grad">Blog</span>',
        "blog_p": "Practical articles to help you make better decisions about CCTV, security systems and networks.",
        "blog_cta_h": "Need advice for your site?", "blog_cta_p": "Send us your requirements and we will get back to you to study your facility and propose the right solution.",
        "blog_cta_btn": "Request a quote", "crumb_home": "Home", "contact_link": "@@en/index.html#contact",
        "quote_btn_text": "Quote request form", "eyebrow_suffix": "",
        "switch": "العربية", "switch_href": "@@index.html",
        "faq_blog": "Buying Guide",
    },
}


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8", newline="") as f:
        return f.read()


def esc(s):
    return html.escape(str(s), quote=True)


def load_json(path):
    return json.loads(read(path))


def fmt_date(iso, lang):
    y, m, d = (int(x) for x in iso.split("-"))
    if lang == "ar":
        return "%d %s %d" % (d, MONTHS_AR[m - 1], y)
    return "%s %d, %d" % (MONTHS_EN[m - 1], d, y)


def reading_minutes(post):
    words = 0
    for b in post["blocks"]:
        for k in ("p", "h2", "tip"):
            if k in b:
                words += len(b[k].split())
        for item in b.get("ul", []):
            words += len(item.split())
    return max(1, round(words / 200))


# ---------------------------------------------------------------- shared parts
def rewrite_arabic_links(fragment, here):
    """يحوّل روابط الهيدر/الفوتر العربي لتوكنات @@ تُحل لاحقاً حسب مكان الصفحة."""
    fragment = fragment.replace('<a class="logo" href="#home" data-nav="home">', '<a class="logo" href="@@index.html">')
    fragment = fragment.replace('data-nav="home" class="active"', 'data-nav="home"')
    fragment = re.sub(r'href="#home" data-nav="home"', 'href="@@index.html"', fragment)
    fragment = re.sub(r'href="#(\w+)" data-nav="\1"', r'href="@@index.html#\1"', fragment)
    fragment = fragment.replace('href="services/', 'href="@@services/')
    fragment = fragment.replace('href="blog/index.html"', 'href="@@blog/index.html"')
    fragment = fragment.replace('href="en/index.html"', 'href="@@en/index.html"')
    fragment = re.sub(r'\sdata-nav="[^"]*"', "", fragment)
    return fragment


def arabic_shared():
    index = read("index.html")
    body = index.find("<body")
    sprite = index[index.find("<svg", body):index.find('<div id="preloader"')]
    header = rewrite_arabic_links(index[index.find('<div class="topbar">'):index.find("<main>")], "")
    fs_ = index.find("<footer>")
    footer = rewrite_arabic_links(index[fs_:index.find("</footer>") + len("</footer>")], "")
    fl = index.find('<a class="wa-float"')
    floats = index[fl:index.find('<button id="toTop"', fl)]
    icon = re.search(r'<link rel="icon"[^>]*>', index).group(0)
    return {"sprite": sprite, "header": header, "footer": footer, "floats": floats, "icon": icon}


FONTS = "".join('<link rel="stylesheet" href="@@assets/fonts/%s">\n' % f for f in
                ["tajawal-400.css", "tajawal-700.css", "tajawal-800.css", "cairo-800.css", "cairo-900.css"])
CSS = ('<link rel="stylesheet" href="@@assets/css/site.css">\n'
       '<link rel="stylesheet" href="@@assets/css/extra.css">\n'
       '<link rel="stylesheet" href="@@assets/css/services.css">\n'
       '<link rel="stylesheet" href="@@assets/css/en.css">\n'
       '<link rel="stylesheet" href="@@assets/css/chatbot.css">\n')

ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg>'
CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>'
CHEV_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>'


def en_header():
    return (
        '<div class="topbar"><div class="container">\n'
        '  <div class="topbar-left">\n'
        '    <a href="tel:%(phone)s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9Z"/></svg>%(phone_disp)s</a>\n'
        '    <a href="mailto:%(email)s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>%(email)s</a>\n'
        '  </div>\n'
        '  <span class="topbar-tag">CCTV • Security Systems • Technical Infrastructure</span>\n'
        '</div></div>\n'
        '<header><div class="container nav">\n'
        '  <a class="logo" href="@@en/index.html">\n'
        '    <svg class="logo-emblem" viewBox="0 0 240 250"><use href="#kanafEmblem"/></svg>\n'
        '    <span class="logo-text"><strong>Kanaf</strong><span>KANAF SYSTEMS</span></span>\n'
        '  </a>\n'
        '  <nav class="nav-links" id="navLinks">\n'
        '    <a href="@@en/index.html">Home</a>\n'
        '    <a href="@@en/index.html#about">About</a>\n'
        '    <a href="@@en/index.html#services">Services</a>\n'
        '    <a href="@@en/index.html#projects">Projects</a>\n'
        '    <a href="@@en/blog/index.html">Blog</a>\n'
        '    <a href="@@en/index.html#location">Location</a>\n'
        '    <a href="@@en/index.html#faq">FAQ</a>\n'
        '    <a href="@@en/index.html#contact" class="nav-cta">Request a quote</a>\n'
        '  </nav>\n'
        '  <div class="nav-tools">\n'
        '    <a href="@@index.html" class="lang-sw" hreflang="ar" lang="ar">العربية</a>\n'
        '    <button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>\n'
        '  </div>\n'
        '</div></header>\n'
    ) % {"phone": PHONE, "phone_disp": "+966 56 864 6500", "email": EMAIL}


def en_footer():
    svc_links = "".join(
        '<a href="@@en/services/%s.html">%s</a>' % (slug, name) for slug, name in [
            ("cctv", "CCTV Cameras"), ("access-control", "Access Control & Intercom"),
            ("fire-alarm", "Fire Alarm & Smoke Detection"), ("networks", "Networks & Internet"),
            ("cctv-maintenance", "CCTV Maintenance")])
    return (
        '<footer><div class="container">\n'
        '  <div class="foot-grid">\n'
        '    <div>\n'
        '      <div class="foot-logo"><svg viewBox="0 0 240 250"><use href="#kanafEmblem"/></svg><span><strong>Kanaf</strong><span>KANAF SYSTEMS</span></span></div>\n'
        '      <p>Kanaf Security Systems in Makkah: supply, installation and maintenance of CCTV cameras and security systems, fire alarms, networks and technical infrastructure. Reliable solutions, professional execution, continuous support.</p>\n'
        '      <span class="foot-tag">CCTV • Security Systems • Technical Infrastructure</span>\n'
        '    </div>\n'
        '    <div><h5>Quick links</h5><div class="foot-links">\n'
        '      <a href="@@en/index.html#about">About us</a>\n'
        '      <a href="@@en/index.html#services">Services</a>\n'
        '      <a href="@@en/index.html#projects">Projects &amp; clients</a>\n'
        '      <a href="@@en/index.html#location">Location</a>\n'
        '      <a href="@@en/index.html#faq">FAQ</a>\n'
        '      <a href="@@en/blog/index.html">Blog</a>\n'
        '    </div></div>\n'
        '    <div><h5>Top services</h5><div class="foot-links">%s</div></div>\n'
        '    <div><h5>Contact us</h5><div class="foot-links">\n'
        '      <a href="tel:%s" style="direction:ltr;text-align:left">+966 56 864 6500</a>\n'
        '      <a href="mailto:%s" style="direction:ltr;text-align:left">%s</a>\n'
        '      <a href="@@en/index.html#location">7716 Zunbaa bin Salama St., Umm Al Joud, Makkah</a>\n'
        '    </div></div>\n'
        '  </div>\n'
        '  <div class="foot-bottom">\n'
        '    <span>© <span id="year"></span> <b>Kanaf Security Systems</b> All rights reserved.</span>\n'
        '    <span>Established <b>2024</b> — Makkah, Saudi Arabia</span>\n'
        '  </div>\n'
        '</div></footer>\n'
    ) % (svc_links, PHONE, EMAIL, EMAIL)


EN_FLOATS = ('<a class="wa-float" href="%s" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">'
             '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.4 14.2c-.23.65-1.34 1.25-1.87 1.32-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.170-4.94-4.36-.14-.2-1.18-1.57-1.18-3s.75-2.12 1.02-2.41c.26-.29.58-.36.77-.36h.55c.18 0 .42-.07.65.5.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.09.2-.14.31-.28.48l-.43.5c-.14.14-.29.3-.12.58.16.29.73 1.2 1.57 1.95 1.08.96 2 1.26 2.28 1.4.28.15.45.13.62-.07.16-.2.7-.82.9-1.1.19-.29.38-.24.64-.15.26.1 1.66.79 1.95.93.28.14.47.21.54.33.07.12.07.7-.16 1.35Z"/></svg></a>\n'
             ) % WA

TOP_BTN = ('<button id="toTop" aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></button>\n')


def head(lang, title, desc, keywords, canonical, og_type, icon, alternates, extra_ld=""):
    alt = "".join('<link rel="alternate" hreflang="%s" href="%s">\n' % (l, u) for l, u in alternates)
    alt += '<link rel="alternate" hreflang="x-default" href="%s">\n' % alternates[0][1]
    return (
        '<!DOCTYPE html>\n<html lang="%(lang)s" dir="%(dir)s">\n<head>\n'
        '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>%(title)s</title>\n'
        '<meta name="description" content="%(desc)s">\n'
        '<meta name="keywords" content="%(keywords)s">\n'
        '<link rel="canonical" href="%(canonical)s">\n'
        '%(alt)s'
        '<meta property="og:type" content="%(og_type)s">\n'
        '<meta property="og:locale" content="%(og_locale)s">\n'
        '<meta property="og:site_name" content="%(site_name)s">\n'
        '<meta property="og:title" content="%(title)s">\n'
        '<meta property="og:description" content="%(desc)s">\n'
        '<meta property="og:url" content="%(canonical)s">\n'
        '<meta name="twitter:card" content="summary">\n'
        '%(icon)s\n%(fonts)s%(css)s%(extra_ld)s'
        '</head>\n<body class="svc-page">\n'
    ) % {"lang": lang, "dir": "rtl" if lang == "ar" else "ltr", "title": esc(title), "desc": esc(desc),
         "keywords": esc(keywords), "canonical": canonical, "alt": alt, "og_type": og_type,
         "og_locale": "ar_SA" if lang == "ar" else "en_US",
         "site_name": "مؤسسة كنف — KANAF Systems" if lang == "ar" else "Kanaf Security Systems",
         "icon": icon, "fonts": FONTS, "css": CSS, "extra_ld": extra_ld}


def ld(obj):
    return '<script type="application/ld+json">%s</script>\n' % json.dumps(obj, ensure_ascii=False)


def scripts(lang):
    s = '<script src="@@content/site-data.js"></script>\n'
    if lang == "en":
        s += '<script src="@@content/site-data.en.js"></script>\n'
    s += '<script src="@@assets/js/chatbot.js"></script>\n'
    return s


def blocks_html(blocks):
    out = []
    for b in blocks:
        if "h2" in b:
            out.append("<h2>%s</h2>" % esc(b["h2"]))
        elif "p" in b:
            out.append("<p>%s</p>" % esc(b["p"]))
        elif "ul" in b:
            out.append('<ul class="post-list">%s</ul>' % "".join(
                '<li><span class="tick">%s</span>%s</li>' % (CHECK_SVG, esc(x)) for x in b["ul"]))
        elif "tip" in b:
            out.append('<aside class="post-tip"><span>💡</span><p>%s</p></aside>' % esc(b["tip"]))
    return "\n".join(out)


def alternates_for(ar_path, en_path):
    return [("ar", SITE + "/" + ar_path), ("en", SITE + "/" + en_path)]


# ---------------------------------------------------------------- services
def render_service(svc, lang, parts, all_services):
    L = LABELS[lang]
    name, eyebrow, lead = svc["name"], svc["eyebrow"], svc["lead"]
    slug = svc["slug"]
    ar_path = "services/%s.html" % slug
    en_path = "en/services/%s.html" % slug
    page_path = en_path if lang == "en" else ar_path
    canonical = SITE + "/" + page_path
    root = "@@" if True else ""
    alts = alternates_for(ar_path, en_path)
    title = ("%s | مؤسسة كنف" % name) if lang == "ar" else ("%s | Kanaf Security Systems" % name)

    service_ld = {"@context": "https://schema.org", "@type": "Service", "name": name, "description": lead,
                  "url": canonical, "serviceType": name, "areaServed": {"@type": "City", "name": "Makkah" if lang == "en" else "مكة المكرمة"},
                  "provider": {"@type": "LocalBusiness", "name": "Kanaf Security Systems" if lang == "en" else "مؤسسة كنف الأمان للمراقبة الأمنية",
                               "alternateName": "KANAF Systems", "url": SITE + "/", "telephone": PHONE, "email": EMAIL,
                               "address": ADDRESS_EN if lang == "en" else ADDRESS}}
    crumb_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": L["home"], "item": SITE + "/" + ("en/index.html" if lang == "en" else "index.html")},
        {"@type": "ListItem", "position": 2, "name": L["services"], "item": SITE + "/" + ("en/index.html#services" if lang == "en" else "index.html#services")},
        {"@type": "ListItem", "position": 3, "name": name, "item": canonical}]}
    ld_all = [service_ld, crumb_ld]
    if svc.get("faq"):
        ld_all.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in svc["faq"]]})
    extra = "".join(ld(x) for x in ld_all)

    intro = "".join("<p>%s</p>" % esc(p) for p in svc.get("intro", []))
    includes = "".join('<li><span class="tick">%s</span>%s</li>' % (CHECK_SVG, esc(x)) for x in svc.get("includes", []))
    for_who = "".join("<span>%s</span>" % esc(x) for x in svc.get("forWho", []))
    steps = "".join('<li><span class="st-n">%02d</span><div><h4>%s</h4><p>%s</p></div></li>' % (i + 1, esc(t), esc(d))
                    for i, (t, d) in enumerate(L["steps_items"]))
    faqs = ""
    for i, f in enumerate(svc.get("faq", [])):
        faqs += ('<details class="faq reveal%s"%s><summary>%s<span class="arr">%s</span></summary>'
                 '<div class="faq-body"><p>%s</p></div></details>\n') % (
            (" d%d" % min(i, 4)) if i else "", " open" if i == 0 else "", esc(f["q"]), CHEV_SVG, esc(f["a"]))
    others = "".join('<a href="%s.html">%s</a>' % (o["slug"], esc(o["name"])) for o in all_services if o["slug"] != slug)
    cats = " ".join(svc.get("cats", []))
    data_root = "../../" if lang == "en" else "../"
    home_href = "@@en/index.html" if lang == "en" else "@@index.html"
    svc_href = "@@en/index.html#services" if lang == "en" else "@@index.html#services"
    dir_attr = L["dir"]
    all_href = "@@en/index.html#services" if lang == "en" else "@@index.html#services"
    other_link = '<a href="%s" >%s</a>' % (all_href, L["all_services"])

    body = (
        '%(sprite)s\n<div id="progressBar"></div>\n%(header)s\n<main>\n'
        '<div class="page-hero"><div class="container">\n'
        '  <div class="crumbs"><a href="%(home)s">%(crumb_home)s</a><i>/</i><a href="%(svc)s">%(services)s</a><i>/</i><span>%(name)s</span></div>\n'
        '  <span class="svc-eyebrow">%(eyebrow)s</span>\n'
        '  <h1>%(name)s</h1>\n'
        '  <p>%(lead)s</p>\n'
        '  <div class="svc-hero-actions">\n'
        '    <a class="btn btn-white" href="%(wa)s" target="_blank" rel="noopener">%(wa_label)s</a>\n'
        '    <a class="btn btn-darkline" href="tel:%(phone)s">%(call)s</a>\n'
        '    <a class="btn btn-darkline" href="%(contact)s">%(quote)s</a>\n'
        '  </div>\n'
        '</div></div>\n'
        '<div class="pad"><div class="container svc-layout">\n'
        '  <article class="svc-main">\n'
        '    <div class="svc-block reveal"><h2>%(intro_h)s</h2>%(intro)s</div>\n'
        '    <div class="svc-block reveal"><h2>%(includes_h)s</h2><ul class="svc-list">%(includes)s</ul></div>\n'
        '    <div class="svc-block reveal"><h2>%(for_who_h)s</h2><div class="chips">%(for_who)s</div></div>\n'
        '    <div class="svc-block reveal"><h2>%(steps_h)s</h2><ol class="svc-steps">%(steps)s</ol></div>\n'
        '  </article>\n'
        '  <aside class="svc-side">\n'
        '    <div class="side-card reveal">\n'
        '      <h3>%(cta_side_h)s</h3>\n'
        '      <p>%(cta_side_p)s</p>\n'
        '      <a class="btn btn-green" href="%(wa)s" target="_blank" rel="noopener">%(wa_label)s</a>\n'
        '      <a class="btn btn-line" href="tel:%(phone)s">%(phone_disp)s</a>\n'
        '    </div>\n'
        '    <div class="side-card reveal d1">\n'
        '      <h3>%(others)s</h3>\n'
        '      <nav class="svc-others">%(others_links)s%(other_link)s</nav>\n'
        '    </div>\n'
        '  </aside>\n'
        '</div></div>\n'
        '<div class="pad services-sec related-wrap" id="relatedWrap"><div class="container">\n'
        '  <div class="sec-head reveal"><span class="sec-num">%(related_tag)s</span><h2>%(related_h)s</h2><p>%(related_p)s</p></div>\n'
        '  <div class="portfolio-grid reveal" id="relatedProjects" data-cats="%(cats)s" data-root="%(data_root)s"></div>\n'
        '</div></div>\n'
        + ('<div class="pad" id="faq"><div class="container">\n'
           '  <div class="sec-head reveal"><span class="sec-num">%(faq_tag)s</span><h2>%(faq_h)s %(name)s</h2></div>\n'
           '  <div class="faq-list">%(faqs)s</div>\n'
           '</div></div>\n' if faqs else '')
        + '<div class="pad-b" id="quote"><div class="container"><div class="cta-inner reveal">\n'
          '  <div><h3>%(cta2_h)s</h3><p>%(cta2_p)s</p></div>\n'
          '  <div style="display:flex;gap:14px;flex-wrap:wrap"><a class="btn btn-white" href="%(wa)s" target="_blank" rel="noopener">%(wa_label)s</a><a class="btn btn-darkline" href="%(contact)s">%(quote_btn)s</a></div>\n'
          '</div></div></div>\n'
        '</main>\n%(footer)s\n%(floats)s\n' + TOP_BTN + scripts(lang) +
        '<script src="@@assets/js/site.js"></script>\n</body>\n</html>\n'
    )
    values = {
        "sprite": parts["sprite"], "header": parts["header"], "footer": parts["footer"], "floats": parts["floats"],
        "home": home_href, "svc": svc_href, "crumb_home": L["crumb_home"], "services": L["services"],
        "name": esc(name), "eyebrow": esc(eyebrow), "lead": esc(lead), "wa": WA, "wa_label": L["wa"],
        "phone": PHONE, "call": L["call"], "contact": ("@@en/index.html#contact" if lang == "en" else "@@index.html#contact"),
        "quote": L["quote"], "intro_h": L["intro"], "includes_h": L["includes"], "for_who_h": L["for_who"],
        "steps_h": L["steps"], "intro": intro, "includes": includes, "for_who": for_who, "steps": steps,
        "cta_side_h": L["cta_side_h"], "cta_side_p": L["cta_side_p"], "phone_disp": "+966 56 864 6500",
        "others": L["others"], "others_links": others, "other_link": other_link,
        "related_tag": L["related_tag"], "related_h": L["related_h"], "related_p": L["related_p"],
        "cats": esc(cats), "data_root": data_root, "faq_tag": L["faq_tag"], "faq_h": L["faq_h"], "faqs": faqs,
        "cta2_h": L["cta2_h"], "cta2_p": L["cta2_p"], "quote_btn": L["quote_btn_text"],
    }
    page = head(lang, title, lead, svc.get("keywords", ""), canonical, "article", parts["icon"], alts, extra)
    return page + (body % values), page_path


# ---------------------------------------------------------------- blog
def render_post(post, lang, posts, services, parts):
    L = LABELS[lang]
    slug = post["slug"]
    ar_path = "blog/%s.html" % slug
    en_path = "en/blog/%s.html" % slug
    page_path = en_path if lang == "en" else ar_path
    canonical = SITE + "/" + page_path
    alts = alternates_for(ar_path, en_path)
    mins = reading_minutes(post)
    site_name = "مؤسسة كنف" if lang == "ar" else "Kanaf"
    suffix = " | مدونة كنف" if lang == "ar" else " | Kanaf Blog"
    blog_ld = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": post["title"],
               "description": post["description"], "datePublished": post["date"], "dateModified": post["date"],
               "inLanguage": lang, "mainEntityOfPage": canonical,
               "author": {"@type": "Organization", "name": site_name},
               "publisher": {"@type": "Organization", "name": site_name}}
    crumb = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": L["home"], "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": L["blog"], "item": SITE + "/" + ("en/blog/index.html" if lang == "en" else "blog/index.html")},
        {"@type": "ListItem", "position": 3, "name": post["title"], "item": canonical}]}
    extra = ld(blog_ld) + ld(crumb)

    svc_card = ""
    if post.get("relatedService"):
        svc = next((s for s in services if s["slug"] == post["relatedService"]), None)
        if svc:
            sv = svc if lang == "ar" else {**svc, **svc.get("_en", {})}
            svc_card = ('<a class="post-svc reveal" href="../services/%(slug)s.html">'
                        '<span>%(tag)s</span><strong>%(name)s</strong><em>%(lead)s</em><b>%(det)s</b></a>') % {
                "slug": svc["slug"], "tag": L["service_tag"], "name": esc(sv["name"]), "lead": esc(sv["lead"]), "det": L["details"]}
            if lang == "en":
                svc_card = svc_card.replace('href="../services/', 'href="../services/')

    others = [p for p in posts if p["slug"] != slug][:3]
    more = "".join('<a class="mini-post" href="%s.html"><span>%s</span><strong>%s</strong></a>' % (
        p["slug"], esc(p["category"]), esc(p["title"])) for p in others)

    list_href = "index.html"
    body = (
        '%(sprite)s\n<div id="progressBar"></div>\n%(header)s\n<main>\n'
        '<div class="page-hero"><div class="container">\n'
        '  <div class="crumbs"><a href="%(home)s">%(crumb_home)s</a><i>/</i><a href="%(list)s">%(blog)s</a><i>/</i><span>%(title)s</span></div>\n'
        '  <span class="svc-eyebrow">%(category)s</span>\n'
        '  <h1>%(title)s</h1>\n'
        '  <p>%(excerpt)s</p>\n'
        '  <div class="post-meta"><span>%(category)s</span><span>%(date)s</span><span>%(mins)d %(read)s</span></div>\n'
        '</div></div>\n'
        '<div class="pad"><div class="container post-layout">\n'
        '  <article class="post-body reveal">\n%(blocks)s\n</article>\n'
        '  <aside class="post-aside">\n'
        '    <div class="side-card reveal">\n'
        '      <h3>%(need)s</h3>\n'
        '      <p>%(cta_side_p)s</p>\n'
        '      <a class="btn btn-green" href="%(wa)s" target="_blank" rel="noopener">%(wa_label)s</a>\n'
        '      <a class="btn btn-line" href="%(contact)s">%(quote_form)s</a>\n'
        '    </div>\n'
        '    %(svc_card)s\n'
        '    %(more_block)s\n'
        '  </aside>\n</div></div>\n'
        '</main>\n%(footer)s\n%(floats)s\n' + TOP_BTN + scripts(lang) +
        '<script src="@@assets/js/site.js"></script>\n</body>\n</html>\n'
    )
    more_block = ('<div class="side-card reveal d1"><h3>%s</h3><div class="mini-list">%s</div></div>' % (L["other_posts"], more)) if more else ""
    values = {
        "sprite": parts["sprite"], "header": parts["header"], "footer": parts["footer"], "floats": parts["floats"],
        "home": "@@en/index.html" if lang == "en" else "@@index.html", "crumb_home": L["crumb_home"],
        "list": list_href, "blog": L["blog"], "title": esc(post["title"]), "category": esc(post["category"]),
        "excerpt": esc(post["excerpt"]), "date": fmt_date(post["date"], lang), "mins": mins, "read": L["read"],
        "blocks": blocks_html(post["blocks"]), "need": L["need"], "cta_side_p": L["cta_side_p"], "wa": WA,
        "wa_label": L["wa"], "contact": ("@@en/index.html#contact" if lang == "en" else "@@index.html#contact"),
        "quote_form": L["quote_form"], "svc_card": svc_card, "more_block": more_block,
    }
    page = head(lang, post["title"] + suffix, post["description"], post["keywords"], canonical, "article",
                parts["icon"], alts, extra)
    return page + (body % values), page_path


def render_blog_index(lang, posts, parts):
    L = LABELS[lang]
    ar_path, en_path = "blog/index.html", "en/blog/index.html"
    page_path = en_path if lang == "en" else ar_path
    canonical = SITE + "/" + page_path
    alts = alternates_for(ar_path, en_path)
    blog_ld = {"@context": "https://schema.org", "@type": "Blog",
               "name": "Kanaf Blog" if lang == "en" else "مدونة مؤسسة كنف", "url": canonical, "inLanguage": lang,
               "blogPost": [{"@type": "BlogPosting", "headline": p["title"],
                             "url": SITE + "/" + ("en/blog/%s.html" if lang == "en" else "blog/%s.html") % p["slug"],
                             "datePublished": p["date"]} for p in posts]}
    keywords = ("Kanaf blog, CCTV cameras, security systems, fire alarm, networks, camera maintenance Makkah"
                if lang == "en" else "مدونة كنف, كاميرات مراقبة, أنظمة أمنية, إنذار الحريق, شبكات, صيانة كاميرات مكة")
    cards = "".join(
        ('<a class="post-card reveal" href="%(slug)s.html">'
         '<div class="pc-top"><span class="pc-cat">%(cat)s</span><span class="pc-date">%(date)s</span></div>'
         '<h2>%(title)s</h2><p>%(excerpt)s</p>'
         '<span class="pc-more">%(more)s %(arrow)s</span>'
         '<span class="pc-read">%(mins)d %(read)s</span></a>\n') % {
            "slug": p["slug"], "cat": esc(p["category"]), "date": fmt_date(p["date"], lang),
            "title": esc(p["title"]), "excerpt": esc(p["excerpt"]), "mins": reading_minutes(p),
            "more": L["read_more"], "read": L["read"], "arrow": ARROW_SVG}
        for p in sorted(posts, key=lambda x: x["date"], reverse=True))
    body = (
        '%(sprite)s\n<div id="progressBar"></div>\n%(header)s\n<main>\n'
        '<div class="page-hero"><div class="container">\n'
        '  <div class="crumbs"><a href="%(home)s">%(crumb_home)s</a><i>/</i><span>%(blog)s</span></div>\n'
        '  <h1>%(blog_h)s</h1>\n'
        '  <p>%(blog_p)s</p>\n'
        '</div></div>\n'
        '<div class="pad"><div class="container"><div class="post-grid post-grid--four">\n%(cards)s</div></div></div>\n'
        '<div class="pad-b"><div class="container"><div class="cta-inner reveal">\n'
        '  <div><h3>%(blog_cta_h)s</h3><p>%(blog_cta_p)s</p></div>\n'
        '  <div style="display:flex;gap:14px;flex-wrap:wrap"><a class="btn btn-white" href="%(wa)s" target="_blank" rel="noopener">%(wa_label)s</a><a class="btn btn-darkline" href="%(contact)s">%(blog_cta_btn)s</a></div>\n'
        '</div></div></div>\n'
        '</main>\n%(footer)s\n%(floats)s\n' + TOP_BTN + scripts(lang) +
        '<script src="@@assets/js/site.js"></script>\n</body>\n</html>\n'
    )
    values = {
        "sprite": parts["sprite"], "header": parts["header"], "footer": parts["footer"], "floats": parts["floats"],
        "home": "@@en/index.html" if lang == "en" else "@@index.html", "crumb_home": L["crumb_home"],
        "blog": L["blog"], "blog_h": L["blog_h"], "blog_p": L["blog_p"], "cards": cards,
        "blog_cta_h": L["blog_cta_h"], "blog_cta_p": L["blog_cta_p"], "wa": WA, "wa_label": L["wa"],
        "contact": ("@@en/index.html#contact" if lang == "en" else "@@index.html#contact"), "blog_cta_btn": L["blog_cta_btn"],
    }
    title = L["blog_title"]
    page = head(lang, title, L["blog_desc"], keywords, canonical, "website", parts["icon"], alts, ld(blog_ld))
    return page + (body % values), page_path


# ---------------------------------------------------------------- home (en)
def render_en_home():
    main = read("content/en/home-main.html")
    title = "Surveillance & Security Systems in Makkah | Kanaf"
    desc = ("Kanaf supplies and installs CCTV cameras, security systems, fire alarms, access control and networks in Makkah, "
            "with maintenance and technical support.")
    keywords = ("CCTV Makkah, security cameras Makkah, CCTV installation, security systems, fire alarm, access control, "
                "networks, camera maintenance, Kanaf")
    canonical = SITE + "/en/index.html"
    alts = alternates_for("index.html", "en/index.html")
    local = {"@context": "https://schema.org", "@type": "LocalBusiness", "name": "Kanaf Security Systems",
             "alternateName": "KANAF Systems", "url": SITE + "/en/index.html", "inLanguage": "en",
             "telephone": PHONE, "email": EMAIL, "address": ADDRESS_EN, "areaServed": "Makkah",
             "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "23"}}
    parts = arabic_shared()
    body_parts = {"sprite": parts["sprite"], "header": en_header(), "footer": en_footer()}
    page = head("en", title, desc, keywords, canonical, "website", parts["icon"], alts, ld(local))
    return page + body_parts["sprite"] + '\n<div id="progressBar"></div>\n' + body_parts["header"] + main + \
        body_parts["footer"] + "\n" + EN_FLOATS + TOP_BTN + scripts("en") + \
        '<script src="@@assets/js/render.js"></script>\n<script src="@@assets/js/quote.js"></script>\n' \
        '<script src="@@assets/js/site.js"></script>\n</body>\n</html>\n', "en/index.html"


# ---------------------------------------------------------------- output
TOKEN = re.compile(r'(href|src)="@@([^"]+)"')


def resolve(text, page_path):
    base = posixpath.dirname(page_path)

    def repl(m):
        target = m.group(2)
        path, _, frag = target.partition("#")
        rel = posixpath.relpath(path, base) if base else path
        return '%s="%s%s"' % (m.group(1), rel, ("#" + frag) if frag else "")
    return TOKEN.sub(repl, text)


def write(page_path, text):
    full = os.path.join(ROOT, page_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(resolve(text, page_path))
    print("built", page_path)


def write_sitemap(urls):
    body = "\n".join("  <url><loc>%s</loc><changefreq>%s</changefreq><priority>%s</priority></url>" % (u, c, p)
                     for u, p, c in urls)
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n%s\n</urlset>\n' % body)


def main():
    services = load_json("content/services.json")["services"]
    services_en = load_json("content/services.en.json")
    posts = load_json("content/posts.json")["posts"]
    posts_en = load_json("content/posts.en.json")
    for s in services:
        s["_en"] = services_en.get(s["slug"], {})
    for p in posts:
        p["_en"] = posts_en.get(p["slug"], {})

    ar_parts = arabic_shared()
    ar_parts["icon"] = ar_parts["icon"]
    ar_parts["header"] = ar_parts["header"]

    urls = [(SITE + "/", "1.0", "monthly"), (SITE + "/en/index.html", "1.0", "monthly"),
            (SITE + "/blog/index.html", "0.8", "weekly"), (SITE + "/en/blog/index.html", "0.8", "weekly")]

    # --- Arabic ---
    for s in services:
        page, path = render_service(s, "ar", ar_parts, services)
        write(path, page)
        urls.append((SITE + "/" + path, "0.9", "monthly"))
    write("blog/index.html", render_blog_index("ar", posts, ar_parts)[0])
    for p in posts:
        page, path = render_post(p, "ar", posts, services, ar_parts)
        write(path, page)
        urls.append((SITE + "/" + path, "0.7", "yearly"))

    # --- English ---
    page, path = render_en_home()
    write(path, page)
    en_parts = {"sprite": ar_parts["sprite"], "header": "", "footer": "", "floats": EN_FLOATS, "icon": ar_parts["icon"]}
    en_parts["header"] = en_header()
    en_parts["footer"] = en_footer()
    en_services = []
    for s in services:
        e = {**s, **s["_en"]}
        en_services.append(e)
    for s in services:
        s_en = {**s, **s["_en"]}
        page, path = render_service(s_en, "en", en_parts, en_services)
        write(path, page)
        urls.append((SITE + "/" + path, "0.9", "monthly"))
    write("en/blog/index.html", render_blog_index("en", posts, en_parts)[0])
    en_posts = [{**p, **p["_en"]} for p in posts]
    for p in posts:
        pe = {**p, **p["_en"]}
        page, path = render_post(pe, "en", en_posts, services, en_parts)
        write(path, page)
        urls.append((SITE + "/" + path, "0.7", "yearly"))

    write_sitemap(urls)
    print("done: %d services, %d posts (x2 languages)" % (len(services), len(posts)))


if __name__ == "__main__":
    sys.exit(main())
