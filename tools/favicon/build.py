# -*- coding: utf-8 -*-
"""
Fritz favicon — the wordmark's `f` geometry (imported by machined.py).

The exact `f` from the wordmark path in assets/mulle-machined.js, cut free of the `r` at the
hook's terminal (x=186), traced imprecisions cleaned to exact coordinates.
"""
import os, json

OUT = os.path.dirname(os.path.abspath(__file__))
INK, PAPER = '#1D1D1F', '#F5F5F7'

# ---------------------------------------------------------------- display master
# Wordmark units (874x321 viewBox). Cleaned key lines:
L, R = 4.0, 186.0            # crossbar left end / hook terminal + crossbar right end
T, B = 4.0, 317.0            # top of hook / baseline
SL, SR = 47.0, 106.0         # stem left / right
CT, CB = 108.0, 161.0        # crossbar top / bottom
# The hook curves are the brand's — kept as traced, endpoints snapped to the clean lines.
DISPLAY_F = (
    f"M139,5 "
    f"C129.327,6.185 116.936,9.610 107.073,13.862 "
    f"C72.302,28.853 51.058,59.663 {SL},100.25 "        # outer hook down to stem-left
    f"L{SL},{CT} L{L},{CT} L{L},{CB} L{SL},{CB} "       # crossbar, left arm
    f"L{SL},{B} L{SR},{B} L{SR},{CB} "                  # stem down and back up
    f"L{R},{CB} L{R},{CT} L{SR},{CT} "                  # crossbar, right arm (cut at R)
    f"L{SR},105.7 "
    f"C{SR},104.4 106.5,100.7 107.1,97.4 "              # inner hook
    f"C110.2,80.6 122.0,68.1 140.0,62.5 "
    f"C144.1,61.2 150.6,60.6 165.8,60.3 "
    f"L{R},60 L{R},{T} L165.8,4.1 "                     # terminal cut, top edge
    f"C154.6,4.2 142.6,4.6 139,5 Z"
)
DISPLAY_BOX = (L, T, R, B)   # 182 x 313

# glyph 0.60 of the tile (confident, not crowded); shifted +9 units down so the visual mass --
# hook and bar are top-heavy -- sits centred instead of riding high (measured centroid was
# 17px above centre at 512; this splits the difference with the bbox centre).
def display_svg(size, glyph_frac=0.60, radius_frac=0.0, opaque=True, dy_units=9.0):
    """Tile of `size` px with the display f. radius_frac 0 = square (iOS masks it itself)."""
    bw, bh = DISPLAY_BOX[2]-DISPLAY_BOX[0], DISPLAY_BOX[3]-DISPLAY_BOX[1]
    s = (size*glyph_frac)/bh
    gw, gh = bw*s, bh*s
    ox = (size-gw)/2 - DISPLAY_BOX[0]*s
    oy = (size-gh)/2 - DISPLAY_BOX[1]*s + dy_units*s
    r = size*radius_frac
    tile = (f'<rect width="{size}" height="{size}" rx="{r:.3f}" fill="{INK}"/>' if opaque
            else f'<rect width="{size}" height="{size}" rx="{r:.3f}" fill="{INK}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'{tile}<path transform="translate({ox:.4f},{oy:.4f}) scale({s:.6f})" d="{DISPLAY_F}" fill="{PAPER}"/></svg>')

if __name__ == '__main__':
    print('geometry module -- run machined.py')
