"""
Builds the lobby operator: a stylized, original cyberpunk netrunner of Soham
(thick black hair swept up and back, medium-brown skin, slim build, clean
shaven; taken from public/operator/soham-avatar.jpg).

Re-run:
    /opt/homebrew/bin/blender -b --python scripts/blender/build-operator.py
Optional preview PNGs (workbench renders, rest pose and two posed frames):
    ... --python scripts/blender/build-operator.py -- --preview /some/dir

Output: public/operator/operator.glb, one skinned mesh, one armature, two clips:
  idle     4 s loop: breathing, weight shift, arms settle at the sides
  gesture  2.4 s: right-hand wave while the left arm lifts the wrist deck

How it is built (techniques, not assets, borrowed from stylized game art):
- The body is one continuous surface: a vertex skeleton through the Skin
  modifier and two levels of subdivision, so joints bend smoothly.
- It is modelled in an A-pose and weighted with Blender's bone-heat automatic
  weights; the clips pose the arms down. Clothing layers that must follow the
  body (coat skirt, collar, belt, neon piping) copy the body's weights with a
  Data Transfer modifier. Rigid pieces (head, hair, visor, gloves, boots,
  wrist deck) are bound to one bone each.
- Neon piping is drawn as ribbons shrink-wrapped onto the body, so it hugs the
  surface instead of floating.
- The head is a sphere reshaped by smooth falloff functions (jaw, chin, nose,
  brow, lips); the hair is the head shape pushed outward above a hairline,
  plus tapered strand chunks for the quiff.

Conventions: Z up, the character faces -Y in Blender (glTF export turns that
into +Z). The character's left hand is +X. Bone names are stable because
app/_lobby/scene/operator.tsx drives the "head" bone from code. Material names
"trim", "trim2", "visor", "holo" and "warn" are the emissive ones the lobby
animates.
"""
import math
import os
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "operator", "operator.glb")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PREVIEW = argv[argv.index("--preview") + 1] if "--preview" in argv else None

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30

# -------------------------------------------------------------------- palette
# (base colour, roughness, metallic)
PALETTE = {
    "skin": ((0.43, 0.24, 0.14), 0.52, 0.0),
    "lip": ((0.30, 0.14, 0.10), 0.5, 0.0),
    "hair": ((0.012, 0.011, 0.014), 0.42, 0.0),
    "jacket": ((0.030, 0.034, 0.058), 0.42, 0.25),
    "coat": ((0.022, 0.024, 0.040), 0.36, 0.3),
    "jacket2": ((0.10, 0.11, 0.15), 0.32, 0.75),
    "pants": ((0.020, 0.021, 0.030), 0.62, 0.05),
    "glove": ((0.016, 0.016, 0.022), 0.45, 0.2),
    "boot": ((0.018, 0.018, 0.022), 0.3, 0.4),
}
# (colour, emission strength)
EMISSIVE = {
    "trim": ((0.05, 0.95, 1.0), 4.0),   # primary neon: cyan
    "trim2": ((1.0, 0.12, 0.82), 3.4),  # secondary neon: magenta
    "visor": ((0.12, 0.85, 1.0), 2.6),
    "holo": ((0.2, 1.0, 0.95), 2.2),
    "warn": ((1.0, 0.78, 0.12), 3.0),   # warning: amber
}
MATS = {}


def make_mat(name, color, rough, metal, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*color, 1)
        b.inputs["Emission Strength"].default_value = emit
        b.inputs["Base Color"].default_value = (*[c * 0.15 for c in color], 1)
    m.diffuse_color = (*color, 1)
    return m


for k, (c, r, mt) in PALETTE.items():
    MATS[k] = make_mat(k, c, r, mt)
for k, (c, e) in EMISSIVE.items():
    MATS[k] = make_mat(k, c, 0.3, 0.0, e)


# ------------------------------------------------------------------ helpers
def activate(o):
    for other in bpy.context.view_layer.objects:
        other.select_set(False)
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


def apply_mod(o, name):
    activate(o)
    bpy.ops.object.modifier_apply(modifier=name)


def mesh_object(name, verts, faces, edges=()):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], list(edges), list(faces))
    me.update()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o


def set_mat(o, mat):
    o.data.materials.clear()
    o.data.materials.append(MATS[mat])


def smooth(o, on=True):
    for p in o.data.polygons:
        p.use_smooth = on


def subdivide(o, levels=1):
    m = o.modifiers.new("sub", "SUBSURF")
    m.levels = levels
    m.render_levels = levels
    apply_mod(o, "sub")


def solidify(o, thickness, offset=-1.0):
    m = o.modifiers.new("solid", "SOLIDIFY")
    m.thickness = thickness
    m.offset = offset
    apply_mod(o, "solid")


def bevel(o, width, segments=3):
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "NONE"
    apply_mod(o, "bevel")


