#!/usr/bin/env python3
"""
يولّد المدونة (blog/index.html + blog/<slug>.html) من content/posts.json،
ويحدّث sitemap.xml ليشمل الصفحات الرئيسية والخدمات والمدونة.

الاستخدام (من جذر المشروع):
    python3 scripts/build_blog.py
"""
import html
import json
import os
import re
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_services as bs  # noqa: E402

ROOT = bs.ROOT
SITE = bs.SITE
MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
          "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]


def esc(s):
    return html.escape(str(s), quote=True)


def arabic_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return "%d %s %d" % (d, MONTHS[m - 1], y)


def reading_minutes(post):
    words = 0
    for b in post["blocks"]:
        for k in ("p", "h2", "tip"):
            if k in b:
                words += len(b[k].split())
        for item in b.get("ul", []):
            words += len(item.split())
    return max(1, round(words / 200))


def blocks_html(blocks):
    out = []
    for b in blocks:
        if "h2" in b:
            out.append("<h2>%s</h2>" % esc(b["h2"]))
        elif "p" in b:
            out.append("<p>%s</p>" % esc(b["p"]))
        elif "ul" in b:
            out.append('<ul class="post-list">%s</ul>' % "".join(
                '<li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>%s</li>' % esc(x)
                for x in b["ul"]))
        elif "tip" in b:
            out.append('<aside class="post-tip"><span>💡</span><p>%s</p></aside>' % esc(b["tip"]))
    return "\n".join(out)


def ld(obj):
    return '<script type="application/ld+json">%s</script>\n' % json.dumps(obj, ensure_ascii=False)


def head(title, desc, keywords, url, og_type, icon, fonts, extra_ld=""):
    return (
        '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n'
        '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>%(title)s</title>\n'
        '<meta name="description" content="%(desc)s">\n'
        '<meta name="keywords" content="%(keywords)s">\n'
        '<link rel="canonical" href="%(url)s">\n'
        '<meta property="og:type" content="%(og_type)s">\n'
        '<meta property="og:locale" content="ar_SA">\n'
        '<meta property="og:site_name" content="مؤسسة كنف — KANAF Systems">\n'
        '<meta property="og:title" content="%(title)s">\n'
        '<meta property="og:description" content="%(desc)s">\n'
        '<meta property="og:url" content="%(url)s">\n'
        '<meta name="twitter:card" content="summary">\n'
        '%(icon)s\n%(fonts)s'
        '<link rel="stylesheet" href="../assets/css/site.css">\n'
        '<link rel="stylesheet" href="../assets/css/extra.css">\n'
        '<link rel="stylesheet" href="../assets/css/services.css">\n'
        '%(extra_ld)s'
        '</head>\n<body class="svc-page">\n'
    ) % {"title": esc(title), "desc": esc(desc), "keywords": esc(keywords), "url": url,
         "og_type": og_type, "icon": icon, "fonts": fonts, "extra_ld": extra_ld}


def tail(parts, scripts_extra=""):
    return (
        '<button id="toTop" aria-label="العودة للأعلى"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></button>\n'
        '<script src="../content/site-data.js"></script>\n'
        '<script src="../assets/js/site.js"></script>\n'
        '</body>\n</html>\n'
    )


def render_post(post, posts, parts):
    url = "%s/blog/%s.html" % (SITE, post["slug"])
    mins = reading_minutes(post)
    blog_ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post["title"],
        "description": post["description"],
        "datePublished": post["date"],
        "dateModified": post["date"],
        "inLanguage": "ar",
        "mainEntityOfPage": url,
        "author": {"@type": "Organization", "name": "مؤسسة كنف"},
        "publisher": {"@type": "Organization", "name": "مؤسسة كنف الأمان للمراقبة الأمنية",
                      "logo": {"@type": "ImageObject", "url": SITE + "/assets/images/logo.png"}},
    }
    crumb_ld = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "المدونة", "item": SITE + "/blog/index.html"},
            {"@type": "ListItem", "position": 3, "name": post["title"], "item": url},
        ],
    }
    extra = ld(blog_ld) + ld(crumb_ld)

    svc_card = ""
    if post.get("relatedService"):
        svc = next((s for s in json.loads(bs.read("content/services.json"))["services"]
                    if s["slug"] == post["relatedService"]), None)
        if svc:
            svc_card = (
                '<a class="post-svc reveal" href="../services/%(slug)s.html">'
                '<span>خدمة ذات صلة</span><strong>%(name)s</strong>'
                '<em>%(lead)s</em><b>التفاصيل ←</b></a>'
            ) % {"slug": svc["slug"], "name": esc(svc["name"]), "lead": esc(svc["lead"])}

    others = [p for p in posts if p["slug"] != post["slug"]][:3]
    more = "".join(
        '<a class="mini-post" href="%s.html"><span>%s</span><strong>%s</strong></a>'
        % (p["slug"], esc(p["category"]), esc(p["title"])) for p in others
    )

    return (
        head(post["title"] + " | مدونة كنف", post["description"], post["keywords"], url, "article",
             parts["icon"], parts["fonts"], extra)
        + "%s\n" % parts["sprite"]
        + '<div id="progressBar"></div>\n'
        + parts["header"] + "\n<main>\n"
        + '<div class="page-hero"><div class="container">\n'
          '  <div class="crumbs"><a href="../index.html">الرئيسية</a><i>/</i><a href="index.html">المدونة</a><i>/</i><span>%s</span></div>\n'
          '  <span class="svc-eyebrow">%s</span>\n'
          '  <h1>%s</h1>\n'
          '  <p>%s</p>\n'
          '  <div class="post-meta"><span>%s</span><span>%s</span><span>%d دقائق قراءة</span></div>\n'
          '</div></div>\n' % (esc(post["title"]), esc(post["category"]), esc(post["title"]),
                              esc(post["excerpt"]), esc(post["category"]), arabic_date(post["date"]), mins)
        + '<div class="pad"><div class="container post-layout">\n'
          '  <article class="post-body reveal">\n%s\n</article>\n' % blocks_html(post["blocks"])
        + '  <aside class="post-aside">\n'
          '    <div class="side-card reveal">\n'
          '      <h3>هل تحتاج تنفيذ هذا؟</h3>\n'
          '      <p>المعاينة وعرض السعر بدون التزام.</p>\n'
          '      <a class="btn btn-green" href="%s" target="_blank" rel="noopener">واتساب مباشر</a>\n'
          '      <a class="btn btn-line" href="../index.html#contact">نموذج طلب عرض السعر</a>\n'
          '    </div>\n' % bs.WA
        + ('    %s\n' % svc_card if svc_card else "")
        + ('    <div class="side-card reveal d1"><h3>مقالات أخرى</h3><div class="mini-list">%s</div></div>\n' % more if more else "")
        + '  </aside>\n</div></div>\n'
        + '</main>\n' + parts["footer"] + "\n" + parts["floats"] + "\n" + tail(parts)
    )


