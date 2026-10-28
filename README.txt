RAXUSATPrep — USAT preparation website
=========================================
Prepare Smarter. Practice Better. Score Higher.

WHAT THIS IS
A complete static website: public pages for search engines plus a practice app
in /app/. No build step, no server, no login, no API keys. Progress is saved in
the student's own browser (IndexedDB).

OPEN IT
- On your computer: double-click index.html. Everything works from the folder,
  including the app (app/index.html). Offline install (PWA) needs https hosting.
- Online with Netlify Drop: go to https://app.netlify.com/drop and drag the whole
  RAXUSATPrep folder onto the page. That's it.
- Any static host works (GitHub Pages, Cloudflare Pages, shared hosting): upload
  the folder contents so index.html is at the site root.

FOLDERS
  index.html, 404.html, robots.txt, sitemap.xml, manifest.webmanifest, sw.js
  app/                practice app (noindex)
  assets/css, js      styles and scripts (no external libraries)
  assets/fonts        Inter, TeX Gyre Adventor, Lora (open font licences)
  assets/img          logo, favicon, app icons, share images (og/)
  data/               exam-config.js, quotes.js, essays.js, questions/*.js
  usat-*/ etc.        one folder per public page

CHANGE THINGS
- Test pattern, timings, negative marking, categories, contact details:
  data/exam-config.js. The app and the pattern tables on the public pages read it.
  Update "patternLastChecked" when you confirm the pattern with HEC/ETC.
- Quotes: data/quotes.js (43 quotes rotate on the site and in the app).
- Questions: data/questions/*.js (one file per subject; record format in
  CONTENT-REPORT.md). Only "verified" questions are used in mocks.

YOUR DOMAIN AND GOOGLE SEARCH CONSOLE
1. The pages use the placeholder domain https://raxusatprep.netlify.app. If your
   site lives elsewhere, replace that text in every .html file, sitemap.xml and
   robots.txt (a find-and-replace across the folder).
2. Open https://search.google.com/search-console, add your site (URL-prefix
   property), and verify it (HTML-file upload is easiest: put Google's file in
   the site root and redeploy).
3. In Search Console > Sitemaps, submit: sitemap.xml
4. Use URL Inspection on the home page and the category pages and click
   "Request indexing".

CONTACT DETAILS SHOWN ON THE SITE
  Email     rohilahmedsial@gmail.com
  GitHub    https://github.com/rohail-ahmed-sial
  LinkedIn  https://www.linkedin.com/in/rohailahmedsial

PRIVACY
No analytics, cookies or tracking. Students can export, import and clear their
data in Settings.

CREDITS
Questions adapted from the TIPS Educational Consultants USAT books and checked
for RAXUSATPrep. Icons: Font Awesome Free 6 (CC BY 4.0). Fonts: Inter (SIL OFL),
TeX Gyre Adventor (GUST Font License), Lora (SIL OFL).

DISCLAIMER
RAXUSATPrep is an independent practice platform. It is not affiliated with,
endorsed by or operated by HEC or ETC. Always confirm the latest test pattern,
dates and eligibility on official HEC/ETC sources.