def rounded_box(name, center, size, mat, radius=0.008, rot=None, segments=3):
    """Box centred at `center`, `size` = full extents, edges rounded."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(o, min(radius, min(size) * 0.45), segments)
    if rot is not None:
        o.data.transform(rot.to_matrix().to_4x4())
    o.data.transform(Matrix.Translation(Vector(center)))
    set_mat(o, mat)
    smooth(o)
    return o


def ellipsoid(name, center, radii, mat, seg=16, rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.data.transform(Matrix.Diagonal((*radii, 1)))
    o.data.transform(Matrix.Translation(Vector(center)))
    set_mat(o, mat)
    smooth(o)
    return o


def tube(name, points, radius, mat, radii=None, resolution=4, bevel_res=3):
    """Round tube along `points` (NURBS through the points), optionally tapered per point."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (*p, 1)
        sp.points[i].radius = radii[i] if radii else 1.0
    sp.use_endpoint_u = True
    sp.order_u = min(4, len(points))
    sp.resolution_u = resolution
    o = bpy.data.objects.new(name, cu)
    scene.collection.objects.link(o)
    activate(o)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.active_object
    set_mat(o, mat)
    smooth(o)
    return o


def ring(name, center, rx, ry, z0, z1, mat, open_deg=0.0, seg=40, thickness=0.006, rx1=None, ry1=None):
    """Elliptic band from z0 to z1 (radii may change), with an optional front opening."""
    rx1 = rx if rx1 is None else rx1
    ry1 = ry if ry1 is None else ry1
    a0, a1 = math.radians(open_deg), math.radians(360 - open_deg)
    cols = seg + (1 if open_deg else 0)
    verts, faces = [], []
    for z, ax, ay in ((z0, rx, ry), (z1, rx1, ry1)):
        for i in range(cols):
            t = a0 + (a1 - a0) * i / (cols - 1 if open_deg else cols)
            verts.append((center[0] + ax * math.sin(t), center[1] - ay * math.cos(t), z))
    n = cols
    for i in range(cols - (1 if open_deg else 0)):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    o = mesh_object(name, verts, faces)
    set_mat(o, mat)
    smooth(o)
    if thickness:
        solidify(o, thickness, 0.0)
    return o


PARTS = []          # every piece that ends up in the final mesh
RIGID = {}          # piece -> bone it is bound to
SMOOTH_PARTS = []   # pieces that copy the body's weights


def rigid(o, bone_name):
    PARTS.append(o)
    RIGID[o] = bone_name
    return o


def follow(o):
    PARTS.append(o)
    SMOOTH_PARTS.append(o)
    return o


# ------------------------------------------------------- skeleton positions
SHOULDER = Vector((0.175, 0.0, 1.415))
A_DOWN = math.radians(40)  # A-pose: arms 40 degrees below horizontal
UP_DIR = Vector((math.cos(A_DOWN), 0, -math.sin(A_DOWN)))
ELBOW = SHOULDER + UP_DIR * 0.29
FORE_DIR = Vector((math.cos(A_DOWN), -0.16, -math.sin(A_DOWN))).normalized()
WRIST = ELBOW + FORE_DIR * 0.255
HIP = Vector((0.092, 0.0, 0.94))
KNEE = Vector((0.1, -0.012, 0.52))
ANKLE = Vector((0.102, 0.012, 0.105))
HEAD_C = Vector((0.0, -0.006, 1.67))


def mirror(v, sx):
    return Vector((v.x * sx, v.y, v.z))


# --------------------------------------------------------------------- body
# Vertex skeleton for the Skin modifier: (position, (radius x, radius y)).
GAIN = 1.13  # subdivision shrinks the skin cage; this restores the intended size
nodes = [
    ((0, 0.0, 0.965), (0.148, 0.104)),    # 0 pelvis (root)
    ((0, 0.004, 1.075), (0.128, 0.088)),  # 1 waist
    ((0, 0.0, 1.19), (0.142, 0.094)),     # 2 abdomen
    ((0, -0.004, 1.31), (0.162, 0.104)),  # 3 chest
    ((0, 0.0, 1.40), (0.148, 0.098)),     # 4 upper chest
    ((0, 0.004, 1.48), (0.056, 0.056)),   # 5 neck base
    ((0, 0.0, 1.575), (0.047, 0.05)),     # 6 neck top
]
edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6)]
for sx in (1, -1):
    s = len(nodes)
    nodes += [
        (mirror(SHOULDER, sx), (0.06, 0.06)),
        (mirror(SHOULDER + UP_DIR * 0.13, sx), (0.051, 0.051)),
        (mirror(ELBOW, sx), (0.041, 0.041)),
        (mirror(ELBOW + FORE_DIR * 0.12, sx), (0.039, 0.037)),
        (mirror(WRIST, sx), (0.03, 0.028)),
    ]
    edges += [(4, s), (s, s + 1), (s + 1, s + 2), (s + 2, s + 3), (s + 3, s + 4)]
    h = len(nodes)
    nodes += [
        (mirror(HIP, sx), (0.092, 0.092)),
        (mirror(Vector((0.097, -0.004, 0.74)), sx), (0.079, 0.079)),
        (mirror(KNEE, sx), (0.054, 0.056)),
        (mirror(Vector((0.101, 0.006, 0.33)), sx), (0.06, 0.062)),
        (mirror(ANKLE, sx), (0.038, 0.04)),
    ]
    edges += [(0, h), (h, h + 1), (h + 1, h + 2), (h + 2, h + 3), (h + 3, h + 4)]

