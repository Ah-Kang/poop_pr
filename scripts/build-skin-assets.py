"""Create deterministic, content-addressed game assets. Originals are never changed.

Run locally with Python + Pillow; generated WebPs/catalog are deployed directly.
"""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/cosmetics-production'
OUTPUT = ROOT / 'public/skins'
OUTPUT.mkdir(parents=True, exist_ok=True)

def convert(item):
    with Image.open(SOURCE / item['file']) as source:
        im = source.convert('RGBA')
        left, top, right, bottom = item['geometry']['bounds']
        # Keep a small margin around visible art; use the reviewed display bounds.
        im = im.crop((max(0, left-4), max(0, top-4), min(im.width, right+4), min(im.height, bottom+4)))
        entry = {k: item[k] for k in ['key', 'characterId', 'material', 'expression', 'outfit']}
        for label, size in [('image', 512), ('thumb', 160)]:
            resized = im.copy()
            resized.thumbnail((size, size), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            resized.save(buffer, 'WEBP', quality=82, method=6)
            data = buffer.getvalue()
            digest = hashlib.sha256(data).hexdigest()[:16]
            filename = f"{item['key']}.{label}.{digest}.webp"
            (OUTPUT / filename).write_bytes(data)
            entry[label] = '/skins/' + filename
            entry[label+'Bytes'] = len(data)
            if label == 'image':
                box = resized.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox()
                entry['bounds'] = dict(left=box[0], top=box[1], width=box[2]-box[0], height=box[3]-box[1], canvasWidth=resized.width, canvasHeight=resized.height)
        return entry

if __name__ == '__main__':
    manifest = json.loads((SOURCE / 'manifest.json').read_text())
    assert len(manifest['items']) == 540
    with ThreadPoolExecutor(max_workers=6) as pool:
        entries = list(pool.map(convert, manifest['items']))
    target = ROOT / 'src/cosmetics/skin-catalog.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(entries, ensure_ascii=False, separators=(',', ':'))+'\n')
    print(json.dumps({'skins': len(entries), 'gameMB': round(sum(x['imageBytes'] for x in entries)/1e6,2), 'thumbMB': round(sum(x['thumbBytes'] for x in entries)/1e6,2)}))
