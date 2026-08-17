# -*- coding: utf-8 -*-
"""
Fritz favicon — two optical masters cut from the real wordmark.

DISPLAY master (touch icon 180, manifest 192/512): the exact `f` from the wordmark path
  in mulle-machined.js, cut free of the `r` at the hook's terminal (x=186), traced
  imprecisions cleaned to exact coordinates.
SMALL master (favicon.svg / .ico at 16, 32, 48): the same proportions redrawn on a
  16-unit grid so every straight edge lands on a pixel boundary at 16px, and stays
  crisp at 2x (32) and 3x (48). This is optical sizing for an icon: the small size is
  drawn, not shrunk.

Palette is the site's: ink #1D1D1F, paper #F5F5F7. The mark is monochrome like the
wordmark; the tile is the site's dark-button material.
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

# ---------------------------------------------------------------- small master (16-grid)
# INTEGER grid. Pixel boundaries are at integers, so a 2px stroke must run e.g. x=6..8 (cols
# 6 and 7 fully covered). The first draft used .5 coordinates and half-covered both edge
# columns of every stroke -- measured 37 anti-aliased pixels at 16px, i.e. soft everywhere.
# Glyph 8 wide x 12 tall in the 16 tile: margins 4/4 and 2/2, so it is exactly centred and
# its mass centroid (7.86) sits on the tile centre (8). Slightly wider than the mark's 0.58
# aspect (0.67) -- at 16px an f wants that opening; small optical sizes get wider and
# heavier, like small text sizes get a larger x-height. Hook is 2px thick, with a 2px clear
# counter between the hook and the bar so the letter never muddies.
G = dict(L=4, R=12, T=2, B=14, SL=6, SR=8, CT=6, CB=8, HI=4)   # HI = hook inner top
def small_f(g=G):
    L,R,T,B,SL,SR,CT,CB,HI = (g[k] for k in ('L','R','T','B','SL','SR','CT','CB','HI'))
    # Both hook curves are the wordmark's own, mapped onto this grid (x 4..186 -> 4..12,
    # y 4..317 -> 2..14) with the flat runs snapped so the top of the hook is a full,
    # crisp 2px band from x~9.5 to the terminal.
    return (f"M{SL},{CT} L{L},{CT} L{L},{CB} L{SL},{CB} L{SL},{B} L{SR},{B} L{SR},{CB} "
            f"L{R},{CB} L{R},{CT} L{SR},{CT} "
            f"C{SR},5.5 8.3,4.6 9.0,4.2 "            # inner hook rises steeply out of the bar...
            f"C9.6,{HI} 10.6,{HI} {R},{HI} "         # ...and runs flat to the terminal
            f"L{R},{T} "                             # terminal cut, 2px tall, at x=12
            f"C10.6,{T} 9.5,2.1 8.5,2.4 "            # outer hook: flat across the top...
            f"C7.0,2.95 6.07,4.14 {SL},5.7 Z")       # ...turning down into the stem (closes to 6,6)
def small_svg(size=16, radius=3.5):
    """The favicon: 16 viewBox, tile r=3.5 (22% -- Apple's continuous-corner proportion).
    Dark scheme: the ink tile is the same tone as Chrome/Firefox dark tab strips (#202124 /
    #1C1B22), so the tile vanished and only a bare f floated -- two independent reviewers
    flagged it. A material on same-tone ground gets a hairline edge: a .24-white keyline,
    dark-scheme only, non-scaling so it stays one device pixel at 2x. Chromium evaluates
    prefers-color-scheme inside SVG favicons (tested); min-resolution it does not."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="{size}" height="{size}">'
            f'<style>.k{{stroke:none}}@media (prefers-color-scheme:dark){{.k{{stroke:rgba(255,255,255,.24)}}}}</style>'
            f'<rect width="16" height="16" rx="{radius}" fill="{INK}"/>'
            f'<rect class="k" x=".5" y=".5" width="15" height="15" rx="{radius-0.5}" fill="none" vector-effect="non-scaling-stroke"/>'
            f'<path d="{small_f()}" fill="{PAPER}"/></svg>')

# ---------------------------------------------------------------- 32- and 48-grid masters
# For the ICO's 32 and 48 entries (Safari <17, Windows). At those sizes the mark's true
# proportions ARE renderable on an integer grid, so these sit closer to the wordmark than
# the 16-grid scaled up (which is crisp but chunky: hook 2 strokes wide vs the mark's 1.4).
# The SVG stays on the 16 grid -- an SVG cannot see the device DPR, and 1x crispness wins.
GRIDS = {
    #      L   SL  SR   R   T   B  CT  CB  HI    (stroke 4 / 6; glyph 14x24 / 20x36)
    32: dict(L=9,  SL=12, SR=16, R=23, T=4, B=28, CT=12, CB=16, HI=8),
    48: dict(L=14, SL=19, SR=25, R=34, T=6, B=42, CT=18, CB=24, HI=12),
}
def _map(x, y, g):
    """display coords (x 4..186, y 4..317) -> this grid's glyph box"""
    return (g['L'] + (x-4)/182*(g['R']-g['L']), g['T'] + (y-4)/313*(g['B']-g['T']))
def grid_f(size):
    g = GRIDS[size]; L,R,T,B,SL,SR,CT,CB,HI = (g[k] for k in ('L','R','T','B','SL','SR','CT','CB','HI'))
    m = lambda x,y: '%.2f,%.2f' % _map(x,y,g)
    # same construction as the display f; the hook curves are the mark's, mapped; flats snapped
    return (f"M{SL},{CT} L{L},{CT} L{L},{CB} L{SL},{CB} L{SL},{B} L{SR},{B} L{SR},{CB} "
            f"L{R},{CB} L{R},{CT} L{SR},{CT} "
            f"C{m(106,104.4)} {m(106.5,100.7)} {m(107.1,97.4)} "
            f"C{m(110.2,80.6)} {m(122,68.1)} {m(140,62.5)} "
            f"C{m(144.1,61.2)} {m(150.6,60.6)} {R},{HI} "
            f"L{R},{T} "
            f"C{m(154.6,4.2)} {m(142.6,4.6)} {m(139,5)} "
            f"C{m(129.3,6.2)} {m(116.9,9.6)} {m(107.1,13.9)} "
            f"C{m(72.3,28.9)} {m(51.1,59.7)} {SL},{_map(47.5,100.2,g)[1]:.2f} Z")
def grid_svg(size):
    r = size*0.22
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
            f'<rect width="{size}" height="{size}" rx="{r:.2f}" fill="{INK}"/>'
            f'<path d="{grid_f(size)}" fill="{PAPER}"/></svg>')

if __name__ == '__main__':
    with open(os.path.join(OUT, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(small_svg())
    with open(os.path.join(OUT, 'small-16.svg'), 'w', encoding='utf-8') as f:
        f.write(small_svg(16))
    for sz in (32, 48):
        with open(os.path.join(OUT, f'small-{sz}.svg'), 'w', encoding='utf-8') as f:
            f.write(grid_svg(sz))
    for sz in (180, 192, 512):
        with open(os.path.join(OUT, f'display-{sz}.svg'), 'w', encoding='utf-8') as f:
            f.write(display_svg(sz))
    print('svgs written')