body = mesh_object("body", [Vector(p) for p, _ in nodes], [], edges)
skin = body.modifiers.new("skin", "SKIN")
skin.use_smooth_shade = True
skin.branch_smoothing = 0.75
sv = body.data.skin_vertices[0].data
for i, (_, (rx, ry)) in enumerate(nodes):
    sv[i].radius = (rx * GAIN, ry * GAIN)
    sv[i].use_root = i == 0
apply_mod(body, "skin")
subdivide(body, 2)
smooth(body)
for name in ("jacket", "pants", "skin"):
    body.data.materials.append(MATS[name])
for p in body.data.polygons:
    c = p.center
    if c.z > 1.5 and abs(c.x) < 0.09:
        p.material_index = 2
    elif c.z < 1.0 and abs(c.x) < 0.3:
        p.material_index = 1
    else:
        p.material_index = 0
PARTS.append(body)


# ---------------------------------------------------------------- head
def head_shape(p):
    """Reshape a unit-sphere point into a stylized head (front is -y)."""
    x, y, z = p
    front = max(0.0, -y)
    if z < -0.72:
        z = -0.72 - (-z - 0.72) * 0.78  # a slightly flatter, squarer chin
    if z < 0:
        t = -z
        x *= 1 - 0.27 * t ** 1.8
        y *= 1 - (0.12 if y < 0 else 0.42) * t
    elif y > 0:
        y *= 1 + 0.08 * z
    g = math.exp
    # chin, nose, brow ridge, eye sockets, lips (all on the face side)
    y -= 0.06 * front * g(-((x / 0.34) ** 2 + ((z + 0.86) / 0.14) ** 2))
    y -= 0.22 * front ** 3 * g(-((x / 0.085) ** 2 + ((z + 0.12) / 0.2) ** 2))
    y -= 0.05 * front * g(-((z - 0.24) / 0.08) ** 2) * (1 if abs(x) < 0.6 else 0.3)
    y += 0.045 * front * g(-(((abs(x) - 0.36) / 0.13) ** 2 + ((z - 0.09) / 0.1) ** 2))
    y -= 0.035 * front * g(-((x / 0.24) ** 2 + ((z + 0.47) / 0.07) ** 2))
    y += 0.02 * front * g(-((x / 0.2) ** 2 + ((z + 0.535) / 0.025) ** 2))  # lip line
    x *= 1 + 0.04 * g(-(z / 0.2) ** 2) * front  # cheekbones
    return Vector((x, y, z))


HEAD_R = Vector((0.084, 0.097, 0.114))
bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=28, radius=1, location=(0, 0, 0))
head = bpy.context.active_object
head.name = "head"
for v in head.data.vertices:
    q = head_shape(v.co)
    v.co = Vector((q.x * HEAD_R.x, q.y * HEAD_R.y, q.z * HEAD_R.z)) + HEAD_C
head.data.materials.append(MATS["skin"])
head.data.materials.append(MATS["lip"])
smooth(head)
rigid(head, "head")


def face_point(nx, nz, out=0.0015):
    """Point on the face surface for unit-sphere coordinates (nx, nz)."""
    ny = -math.sqrt(max(0.0, 1 - nx * nx - nz * nz))
    q = head_shape(Vector((nx, ny, nz)))
    p = Vector((q.x * HEAD_R.x, q.y * HEAD_R.y, q.z * HEAD_R.z))
    return p + p.normalized() * out + HEAD_C


# Mouth: a soft dark line with a slight downturn at the corners.
mouth = [face_point(x, -0.515 + 0.008 * (x / 0.2) ** 2) for x in (-0.2, -0.1, 0.0, 0.1, 0.2)]
rigid(tube("mouth", mouth, 0.0016, "lip", radii=[0.5, 1, 1, 1, 0.5], resolution=3, bevel_res=1), "head")
for sx in (1, -1):
    e = ellipsoid(f"ear.{sx}", HEAD_C + Vector((sx * 0.078, 0.012, -0.01)), (0.014, 0.026, 0.034), "skin", 12, 8)
    rigid(e, "head")


# ---------------------------------------------------------------- hair
def hairline(nx, ny):
    """Height (unit-sphere z) of the hairline in the direction (nx, ny)."""
    yaw = math.atan2(nx, -ny)  # 0 = front, pi = back
    k = (1 - math.cos(yaw)) / 2  # 0 front .. 1 back
    front, side, back = 0.42, 0.02, -0.5
    return front + (side - front) * min(1, k * 2) if k < 0.5 else side + (back - side) * (k - 0.5) * 2


bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=28, radius=1, location=(0, 0, 0))
cap = bpy.context.active_object
cap.name = "hair.cap"
for v in cap.data.vertices:
    n = v.co.copy()
    q = head_shape(n)
    surf = Vector((q.x * HEAD_R.x, q.y * HEAD_R.y, q.z * HEAD_R.z))
    above = n.z - hairline(n.x, n.y)
    w = max(0.0, min(1.0, above / 0.14))  # fade the volume in over the hairline
    # volume: thin at the sides, full on top, a lifted quiff at the front
    front = max(0.0, -n.y)
    vol = 0.005 + 0.01 * max(0.0, n.z) + 0.024 * front * max(0.0, n.z) ** 0.6
    vol += 0.012 * math.exp(-(((n.x + 0.25) / 0.35) ** 2)) * max(0.0, n.z)  # fuller on one side of the part
    off = (vol * w) if above > 0 else -0.004
    v.co = surf + surf.normalized() * off + HEAD_C
set_mat(cap, "hair")
smooth(cap)
rigid(cap, "head")

# Quiff: tapered strand chunks rising from the front hairline, swept up and back.
for i, x0 in enumerate((-0.048, -0.027, -0.006, 0.014, 0.032, 0.048)):
    lift = 0.012 * math.cos(x0 * 18)
    pts = [
        HEAD_C + Vector((x0, -0.084, 0.058)),
        HEAD_C + Vector((x0 * 1.02 + 0.003, -0.088, 0.096 + lift)),
        HEAD_C + Vector((x0 * 1.0 + 0.008, -0.052, 0.128 + lift)),
        HEAD_C + Vector((x0 * 0.95 + 0.012, 0.0, 0.128)),
        HEAD_C + Vector((x0 * 0.85 + 0.014, 0.05, 0.106)),
    ]
    s = tube(f"hair.strand.{i}", pts, 0.019, "hair", radii=[0.7, 1.0, 0.9, 0.65, 0.25])
    s.data.transform(Matrix.Translation(-HEAD_C))
    s.data.transform(Matrix.Diagonal((1.0, 1.0, 0.72, 1)))  # flatten the chunks
    s.data.transform(Matrix.Translation(HEAD_C))
    rigid(s, "head")

# ---------------------------------------------------------------- AR visor
EYE_Z = HEAD_C.z + 0.008
verts, faces = [], []
ARC = 26
for dz in (-0.014, 0.016):
    for i in range(ARC + 1):
        t = math.radians(-78 + 156 * i / ARC)
        bow = 1 + 0.03 * math.cos(t)  # slight bulge at the centre
        verts.append((math.sin(t) * 0.09 * bow, HEAD_C.y - math.cos(t) * 0.113 * bow, EYE_Z + dz * (1 - 0.25 * abs(math.sin(t)))))
for i in range(ARC):
    faces.append((i, i + 1, ARC + 2 + i, ARC + 1 + i))
visor = mesh_object("visor", verts, faces)
set_mat(visor, "visor")
smooth(visor)
solidify(visor, 0.004, 0.0)
rigid(visor, "head")
edge_pts = [
    (math.sin(math.radians(a)) * 0.093, HEAD_C.y - math.cos(math.radians(a)) * 0.117, EYE_Z + 0.018 - 0.004 * abs(math.sin(math.radians(a))))
    for a in range(-80, 81, 10)
]
rigid(tube("visor.edge", edge_pts, 0.0022, "trim2", resolution=2, bevel_res=1), "head")
for sx in (1, -1):
    arm_pts = [(sx * 0.09, HEAD_C.y - 0.02, EYE_Z), (sx * 0.088, HEAD_C.y + 0.03, EYE_Z - 0.004), (sx * 0.08, HEAD_C.y + 0.06, EYE_Z - 0.016)]
    rigid(tube(f"visor.arm.{sx}", arm_pts, 0.004, "jacket2", resolution=2), "head")
# Earpiece over his left ear, with a magenta status light.
rigid(rounded_box("earpiece", HEAD_C + Vector((0.09, 0.012, -0.008)), (0.016, 0.034, 0.042), "jacket2", 0.006), "head")
rigid(rounded_box("earpiece.light", HEAD_C + Vector((0.0985, 0.012, -0.008)), (0.003, 0.02, 0.006), "trim2", 0.001, segments=1), "head")

# ---------------------------------------------------------------- collar
collar = ring("collar", (0, 0.004), 0.098, 0.09, 1.425, 1.575, "jacket", open_deg=20, thickness=0.008, rx1=0.084, ry1=0.08)
subdivide(collar, 1)
follow(collar)
collar_edge = [(0.084 * math.sin(math.radians(a)) * 1.03, 0.004 - 0.08 * math.cos(math.radians(a)) * 1.03, 1.576) for a in range(22, 339, 14)]
follow(tube("collar.edge", collar_edge, 0.0035, "trim", resolution=2, bevel_res=1))

