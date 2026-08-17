# -*- coding: utf-8 -*-
"""Assemble the shipping set from the rendered PNGs and copy it to the site root."""
import os, shutil, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
os.chdir(HERE)
PAPER = (0xF5, 0xF5, 0xF7)
# favicon.ico: FIVE frames, one per size browsers request (16 1x, 20 125%, 24 150%, 32 2x, 48 3x),
# each its own drawing. Base must be the largest -- Pillow drops sizes bigger than the base.
fr = {s: Image.open(f'm-{s}.png').convert('RGBA') for s in (16, 20, 24, 32, 48)}
# hint the corners of the small frames: with a 2px radius the arc leaves the corner pixel ~35%
# opaque, a grey dot on dark tab strips. Icon designers hand-tune these; so do we.
for s in (16, 20, 24):
    px = fr[s].load()
    for (x, y) in [(0, 0), (s-1, 0), (0, s-1), (s-1, s-1)]:
        if px[x, y][3] < 100: px[x, y] = (0, 0, 0, 0)
fr[48].save('favicon.ico', format='ICO', sizes=[(16,16),(20,20),(24,24),(32,32),(48,48)],
            append_images=[fr[16], fr[20], fr[24], fr[32]], bitmap_format='bmp')
# opaque RGB squares on paper for iOS / Android (the OS applies its own mask)
for src, dst in [('m-180.png','apple-touch-icon.png'), ('m-192.png','icon-192.png'), ('m-512.png','icon-512.png')]:
    im = Image.open(src).convert('RGBA'); bg = Image.new('RGB', im.size, PAPER); bg.paste(im, mask=im.split()[3]); bg.save(dst, optimize=True)
man = {"name": "Fritz — Agency, Geneva", "short_name": "Fritz",
       "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
                 {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}],
       "start_url": "/", "display": "browser", "background_color": "#F5F5F7", "theme_color": "#F5F5F7"}
open('site.webmanifest', 'w', encoding='utf-8').write(json.dumps(man, ensure_ascii=False, indent=2) + "\n")
for f in ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']:
    shutil.copyfile(f, os.path.join(ROOT, f)); print('->', f)