def render_index(posts, parts):
    url = SITE + "/blog/index.html"
    title = "المدونة | مؤسسة كنف — نصائح كاميرات المراقبة والأنظمة الأمنية"
    desc = "مقالات عملية عن كاميرات المراقبة والأنظمة الأمنية وإنذار الحريق والشبكات، من فريق مؤسسة كنف بمكة المكرمة."
    blog_ld = {
        "@context": "https://schema.org", "@type": "Blog",
        "name": "مدونة مؤسسة كنف", "url": url, "inLanguage": "ar",
        "blogPost": [{"@type": "BlogPosting", "headline": p["title"],
                      "url": "%s/blog/%s.html" % (SITE, p["slug"]), "datePublished": p["date"]} for p in posts],
    }
    cards = "".join(
        '<a class="post-card reveal" href="%(slug)s.html">'
        '<div class="pc-top"><span class="pc-cat">%(cat)s</span><span class="pc-date">%(date)s</span></div>'
        '<h2>%(title)s</h2><p>%(excerpt)s</p>'
        '<span class="pc-more">اقرأ المقال <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>'
        '<span class="pc-read">%(mins)d دقائق قراءة</span></a>\n'
        % {"slug": p["slug"], "cat": esc(p["category"]), "date": arabic_date(p["date"]),
           "title": esc(p["title"]), "excerpt": esc(p["excerpt"]), "mins": reading_minutes(p)}
        for p in sorted(posts, key=lambda x: x["date"], reverse=True)
    )
    return (
        head(title, desc, "مدونة كنف, كاميرات مراقبة, أنظمة أمنية, إنذار الحريق, شبكات, صيانة كاميرات مكة",
             url, "website", parts["icon"], parts["fonts"], ld(blog_ld))
        + "%s\n" % parts["sprite"]
        + '<div id="progressBar"></div>\n'
        + parts["header"] + "\n<main>\n"
        + '<div class="page-hero"><div class="container">\n'
          '  <div class="crumbs"><a href="../index.html">الرئيسية</a><i>/</i><span>المدونة</span></div>\n'
          '  <h1>مدونة <span class="grad">كنف</span></h1>\n'
          '  <p>مقالات عملية تساعدك على اتخاذ قرار أفضل في كاميرات المراقبة والأنظمة الأمنية والشبكات.</p>\n'
          '</div></div>\n'
        + '<div class="pad"><div class="container"><div class="post-grid">\n%s</div></div></div>\n' % cards
        + '<div class="pad-b"><div class="container"><div class="cta-inner reveal">\n'
          '  <div><h3>تحتاج استشارة لموقعك؟</h3><p>أرسل احتياجك وسنتواصل معك لدراسة المنشأة وتقديم الحل المناسب.</p></div>\n'
          '  <div style="display:flex;gap:14px;flex-wrap:wrap"><a class="btn btn-white" href="%s" target="_blank" rel="noopener">واتساب مباشر</a><a class="btn btn-darkline" href="../index.html#contact">طلب عرض سعر</a></div>\n'
          '</div></div></div>\n' % bs.WA
        + '</main>\n' + parts["footer"] + "\n" + parts["floats"] + "\n" + tail(parts)
    )


def write_sitemap(posts, services):
    urls = [(SITE + "/", "1.0", "monthly"), (SITE + "/blog/index.html", "0.8", "weekly")]
    urls += [("%s/services/%s.html" % (SITE, s["slug"]), "0.9", "monthly") for s in services]
    urls += [("%s/blog/%s.html" % (SITE, p["slug"]), "0.7", "yearly") for p in posts]
    body = "\n".join("  <url><loc>%s</loc><changefreq>%s</changefreq><priority>%s</priority></url>" % (u, c, p)
                     for u, p, c in urls)
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % body)


def main():
    posts = json.loads(bs.read("content/posts.json"))["posts"]
    services = json.loads(bs.read("content/services.json"))["services"]
    parts = bs.shared_parts("blog")
    out = os.path.join(ROOT, "blog")
    os.makedirs(out, exist_ok=True)

    with open(os.path.join(out, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(render_index(posts, parts))
    print("built blog/index.html")

    for p in posts:
        with open(os.path.join(out, p["slug"] + ".html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(render_post(p, posts, parts))
        print("built blog/%s.html" % p["slug"])

    write_sitemap(posts, services)
    print("sitemap updated; done: %d posts" % len(posts))


if __name__ == "__main__":
    sys.exit(main())
