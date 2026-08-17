# -*- coding: utf-8 -*-
"""Assemble the shipping set from the rendered PNGs and copy it to the site root.
   python build.py && node make.js && python assemble.py"""
import os, shutil, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
os.chdir(HERE)
INK = (0x1D, 0x1D, 0x1F)
# favicon.ico: three BMP entries, each from its OWN grid master (base must be the largest -- Pillow
# drops requested sizes bigger than the base image)
f16, f32, f48 = (Image.open(f'small-{s}.png').convert('RGBA') for s in (16, 32, 48))
f48.save('favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48)], append_images=[f16, f32], bitmap_format='bmp')
# opaque RGB squares for iOS / Android (iOS applies its own mask; Apple prefers no alpha)
for src, dst in [('display-180.png','apple-touch-icon.png'), ('display-192.png','icon-192.png'), ('display-512.png','icon-512.png')]:
    im = Image.open(src).convert('RGBA'); bg = Image.new('RGB', im.size, INK); bg.paste(im, mask=im.split()[3]); bg.save(dst, optimize=True)
man = {"name": "Fritz \u2014 Agency, Geneva", "short_name": "Fritz",
       "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
                 {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}],
       "start_url": "/", "display": "browser", "background_color": "#F5F5F7", "theme_color": "#F5F5F7"}
open('site.webmanifest', 'w', encoding='utf-8').write(json.dumps(man, ensure_ascii=False, indent=2) + "\n")
for f in ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']:
    shutil.copyfile(f, os.path.join(ROOT, f)); print('->', f)