# ---------------------------------------------------------------- coat skirt
rows, cols = 9, 34
open_a = math.radians(24)
verts, faces = [], []
for r in range(rows):
    t = r / (rows - 1)
    for c in range(cols):
        a = open_a + (2 * math.pi - 2 * open_a) * c / (cols - 1)
        z_bot = 0.565 - 0.115 * (1 - math.cos(a)) / 2
        z = 1.035 + (z_bot - 1.035) * t
        rx = 0.172 + 0.088 * t ** 0.7
        ry = 0.116 + 0.078 * t ** 0.7 + 0.02 * t * (1 - math.cos(a)) / 2
        verts.append((rx * math.sin(a), -ry * math.cos(a), z))
for r in range(rows - 1):
    for c in range(cols - 1):
        i = r * cols + c
        faces.append((i, i + 1, i + cols + 1, i + cols))
skirt = mesh_object("coat.skirt", verts, faces)
set_mat(skirt, "coat")
smooth(skirt)
solidify(skirt, 0.007, 0.0)
subdivide(skirt, 1)
follow(skirt)
# Neon piping down both front edges of the coat.
for sx in (1, -1):
    pts = []
    for r in range(rows):
        t = r / (rows - 1)
        a = open_a * 0.96
        z_bot = 0.565 - 0.115 * (1 - math.cos(a)) / 2
        pts.append((sx * (0.172 + 0.088 * t ** 0.7 + 0.004) * math.sin(a), -(0.116 + 0.078 * t ** 0.7 + 0.004) * math.cos(a), 1.035 + (z_bot - 1.035) * t))
    follow(tube(f"coat.piping.{sx}", pts, 0.0032, "trim", resolution=3, bevel_res=1))
# Hem light: a thin magenta line along the back of the hem.
hem = []
for c in range(8, cols - 8):
    a = open_a + (2 * math.pi - 2 * open_a) * c / (cols - 1)
    z_bot = 0.565 - 0.115 * (1 - math.cos(a)) / 2 + 0.018
    hem.append(((0.26 + 0.005) * math.sin(a), -(0.194 + 0.02 * (1 - math.cos(a)) / 2 + 0.005) * math.cos(a), z_bot))
follow(tube("coat.hem", hem, 0.0026, "trim2", resolution=2, bevel_res=1))

# ---------------------------------------------------------------- belt
belt = ring("belt", (0, 0.002), 0.168, 0.114, 1.012, 1.05, "jacket2", thickness=0.01)
follow(belt)
follow(rounded_box("belt.buckle", (-0.03, -0.124, 1.031), (0.05, 0.012, 0.03), "jacket2", 0.004))
follow(rounded_box("belt.light", (-0.03, -0.131, 1.031), (0.026, 0.003, 0.007), "warn", 0.001, segments=1))


