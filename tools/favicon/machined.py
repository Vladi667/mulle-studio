# -*- coding: utf-8 -*-
"""
Fritz favicon — Machined. The f as a technical drawing of itself, like the hero.

Material is the hero's: paper #F5F5F7 sheet, ink #1D1D1F, blue #0071E3 crosshair, hairlines
in the hero's rule tone. Every frame is DRAWN for its size (optical sizing), and the ICO
carries one frame per size browsers actually request, so nothing is ever scaled:

  16 · 20 · 24 · 32 · 48  the OBJECT — solid ink f on the paper sheet with its hairline
                frame, blue crosshair on the datum corner. (A plan -- 1px outline -- was
                tried at 32/48; at its physical size it reads grey and ghostly. The drawing
                is shown pressed-in at tab sizes: the hero's own plan -> object idea.)
  180 · 192 · 512  the exact wordmark f as a plan (2.5px @180, proportional), crosshair, and on
                the touch icon one dimension line under the f (the hero's "874 x 321").
                Square, opaque, RGB — the OS applies its own mask.

Why no SVG favicon: an SVG is one geometry for all sizes; it cannot be a crisp object at 16
AND a crisp plan at 32. Browsers pick ICO frames by exact size, so the ICO is the vehicle.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

INK, PAPER, BLUE = '#1D1D1F', '#F5F5F7', '#0071E3'
RULE = 'rgba(29,29,31,.28)'
CROSS_OP = 0.92   # a 1-device-px line at the hero's .55 was a tint (~2.4:1); at icon size it needs near-full ink to register

# integer grids: L R = crossbar span, T B = top/baseline, SL SR = stem, CT CB = crossbar, HI = hook inner top
GRIDS = {
    16: dict(L=4,  SL=6,  SR=8,  R=12, T=2, B=14, CT=6,  CB=8,  HI=4,  stroke=2),
    20: dict(L=5,  SL=7,  SR=10, R=15, T=2, B=18, CT=7,  CB=10, HI=5,  stroke=3),
    24: dict(L=7,  SL=9,  SR=12, R=17, T=3, B=21, CT=9,  CB=12, HI=6,  stroke=3),
    32: dict(L=9,  SL=12, SR=16, R=23, T=4, B=28, CT=12, CB=16, HI=8,  stroke=4),
    48: dict(L=14, SL=19, SR=25, R=34, T=6, B=42, CT=18, CB=24, HI=12, stroke=6),
}
# All tab-size frames are the OBJECT. The plan was drawn at 32/48 too, and low-passed to its
# physical size a 1px outline f reads grey and ghostly beside any solid favicon -- it fails
# presence, the one job a tab icon has. The plan lives where it can be seen: 180 and up.
OBJECT_SIZES, PLAN_SIZES = (16, 20, 24, 32, 48), ()

def _map(x, y, g):
    return (g['L'] + (x-4)/182*(g['R']-g['L']), g['T'] + (y-4)/313*(g['B']-g['T']))

def grid_path(size, inset=0.0):
    """Closed f outline on the grid. inset .5 puts every straight edge line on a whole pixel when
    the path is STROKED 1px (plan); inset 0 is the fill boundary (object)."""
    g = GRIDS[size]
    L,R,T,B,SL,SR,CT,CB,HI = (g[k] for k in ('L','R','T','B','SL','SR','CT','CB','HI'))
    i = inset
    l,r,t,b,sl,sr,ct,cb,hi = L+i, R-i, T+i, B-i, SL+i, SR-i, CT+i, CB-i, HI-i
    m = lambda x, y, dx=0, dy=0: '%.2f,%.2f' % (_map(x, y, g)[0]+dx*i, _map(x, y, g)[1]+dy*i)
    return (f"M{sl},{ct} L{l},{ct} L{l},{cb} L{sl},{cb} L{sl},{b} L{sr},{b} L{sr},{cb} "
            f"L{r},{cb} L{r},{ct} L{sr},{ct} "
            f"C{m(106,104.4,-1)} {m(106.5,100.7,-1)} {m(107.1,97.4,-1)} "
            f"C{m(110.2,80.6,-.8,.6)} {m(122,68.1,-.4,.8)} {m(140,62.5,0,1)} "
            f"C{m(144.1,61.2,0,1)} {m(150.6,60.6,0,1)} {r},{hi} "
            f"L{r},{t} "
            f"C{m(154.6,4.2,0,1)} {m(142.6,4.6,0,1)} {m(139,5,0,1)} "
            f"C{m(129.3,6.2,0,1)} {m(116.9,9.6,.4,.8)} {m(107.1,13.9,.8,.6)} "
            f"C{m(72.3,28.9,1,.4)} {m(51.1,59.7,1,0)} {sl},{_map(47.5,100.2,g)[1]:.2f} Z")

def cross(x, y, W, dot_r, op=CROSS_OP, sw=1, ns=True):
    v = ' vector-effect="non-scaling-stroke"' if ns else ''
    return (f'<g stroke="{BLUE}" stroke-width="{sw}" opacity="{op}"{v}>'
            f'<line x1="{x}" y1="0" x2="{x}" y2="{W}"/><line x1="0" y1="{y}" x2="{W}" y2="{y}"/></g>'
            f'<circle cx="{x}" cy="{y}" r="{dot_r}" fill="{BLUE}"/>')

def sheet(W, radius, frame=True):
    s = f'<rect width="{W}" height="{W}" rx="{radius}" fill="{PAPER}"/>'
    if frame:
        s += (f'<rect x=".5" y=".5" width="{W-1}" height="{W-1}" rx="{max(0, radius-.5)}" fill="none" '
              f'stroke="{RULE}" stroke-width="1" vector-effect="non-scaling-stroke"/>')
    return s

def frame_svg(size):
    """One ICO frame, drawn for its size."""
    g = GRIDS[size]
    x, y = g['SL'] + .5, g['T'] + .5                       # datum: stem-left at hook top
    r = round(size * 0.125 * 2) / 2                        # 12.5% -- a sheet, not an app tile
    dot = 1.0 if size <= 24 else 1.25
    if size in OBJECT_SIZES:
        glyph = f'<path d="{grid_path(size, 0)}" fill="{INK}"/>'
    else:
        # The plan is a FILLED 1px ring -- outer contour minus the contour inset 1px, evenodd --
        # not a stroked path: Chromium leaves a 1px stroke's corners at 75% coverage (two
        # half-pixels, no mitre fill), while a ring's corners are whole pixels by construction.
        glyph = f'<path d="{grid_path(size, 0)} {grid_path(size, 1.0)}" fill="{INK}" fill-rule="evenodd"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
            f'{sheet(size, r)}{cross(x, y, size, dot)}{glyph}</svg>')

def display_svg(size, dimension=False, glyph_frac=0.60, dy_units=9.0):
    """180 / 192 / 512: exact wordmark f as a plan. Square, no frame (OS masks it)."""
    bw, bh = build.DISPLAY_BOX[2]-build.DISPLAY_BOX[0], build.DISPLAY_BOX[3]-build.DISPLAY_BOX[1]
    s = (size*glyph_frac)/bh; gw, gh = bw*s, bh*s
    ox = (size-gw)/2 - build.DISPLAY_BOX[0]*s
    oy = (size-gh)/2 - build.DISPLAY_BOX[1]*s + dy_units*s
    k = size/180.0                                          # everything proportional to the 180
    # Optical sizing for the ANNOTATIONS too: at hero weight the crosshair was a hint and the
    # dimension line invisible at 60pt (measured 1.7:1). Outline 3.5px @180 (the hero's 1.25css
    # px on Retina), crosshair an INTEGER width centred on a pixel edge so it never smears to
    # 1.4px, dimension 2px at half ink.
    outline_w, dot_r = 3.5*k, 3.2*k
    cross_w = max(2, round(2*k))
    snap = 0.0 if cross_w % 2 == 0 else 0.5
    cx, cy = round(ox + build.SL*s) + snap, round(oy + build.T*s) + snap
    body = f'<rect width="{size}" height="{size}" fill="{PAPER}"/>'
    body += cross(cx, cy, size, dot_r, op=0.88, sw=cross_w, ns=False)
    if dimension:                                           # the hero's "874 x 321", without the text
        y = round(oy + build.B*s + 15*k); x1 = ox + build.L*s; x2 = ox + build.R*s; tk = 5*k
        body += (f'<g stroke="rgba(29,29,31,.55)" stroke-width="{max(2, round(2*k))}" fill="none">'
                 f'<line x1="{x1:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y:.1f}"/>'
                 f'<line x1="{x1:.1f}" y1="{y-tk:.1f}" x2="{x1:.1f}" y2="{y+tk:.1f}"/>'
                 f'<line x1="{x2:.1f}" y1="{y-tk:.1f}" x2="{x2:.1f}" y2="{y+tk:.1f}"/></g>')
    body += (f'<path transform="translate({ox:.4f},{oy:.4f}) scale({s:.6f})" d="{build.DISPLAY_F}" '
             f'fill="none" stroke="{INK}" stroke-width="{outline_w:.2f}" vector-effect="non-scaling-stroke" stroke-linejoin="miter" stroke-miterlimit="4"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">{body}</svg>'

if __name__ == '__main__':
    OUT = os.path.dirname(os.path.abspath(__file__))
    for sz in GRIDS:
        open(os.path.join(OUT, f'm-{sz}.svg'), 'w', encoding='utf-8').write(frame_svg(sz))
    open(os.path.join(OUT, 'm-180.svg'), 'w', encoding='utf-8').write(display_svg(180, dimension=True))
    open(os.path.join(OUT, 'm-192.svg'), 'w', encoding='utf-8').write(display_svg(192))
    open(os.path.join(OUT, 'm-512.svg'), 'w', encoding='utf-8').write(display_svg(512))
    print('machined masters written: 16 20 24 32 48 180 192 512')
