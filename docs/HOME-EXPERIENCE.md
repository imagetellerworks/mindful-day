# Mindful Day home and experience

- `/mindful-day/` is the public color portfolio and landing page.
- `/mindful-day/experience/` is the complete original interactive experience.
- The Experience CTA opens its current reviewed color. Home returns to the landing view.
- Plain and view-hash home links stay on the landing page. Legacy `word`, `set`, `study`, `tour`, `showroom` and `from=atlas` links retain their parameters and redirect to the experience.
- Fresh visits default to Korean. An explicit EN/KR choice is shared through the browser-local key `mindful-day-language-v2`.
- The Mindful Day brand title uses Pretendard at weight 600. Other custom poster titles retain their selected font.
- The 219 reviewed palettes, existing experience assets, original color engine, usage connection and artwork-only showroom remain intact.
- The CTA is positioned independently of the animated layouts; shallow landscape windows use a compact editorial column.

Run the packaged route check with `node --test tests/home-experience.test.cjs`. The landing source and experience source were also verified with their respective 18 and 374 tests. Historical model scripts and tests remain in this repository for reference.
