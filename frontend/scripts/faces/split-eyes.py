#!/usr/bin/env python3
"""
Cuts the eyes of the plain look of the faces of people into the shapes that move apart, and writes
them to src/shared/components/face/human/human-eye-art.constants.ts.

The art draws an eye as one dark shape: the iris, the lid and the lashes together. A gaze moves
the iris in the eye, so the shape is cut in two here, once, and the result is kept as data; the
web app does not cut anything while it runs.

  iris  an ellipse on the thick, round part of the shape, cut by the shape itself, so that it is
        never outside of the eye that the art draws
  lid   what is left: the line of the lid and the lashes, with nothing dark under the iris, so
        that the skin shows where the iris has moved from
  white where the art draws white on the dark: the white of the eye (variant05), which stays under
        the rest, or a gleam in the iris (variant03, variant09), which moves with it

The lid goes a little over the edge of the iris, and the iris a little under the lid, so that no
seam shows between the two. Pieces left by the cut that are thinner than a lid (slivers along the
edge of the iris) or smaller than a lash (specks) are dropped.

Run it from the frontend folder after `pnpm install`, then format the result:

  python3 -m venv /tmp/faces-venv && /tmp/faces-venv/bin/pip install shapely svgelements numpy
  /tmp/faces-venv/bin/python scripts/faces/split-eyes.py
  pnpm exec prettier --write src/shared/components/face/human/human-eye-art.constants.ts

The eyes can be checked by eye with the PARAMS below: an eye that comes out wrong is given
parameters of its own, by variant or by variant and eye (the eyes of a variant are numbered from
the left).
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from shapely import affinity
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
from svgelements import Move, Path as SvgPath

STYLE = Path('node_modules/@dicebear/styles/dist/lorelei.min.json')
OUT = Path('src/shared/components/face/human/human-eye-art.constants.ts')

# Where the art splits the left eye from the right one: the eyes of every variant lie each on one side.
MIDLINE = 185

# The lid goes this far over the edge of the iris, and the iris this far under the lid.
OVER = 1.6
# A lid is thicker than this: a piece thinner than this, along the edge of the iris, is not a lid.
SLIVER = 2.2

# f: how much of the widest circle of the shape the thick part is taken as (more: a rounder, smaller iris)
# s: the size of the ellipse of the iris, as a multiple of the thick part (more: it takes more of the lid)
# dx, dy: where the ellipse is moved, in the units of the art
# speck: a piece of the lid smaller than this is not a lash
PARAMS = {
    'default': {'f': 0.6, 's': 1.08, 'dx': 0, 'dy': 0, 'speck': 100},
    ('variant07', 2): {'speck': 40},   # the line of the lower lid of the right eye is small, and a lid
}

# Parts of the lid that look strange beside the rest, as boxes (x0, y0, x1, y1) in the units of the art: a line
# under the eye that hangs apart from it, and a tail that sticks out of the corner of the eye.
CUTS = {
    'variant02': [(255, 62, 325, 100)],                  # the line under the right eye
    'variant07': [(60, 86, 170, 115), (255, 66, 335, 100)],  # the lower lashes of both eyes
    'variant23': [(0, 30, 47, 70), (322, 31, 365, 50)],  # the tails of both eyes
}

# Shapes that have no iris: a closed or a squinting eye is a lid only.
LID_ONLY = {'variant22'}
# The white of the art is the white of the eye, under the dark that is left (the others are gleams).
SCLERA = {'variant05'}


def polygon(contour):
    points = []
    for segment in SvgPath(contour).segments():
        if isinstance(segment, Move):
            continue
        steps = 1 if segment.__class__.__name__ in ('Line', 'Close') else 24
        for i in range(steps + 1):
            p = segment.point(i / steps)
            points.append((p.x, p.y))
    return Polygon(points).buffer(0)


def shape_of(path_data):
    """A path as a shape, by the rule of even and odd: a contour inside another is a hole."""
    shape = None
    for contour in SvgPath(path_data).as_subpaths():
        piece = polygon(contour)
        shape = piece if shape is None else shape.symmetric_difference(piece)
    return shape


def polygons(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == 'Polygon':
        return [geometry]
    return [g for g in geometry.geoms if g.geom_type == 'Polygon']


def widest_circle(shape):
    low, high = 0, 60
    for _ in range(14):
        middle = (low + high) / 2
        if shape.buffer(-middle).is_empty:
            high = middle
        else:
            low = middle
    return low


def ellipse_of(blob, scale):
    """The ellipse with the center, the axes and the area of a blob: a clean iris in place of its ragged edge."""
    xs = np.linspace(blob.bounds[0], blob.bounds[2], 80)
    ys = np.linspace(blob.bounds[1], blob.bounds[3], 80)
    inside = np.array([[x, y] for x in xs for y in ys if blob.contains(Point(x, y))])
    center = inside.mean(axis=0)
    values, vectors = np.linalg.eigh(np.cov((inside - center).T))
    a, b = 2 * math.sqrt(values[1]) * scale, 2 * math.sqrt(values[0]) * scale
    angle = math.degrees(math.atan2(vectors[1, 1], vectors[0, 1]))
    ellipse = affinity.scale(Point(0, 0).buffer(1, 64), a, b)
    ellipse = affinity.rotate(ellipse, angle, origin=(0, 0))
    return affinity.translate(ellipse, center[0], center[1])


def split(variant, index, shape):
    """The iris and the lid of a dark shape of the art; no iris for a shape that is a lid only."""
    radius = widest_circle(shape)
    x0, y0, x1, y1 = shape.bounds
    flat = max((x1 - x0) / (y1 - y0 + 1e-6), (y1 - y0) / (x1 - x0 + 1e-6))
    is_stroke = radius < 12 or flat > 3.5 or variant in LID_ONLY
    if is_stroke or (variant == 'variant18' and shape.area < 4000):   # the closed eye of the wink
        return None, shape
    params = dict(PARAMS['default'])
    params.update(PARAMS.get(variant, {}))
    params.update(PARAMS.get((variant, index), {}))
    blob = shape.buffer(-radius * params['f']).buffer(radius * params['f']).intersection(shape)
    if blob.geom_type != 'Polygon':
        blob = max(polygons(blob), key=lambda p: p.area)
    ellipse = affinity.translate(ellipse_of(blob, params['s']), params['dx'], params['dy'])
    iris = shape.intersection(ellipse)
    rest = shape.difference(iris).buffer(-SLIVER).buffer(SLIVER)
    pieces = [p for p in polygons(rest) if p.area >= params['speck']]
    lid = unary_union(pieces) if pieces else Polygon()
    if not lid.is_empty:
        lid = lid.buffer(OVER).intersection(shape)
    return iris.buffer(OVER), lid


def path_data(geometry):
    out = ''
    for p in polygons(geometry):
        for ring in [p.exterior, *p.interiors]:
            coords = list(ring.simplify(0.3).coords)[:-1]
            out += 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in coords) + 'Z'
    return out


HEADER = '''/**
 * The eyes of the faces of people, one entry for each variant of the eyes in the catalog, in the
 * units of the eye part of the art (placed at the same corner as the art places it). The art draws
 * an eye as one dark shape, the iris and the lid and the lashes together. Here each shape is cut in
 * two: the iris, which a gaze can move, and the lid, all that is thin (the line of the lid, the
 * lashes), with nothing dark under the iris, so that the skin shows where the iris has moved from.
 * The lid goes a little over the edge of the iris, and the iris a little under the lid, so that no
 * seam shows. Each eye has the spot of its iris too (its middle and its size), so that the iris of
 * one eye can move and grow into the iris of another. A closed or squinting eye has a lid only. Where the art draws white on the dark, it
 * is either the white of the eye, which stays under the rest and which the iris moves over, cut by
 * its `socket` shape (one variant), or a gleam in the iris, which moves with it (two variants).
 * The paths are polygons with the rule of even and odd.
 *
 * Made by scripts/faces/split-eyes.py: change the script, not this file.
 */
import type { HumanEyeArt } from './human-face.types'

export const humanEyeArt: Readonly<Record<string, HumanEyeArt>> = {
'''


def main():
    style = json.loads(STYLE.read_text())
    out = HEADER
    for variant, definition in style['components']['eyes']['variants'].items():
        whites, darks = [], []
        for element in definition['elements']:
            is_white = isinstance(element['attributes']['fill'], str)
            (whites if is_white else darks).append(shape_of(element['attributes']['d']))
        white = unary_union(whites) if whites else Polygon()
        shapes = []
        for dark in darks:
            shapes += polygons(dark.difference(white) if variant in SCLERA else dark)
        shapes.sort(key=lambda s: s.centroid.x)
        cuts = [split(variant, i, shape) for i, shape in enumerate(shapes)]
        irises = unary_union([i for i, _ in cuts if i is not None]) if any(i for i, _ in cuts) else Polygon()
        lids = [lid for _, lid in cuts if not lid.is_empty]
        lid = unary_union(lids) if lids else Polygon()
        for box in CUTS.get(variant, []):
            lid = lid.difference(Polygon([(box[0], box[1]), (box[2], box[1]), (box[2], box[3]), (box[0], box[3])]))
            lid = lid.buffer(-1.2).buffer(1.2)   # the cut leaves a rounded end, not a flat one
        spots = {'left': None, 'right': None}
        for iris, _ in cuts:
            if iris is None or iris.is_empty:
                continue
            side = 'left' if iris.centroid.x < MIDLINE else 'right'
            if spots[side] is None or iris.area > spots[side][2] ** 2:
                spots[side] = (round(iris.centroid.x), round(iris.centroid.y), round(math.sqrt(iris.area)))
        socket = unary_union([*shapes, white]) if variant in SCLERA else Polygon()
        fields = {
            'white': path_data(white) if variant in SCLERA else '',
            'shine': path_data(white) if (whites and variant not in SCLERA) else '',
            'iris': path_data(irises),
            'lid': path_data(lid),
            'socket': path_data(socket),
        }
        out += f'  {variant}: {{\n'
        out += '    spots: { ' + ', '.join(
            f"{side}: " + ('null' if spot is None else f'{{ x: {spot[0]}, y: {spot[1]}, size: {spot[2]} }}')
            for side, spot in spots.items()
        ) + ' },\n'
        for key, value in fields.items():
            out += f"    {key}: '{value}',\n"
        out += '  },\n'
    out += '}\n'
    OUT.write_text(out)
    print(f'wrote {OUT}')


if __name__ == '__main__':
    sys.exit(main())
