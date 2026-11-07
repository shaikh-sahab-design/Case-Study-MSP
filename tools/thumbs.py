import glob, os, sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
W, H = 360, 214  # card size at 2x of the 180 x 107 preview
for f in sorted(glob.glob(os.path.join(src, "th-*.png"))):
    im = Image.open(f).convert("RGB")
    h = round(im.height * W / im.width)
    im = im.resize((W, h), Image.LANCZOS).crop((0, 0, W, min(h, H)))
    name = os.path.basename(f)[3:-4]
    im.save(os.path.join(dst, name + ".webp"), quality=80)
    print(name, im.size)