# ------------------------------------------------------------ neon ribbons
def ribbon(name, points, width, mat, side):
    """Flat strip through `points`, `side` is the width direction; wrapped onto the body below."""
    verts, faces = [], []
    pts = [Vector(p) for p in points]
    dense = []
    for i in range(len(pts) - 1):
        for k in range(8):
            dense.append(pts[i].lerp(pts[i + 1], k / 8))
    dense.append(pts[-1])
    s = Vector(side).normalized() * width / 2
    for p in dense:
        verts += [p - s, p + s]
    for i in range(len(dense) - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    o = mesh_object(name, verts, faces)
    set_mat(o, mat)
    return o


RIBBONS = [
    # chest strap: his left shoulder down to his right hip
    ribbon("strap", [(0.125, -0.06, 1.44), (0.06, -0.12, 1.33), (-0.04, -0.118, 1.2), (-0.12, -0.09, 1.08)], 0.016, "trim", (1, 0, 1)),
    # off-centre zip line
    ribbon("zip", [(-0.032, -0.12, 1.42), (-0.03, -0.122, 1.3), (-0.028, -0.112, 1.16), (-0.026, -0.1, 1.06)], 0.006, "trim2", (1, 0, 0)),
    # back seam
    ribbon("back.seam", [(0, 0.11, 1.42), (0, 0.118, 1.3), (0, 0.105, 1.16), (0, 0.095, 1.06)], 0.01, "trim2", (1, 0, 0)),
]
for sx in (1, -1):
    top = mirror(SHOULDER + Vector((0, 0, 0.06)), sx)
    RIBBONS.append(ribbon(f"sleeve.{sx}", [top, mirror(SHOULDER + UP_DIR * 0.15 + Vector((0, 0, 0.05)), sx), mirror(ELBOW + Vector((0, 0, 0.04)), sx)], 0.008, "trim2" if sx > 0 else "trim", (0, 1, 0)))
for r in RIBBONS:
    m = r.modifiers.new("wrap", "SHRINKWRAP")
    m.target = body
    m.wrap_method = "NEAREST_SURFACEPOINT"
    m.offset = 0.004
    apply_mod(r, "wrap")
    solidify(r, 0.003, 0.0)
    smooth(r)
    follow(r)

# ---------------------------------------------------------------- shoulders
PAD_C = mirror(SHOULDER, 1) + Vector((0.02, 0.0, 0.035))
pad = ellipsoid("pad.L", (0, 0, 0), (0.072, 0.08, 0.032), "jacket2", 20, 10)
pad.data.transform(Matrix.Rotation(-math.radians(28), 4, "Y"))
pad.data.transform(Matrix.Translation(PAD_C))
rigid(pad, "upperarm.L")
for k, dz in enumerate((0.0, -0.018)):
    pts = [PAD_C + Vector((0.06 * math.cos(math.radians(a)) * 1.02 - 0.005, 0.072 * math.sin(math.radians(a)) * 1.02, dz + 0.03 * math.cos(math.radians(a)))) for a in range(-80, 81, 20)]
    rigid(tube(f"pad.light.{k}", pts, 0.0026, "trim2", resolution=2, bevel_res=1), "upperarm.L")


# ------------------------------------------------------------- gloves
def oriented(o, origin, direction, palm_in):
    """Build-space hand hangs along -Z with its palm toward -X; aim it along `direction`."""
    rot = Vector((0, 0, -1)).rotation_difference(direction.normalized())
    if not palm_in:
        o.data.transform(Matrix.Diagonal((-1, 1, 1, 1)))
        o.data.flip_normals()
    o.data.transform(rot.to_matrix().to_4x4())
    o.data.transform(Matrix.Translation(origin))


for sx, side in ((1, "L"), (-1, "R")):
    wrist = mirror(WRIST, sx)
    d = mirror(FORE_DIR, sx)
    pieces = [
        rounded_box("palm", (0, 0, -0.045), (0.032, 0.082, 0.09), "glove", 0.012),
        rounded_box("fingers", (-0.008, -0.002, -0.118), (0.026, 0.078, 0.07), "glove", 0.011, rot=Quaternion((0, 1, 0), math.radians(-14))),
        rounded_box("thumb", (-0.018, -0.046, -0.05), (0.022, 0.022, 0.058), "glove", 0.009, rot=Quaternion((1, 0, 0), math.radians(24))),
        rounded_box("knuckles", (0.012, -0.002, -0.088), (0.006, 0.07, 0.01), "trim" if sx > 0 else "trim2", 0.002, segments=1),
        rounded_box("cuff", (0, 0, 0.004), (0.05, 0.088, 0.03), "jacket2", 0.008),
    ]
    for p in pieces:
        oriented(p, wrist, d, palm_in=sx > 0)
        rigid(p, f"hand.{side}")

# Wrist deck on the left forearm, facing forward, with a hologram panel above it.
deck_c = mirror(ELBOW + FORE_DIR * 0.17, 1)
deck_rot = Vector((0, 0, -1)).rotation_difference(mirror(FORE_DIR, 1))
for name, off, size, mat, rad in (
    ("deck", (0, -0.036, 0), (0.05, 0.022, 0.085), "jacket2", 0.006),
    ("deck.screen", (0, -0.048, 0), (0.038, 0.003, 0.064), "holo", 0.001),
    ("deck.light", (0.026, -0.04, 0.03), (0.003, 0.012, 0.012), "warn", 0.001),
):
    o = rounded_box(name, (0, 0, 0), size, mat, rad, segments=2 if rad > 0.002 else 1)
    o.data.transform(Matrix.Translation(Vector(off)))
    o.data.transform(deck_rot.to_matrix().to_4x4())
    o.data.transform(Matrix.Translation(deck_c))
    rigid(o, "forearm.L")
holo = rounded_box("deck.holo", (0, 0, 0), (0.11, 0.002, 0.075), "holo", 0.001, segments=1)
holo.data.transform(Matrix.Rotation(math.radians(-20), 4, "X"))
holo.data.transform(Matrix.Translation(Vector((0.0, -0.12, 0.07))))
holo.data.transform(deck_rot.to_matrix().to_4x4())
holo.data.transform(Matrix.Translation(deck_c))
rigid(holo, "forearm.L")
# Right forearm: two cyan seam rings, a cybernetic hint.
for k, f in enumerate((0.07, 0.15)):
    c = mirror(ELBOW + FORE_DIR * f, -1)
    rot = Vector((0, 0, 1)).rotation_difference(mirror(FORE_DIR, -1))
    pts = [c + rot @ Vector((math.cos(math.radians(a)) * 0.046, math.sin(math.radians(a)) * 0.044, 0)) for a in range(0, 361, 30)]
    rigid(tube(f"cyber.ring.{k}", pts, 0.0028, "trim", resolution=2, bevel_res=1), "forearm.R")

# ---------------------------------------------------------------- boots
for sx, side in ((1, "L"), (-1, "R")):
    x = sx * ANKLE.x
    rigid(rounded_box(f"boot.shaft.{side}", (x, 0.008, 0.15), (0.104, 0.112, 0.15), "boot", 0.03), f"shin.{side}")
    rigid(rounded_box(f"boot.strap.{side}", (x, 0.008, 0.19), (0.108, 0.116, 0.016), "jacket2", 0.006), f"shin.{side}")
    rigid(rounded_box(f"boot.foot.{side}", (x, -0.045, 0.05), (0.104, 0.235, 0.09), "boot", 0.035), f"foot.{side}")
    rigid(rounded_box(f"boot.sole.{side}", (x, -0.045, 0.011), (0.112, 0.245, 0.022), "jacket2", 0.008), f"foot.{side}")
    rigid(rounded_box(f"boot.glow.{side}", (x, -0.045, 0.011), (0.115, 0.248, 0.006), "trim", 0.002, segments=1), f"foot.{side}")

# Neck implant: three small lights down the back of the neck.
for k, z in enumerate((1.545, 1.515, 1.485)):
    rigid(ellipsoid(f"implant.{k}", (0, 0.052, z), (0.008, 0.006, 0.006), "trim", 10, 6), "neck")

# A stylized head reads better a little larger than life: scale every
# head-bound piece about the top of the neck so the chin stays put.
HEAD_SCALE = 1.08
pivot = Vector((0.0, -0.004, 1.565))
grow = Matrix.Translation(pivot) @ Matrix.Scale(HEAD_SCALE, 4) @ Matrix.Translation(-pivot)
for o, bone_name in RIGID.items():
    if bone_name == "head":
        o.data.transform(grow)

# ----------------------------------------------------------------- armature
arm_data = bpy.data.armatures.new("OperatorRig")
arm_obj = bpy.data.objects.new("OperatorRig", arm_data)
scene.collection.objects.link(arm_obj)
activate(arm_obj)
bpy.ops.object.mode_set(mode="EDIT")


def bone(name, head_p, tail_p, parent=None):
    b = arm_data.edit_bones.new(name)
    b.head = Vector(head_p)
    b.tail = Vector(tail_p)
    b.roll = 0
    if parent:
        b.parent = arm_data.edit_bones[parent]


bone("hips", (0, 0, 0.95), (0, 0, 1.06))
bone("spine", (0, 0, 1.06), (0, 0, 1.26), "hips")
bone("chest", (0, 0, 1.26), (0, 0, 1.46), "spine")
bone("neck", (0, 0, 1.46), (0, 0, 1.56), "chest")
bone("head", (0, 0, 1.56), (0, 0, 1.80), "neck")
for sx, side in ((1, "L"), (-1, "R")):
    bone(f"upperarm.{side}", mirror(SHOULDER, sx), mirror(ELBOW, sx), "chest")
    bone(f"forearm.{side}", mirror(ELBOW, sx), mirror(WRIST, sx), f"upperarm.{side}")
    bone(f"hand.{side}", mirror(WRIST, sx), mirror(WRIST + FORE_DIR * 0.16, sx), f"forearm.{side}")
    bone(f"thigh.{side}", mirror(HIP, sx), mirror(KNEE, sx), "hips")
    bone(f"shin.{side}", mirror(KNEE, sx), mirror(ANKLE, sx), f"thigh.{side}")
    bone(f"foot.{side}", mirror(ANKLE, sx), mirror(Vector((0.102, -0.14, 0.03)), sx), f"shin.{side}")
bpy.ops.object.mode_set(mode="OBJECT")

# Bone-heat weights on the body only.
for o in bpy.context.view_layer.objects:
    o.select_set(False)
body.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
unweighted = sum(1 for v in body.data.vertices if sum(g.weight for g in v.groups) < 1e-4)
print("BODY verts", len(body.data.vertices), "unweighted", unweighted, "groups", len(body.vertex_groups))

# Clothing layers copy the body's weights.
for o in SMOOTH_PARTS:
    m = o.modifiers.new("dt", "DATA_TRANSFER")
    m.object = body
    m.use_vert_data = True
    m.data_types_verts = {"VGROUP_WEIGHTS"}
    m.vert_mapping = "POLYINTERP_NEAREST"
    m.layers_vgroup_select_src = "ALL"
    m.layers_vgroup_select_dst = "NAME"
    activate(o)
    bpy.ops.object.datalayout_transfer(modifier="dt")
    bpy.ops.object.modifier_apply(modifier="dt")
# Rigid pieces follow one bone each.
for o, bone_name in RIGID.items():
    vg = o.vertex_groups.new(name=bone_name)
    vg.add(list(range(len(o.data.vertices))), 1.0, "REPLACE")

# Join into one mesh (the body keeps its armature modifier and parent).
for o in bpy.context.view_layer.objects:
    o.select_set(False)
for o in PARTS:
    o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body = bpy.context.active_object
body.name = "operator"
body.data.name = "operator"
activate(body)
bpy.ops.object.material_slot_remove_unused()
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
print("FINAL verts", len(body.data.vertices), "tris", tris, "materials", [m.name for m in body.data.materials])

# ----------------------------------------------------------------- animation
activate(arm_obj)
bpy.ops.object.mode_set(mode="POSE")
pb = arm_obj.pose.bones
for b in pb:
    b.rotation_mode = "QUATERNION"
arm_obj.animation_data_create()
REST = {b.name: b.bone.matrix_local.to_quaternion() for b in pb}
AX = {"x": Vector((1, 0, 0)), "y": Vector((0, 1, 0)), "z": Vector((0, 0, 1))}


def pose(bone_name, frame, **deg):
    """Rotate a bone about armature-space axes (rest frame), in degrees, applied x, then y, then z."""
    r = Quaternion()
    for axis in ("x", "y", "z"):
        if deg.get(axis):
            r = Quaternion(AX[axis], math.radians(deg[axis])) @ r
    m = REST[bone_name]
    b = pb[bone_name]
    b.rotation_quaternion = m.inverted() @ r @ m
    b.keyframe_insert("rotation_quaternion", frame=frame)


def move(bone_name, frame, x=0.0, y=0.0, z=0.0):
    b = pb[bone_name]
    b.location = REST[bone_name].inverted() @ Vector((x, y, z))
    b.keyframe_insert("location", frame=frame)


def new_action(name):
    for b in pb:
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    arm_obj.animation_data.action = act
    return act


ARM_HANG = 33  # degrees from the A-pose down to relaxed arms

# idle: 4 s loop.
act_idle = new_action("idle")
N = 120
for f in range(1, N + 2, 10):
    ph = (f - 1) / N * 2 * math.pi
    sway = math.sin(ph)
    breath = (1 - math.cos(ph * 2)) / 2
    move("hips", f, 0.012 * sway, 0, -0.004 * abs(sway))
    pose("hips", f, y=-1.4 * sway)
    pose("spine", f, x=0.8 * breath, y=0.9 * sway)
    pose("chest", f, x=-1.2 * breath, y=0.5 * sway)
    pose("upperarm.L", f, x=-3 + 1.2 * breath, y=ARM_HANG - 1.2 * breath)
    pose("upperarm.R", f, x=-3 + 1.2 * breath, y=-ARM_HANG + 1.2 * breath)
    pose("forearm.L", f, x=-14 - 2 * breath)
    pose("forearm.R", f, x=-12 - 2 * breath)
    pose("hand.L", f, x=-6)
    pose("hand.R", f, x=-6)
    pose("thigh.L", f, y=1.4 * sway)
    pose("thigh.R", f, y=1.4 * sway)
    pose("shin.L", f, x=1.5 * max(0.0, -sway))
    pose("shin.R", f, x=1.5 * max(0.0, sway))

# gesture: 2.4 s. Right-hand wave; the left arm raises the deck to read it.
act_gesture = new_action("gesture")
G = 72
keys = ((1, 0.0, 0), (14, 0.85, 0), (22, 1.0, 16), (30, 1.0, -14), (38, 1.0, 16), (46, 1.0, -12), (56, 0.6, 0), (G, 0.0, 0))
for f, k, wave in keys:
    pose("upperarm.R", f, x=-3 * (1 - k), y=-ARM_HANG * (1 - k) + 62 * k, z=22 * k)
    pose("forearm.R", f, x=-12 * (1 - k), y=58 * k + wave)
    pose("hand.R", f, y=wave * 0.4)
    pose("upperarm.L", f, x=-3 * (1 - k) - 30 * k, y=ARM_HANG + 6 * k)
    pose("forearm.L", f, x=-14 * (1 - k) - 78 * k, z=-38 * k)
    pose("hand.L", f, x=-6 * (1 - k))
    pose("chest", f, x=-1.5 * k, z=-5 * k)
    pose("spine", f, z=-3 * k)
bpy.ops.object.mode_set(mode="OBJECT")
arm_obj.animation_data.action = act_idle

# -------------------------------------------------------------------- export
os.makedirs(os.path.dirname(OUT), exist_ok=True)
for o in bpy.context.view_layer.objects:
    o.select_set(o in (body, arm_obj))
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_apply=False,
    export_skins=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_force_sampling=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
)
print("WROTE", OUT, os.path.getsize(OUT), "bytes")

# --------------------------------------------------------------- previews
if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_specular_highlight = True
    scene.render.resolution_x, scene.render.resolution_y = 600, 900
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    def shot(name, pos, rotz, scale=2.0, z=0.92):
        cam_data.ortho_scale = scale
        cam.location = (pos[0], pos[1], z)
        cam.rotation_euler = (math.radians(90), 0, math.radians(rotz))
        scene.render.filepath = os.path.join(PREVIEW, f"operator-{name}.png")
        bpy.ops.render.render(write_still=True)

    arm_obj.animation_data.action = None
    for b in pb:
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)
    shot("rest-front", (0, -5), 0)
    arm_obj.animation_data.action = act_idle
    scene.frame_set(30)
    shot("idle-front", (0, -5), 0)
    shot("idle-three-quarter", (3.5, -3.5), 45)
    shot("idle-back", (0, 5), 180)
    shot("face", (1.2, -4.8), 14, scale=0.42, z=1.66)
    arm_obj.animation_data.action = act_gesture
    scene.frame_set(26)
    shot("gesture-front", (0, -5), 0)
