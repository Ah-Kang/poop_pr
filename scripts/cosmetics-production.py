"""Inventory/checkpoint helper only. Image generation uses the built-in image tool."""
import argparse
import json
import shutil
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/cosmetics-production'
MANIFEST = OUT / 'manifest.json'
MATERIALS = [('original', '기본색'), ('mint', '민트 크림'), ('berry', '딸기 크림')]
FACES = [('default', '기본 표정'), ('wink', '윙크'), ('sleepy', '졸려')]
OUTFITS = [('none', '기본 의상'), ('royal', '왕관과 망토'), ('ribbon', '분홍 리본')]
TRAITS = [
 'Tiny simple brown poop swirl with two warm eyes, smile and small sparkle accents. Keep simple compact shape.',
 'Warm brown SHRIMP-shaped poop with curved segmented tail pointing up on the RIGHT and orange tail fin. Preserve full segmented tail.',
 'Small brown FISH-shaped poop with upright swirl, broad fish tail on the RIGHT and two pale gold front side fins. Preserve tail and BOTH fins.',
 'Round brown poop with TWO visible tall rabbit ears. In royal outfit crown sits BETWEEN ears and there is NO bow/ribbon. Only the ribbon outfit has a bow at right ear base. Never remove ears.',
 'Soft wet brown poop with water droplets/tears and a small blue puddle. Default face is the original weary closed-eye frown; retain wet character identity.',
 'Low soft pale-brown squat poop swirl with gently sleepy original face and wobble marks. Preserve low soft body.',
 'Low wide yellow custard pudding with flat elliptical amber caramel top and two drips. No swirl. Body width/height about 1.4:1. Original tiny smile and round brown eyes.',
 'Pale ivory sticky rice-cake poop with sesame-like speckles and elongated stretchy tip on RIGHT. Preserve stretch. Repair accidental missing/transparent interior pixels.',
 'Healthy warm brown broad poop with two tiers and a tall smooth curved hook-like swirl leaning RIGHT, happy open mouth. Preserve distinctive tall smooth upper curve.',
 'Angular faceted rock-hard brown stacked poop, flat bevels, visible cracks and determined brows. Keep blocky silhouette.',
 'Brown poop with TWO raised muscular flexing arms and fists. Preserve both arms and fists; cloak hangs BEHIND arms and below elbows with real shoulder attachment.',
 'Brown poop armored with two broad silver steel bands and rivets. Preserve metallic bands, face and swirl. Do not reproduce stray background fragments or holes.',
 'Brown squat poop topped with a large orange flame. Preserve flame. Royal crown must be an open ring seated around flame base with flame rising THROUGH, not a floating crown above flame.',
 'Broad rock VOLCANO cone with circular open crater and tall grey-brown smoke puff. Not a swirl. Crown must be open-center coronet around rocky crater with smoke THROUGH center. Keep smoke and happy open mouth.',
 'Broad flowing glowing orange LAVA poop with dark rock patches, bright molten swirl and fiery eyes. Preserve luminous orange channels and rock patches even for tinted material; never replace silhouette with ordinary swirl.',
 'Silver PLATINUM poop with shiny smooth metallic swirl, cute determined face and sparkle. Repair accidental cutout holes through face/body; keep metallic highlights on an opaque body.',
 'Green EMERALD poop with multiple angular green gemstones on sides and green swirl. Keep side jewels distinct from cloth. Preserve gem reflections.',
 'Pale icy-blue DIAMOND poop with faceted crystalline swirl and sparkle. Body must be coherent solid translucent-looking crystal, NOT literal missing alpha holes. Face stays crisp.',
 'Brown KING poop. Reference already has a crown and cape. For royal option REPLACE with exactly ONE complete integrated new crown/cape; never stack crowns. For basic retain original crown/cape; for ribbon add one bow to original royal outfit.',
 'Rich gold GOLDEN poop swirl with little sparkles and warm face. Preserve reflective gold styling. Repair accidental missing alpha holes in body/highlights.',
]

def now():
 return datetime.now(timezone.utc).isoformat()

def geometry(path):
 with Image.open(path) as image:
  image.load()
  rgba = image.convert('RGBA')
  alpha = rgba.getchannel('A')
  bounds = alpha.point(lambda p: 255 if p > 96 else 0).getbbox()
  return dict(width=image.width, height=image.height, bounds=list(bounds) if bounds else None, transparent=alpha.getextrema()[0] == 0)

def save(data):
 data['updatedAt'] = now()
 temp = MANIFEST.with_suffix('.tmp')
 temp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
 temp.replace(MANIFEST)

def initialize():
 if MANIFEST.exists():
  return json.loads(MANIFEST.read_text())
 poops = json.loads((ROOT/'src/scene/preview-data.json').read_text())['poops']
 items=[]
 for p in poops:
  slug=Path(p['image']).stem.removesuffix('-poop')
  for m,ml in MATERIALS:
   for e,el in FACES:
    for o,ol in OUTFITS:
     key=f"{p['id']:02d}-{slug}__{m}__{e}__{o}"
     items.append(dict(key=key,characterId=p['id'],character=p['name'],slug=slug,material=m,materialLabel=ml,expression=e,expressionLabel=el,outfit=o,outfitLabel=ol,source=p['image'].lstrip('/'),file=f'images/{key}.png',status='pending',review='not_reviewed',prompt=None))
 data=dict(version=1,total=540,materials=MATERIALS,expressions=FACES,outfits=OUTFITS,tool='built-in image_gen',items=items)
 OUT.joinpath('images').mkdir(parents=True,exist_ok=True)
 approved={6:'pudding',10:'muscle',13:'volcano'}
 for item in items:
  source=None
  if item['material']=='original' and item['expression']=='default':
   if item['outfit']=='none':
    source=ROOT/item['source'];item['status']='reused';item['review']='needs_visual_review'
    if item['characterId'] in [7,11,15,17,19]:
     item['status']='repair_pending';item['review']='source_alpha_defects'
   elif item['outfit']=='royal' and item['characterId'] in approved:
    source=ROOT/f"src/cosmetics-lab/assets/complete-skins/{approved[item['characterId']]}-royal.png"
    item['status']='approved';item['review']='user_approved_style'
  if source:
   shutil.copy2(source,OUT/item['file']);item['geometry']=geometry(OUT/item['file']);item['provenance']=str(source.relative_to(ROOT))
 save(data)
 return data

def prompt(item):
 material={
 'original':'Keep the original body colors and original material. Do not recolor the character.',
 'mint':'Change the main body surface to soft mint-green/turquoise glazed cream with subtle smooth sheen and painterly shading. Keep exact body shape. Preserve contrasting caramel, silver armor, gems, flames/smoke/rocks and clothing colors; only tint main body. For lava retain glowing orange channels, tint only non-glowing rock/solid surfaces.',
 'berry':'Change the main body surface to pale strawberry-pink glazed cream with soft rosy sheen and painterly shading. Keep exact body shape. Preserve contrasting caramel, silver armor, gems, flames/smoke/rocks and clothing colors; only tint main body. For lava retain glowing orange channels, tint only non-glowing rock/solid surfaces.',
 }[item['material']]
 expression={
 'default':'Keep the original character facial expression and original eye/mouth positions. Match the reference identity.',
 'wink':'Replace the face with one open glossy brown eye, the other gently closed in a playful wink, a small happy smile, subtle original cheek blush. Eyes and mouth stay in their original anatomical positions; no duplicate facial features.',
 'sleepy':'Replace the face with two gently CLOSED relaxed curved eyes and a tiny relaxed smile, preserving original face positions and cheeks. Peaceful sleepy expression, not sad or angry, no duplicate eyes.',
 }[item['expression']]
 outfit={
 'none':'Basic outfit: do not add new clothing or props. Preserve the character-specific original anatomy and identity details. For king character retain exactly its original crown and cape.',
 'royal':'ONE integrated small gold crown with ruby jewel and a richly burgundy royal cape with gold piping. Tailor fabric specifically to this anatomy: attach at upper shoulders or upper sides, hang generous folded panels down both sides and wrap partly in front, with ruby clasp BELOW mouth. Cape must be visibly WORN and substantial (about 25-35% of total silhouette), not a floor rug, flat pedestal or thin trim under the body. Keep face and limbs visible. Real occlusion, shared light, contact shadows. Crown rests on body with shadow, never floats; adapt around ears, flames or open crater. Never duplicate an existing crown or cape. Match approved complete royal reference style but do not copy its pudding anatomy.',
 'ribbon':'ONE coral-pink satin bow fitted naturally at the character right upper side/head or ear base. Draw loops, knot, short tails and subtle contact shadow integrated in the SAME painting. It must visibly touch the body and follow its angle, not float. No new crown or cape, except retaining the king character original outfit. Avoid eyes, smoke, flame, fins and arms.',
 }[item['outfit']]
 return f'''Use case: identity-preserve game sprite. Create ONE finished full character sprite, not layers, not a sheet, not a collage.
Character: {item['character']}.
REFERENCE 1 is the original identity. Preserve recognizable silhouette, body proportions, eye spacing, anatomy, perspective and painted shading. REFERENCE 2 when supplied is the SAME character's approved outfit base or an approved royal wardrobe STYLE reference: never borrow its different anatomy. The specific requested outfit/material/expression below take precedence over clothing or expression in a reference.
Identity invariants: {TRAITS[item['characterId']]}
MATERIAL: {material}
EXPRESSION: {expression}
OUTFIT: {outfit} For the royal outfit do NOT add any ribbon/bow; crown and cape only. For ribbon outfit no extra crown or cape except king original identity.
All elements must be painted together with coherent lighting, folds, shadows and physical contact. Keep original visual identity and painterly game look. No human torso, neck or new limbs. Original arms/fins/ears/tails/effects must survive. Don't lengthen body to accommodate clothing. Repair accidental erased interior/face/highlight areas in source PNG while preserving intentional gaps between limbs. No white sticker outline, stray cutout scraps or background fragments.
Output: single square genuinely transparent PNG, generous transparent padding, whole sprite fully visible including crown, cloth and existing effects. Center the subject, no ground plane, no environment, no words, no logo, no UI. New full asset for combination {item['key']}.'''

def make_job(item,data):
 original=next(x for x in data['items'] if x['characterId']==item['characterId'] and x['outfit']=='none' and x['material']=='original' and x['expression']=='default')
 refs=[str(OUT/original['file']) if original['review']=='visual_checked' else str(ROOT/item['source'])]
 base=next(x for x in data['items'] if x['characterId']==item['characterId'] and x['outfit']==item['outfit'] and x['material']=='original' and x['expression']=='default')
 if base['key']!=item['key'] and base['status'] in ['generated','approved','reused']:
  refs.append(str(OUT/base['file']))
 elif item['outfit']=='royal':
  refs.append(str(ROOT/'src/cosmetics-lab/assets/complete-skins/muscle-royal.png'))
 result=prompt(item)
 if (item['material']!='original' or item['expression']!='default') and base['review'] in ['visual_checked','user_approved_style','needs_visual_review']:
  chosen=base
  same_material=next(x for x in data['items'] if x['characterId']==item['characterId'] and x['outfit']==item['outfit'] and x['material']==item['material'] and x['expression']=='default')
  if same_material['key']!=item['key'] and same_material['review']=='visual_checked':chosen=same_material
  refs=[str(OUT/chosen['file'])]
  material={'original':'Retain the exact original body colors and material.', 'mint':'Change only the body surface to soft mint-green glazed cream. Preserve caramel, armor, jewels, flame/smoke, orange molten channels, sparkle colors and clothing colors.', 'berry':'Change only the body surface to pale strawberry-pink glazed cream. Preserve caramel, armor, jewels, flame/smoke, orange molten channels, sparkle colors and clothing colors.'}[item['material']]
  if chosen['material']==item['material']:material='Retain ALL existing colors and materials exactly. Do NOT recolor any part.'
  face={'default':'Keep original facial expression unchanged.', 'wink':'Change only the face to one open eye and one closed playful winking eye, happy small smile. Preserve original eye/mouth positions.', 'sleepy':'Change only the face to two relaxed closed curved eyes and a tiny peaceful smile. Preserve original eye/mouth positions.'}[item['expression']]
  wardrobe={'none':'NO new clothing: NO crown, NO cape, NO ribbon, NO jewelry. Plain bare character only.' if item['characterId']!=18 else 'Keep the original king crown and cape exactly unchanged.', 'royal':'Keep exactly the existing gold crown and burgundy cape, their shape, contact, folds and colors unchanged. No bow, no new fur, no extra garments.', 'ribbon':'Keep exactly the existing pink bow, its position, folds and color unchanged. Do not add any other clothes or accessories.'}[item['outfit']]
  result=f'Use case: identity-preserve. EDIT the ONE supplied complete sprite of {item["character"]}. Changes: {material} {face} WARDROBE: {wardrobe} Preserve original silhouette, proportions, anatomy, arms/fins/tail/ears, pose, lighting and painterly style exactly. Do not invent additions. Output one complete transparent PNG sprite, not a sheet. Solid coherent body interior, no alpha holes; clean transparent outside background and edges. NO white/grey sticker outline, NO white backing, NO ground shadow, NO stray fragments. Transparency must reach the actual colored body contour. Center whole sprite at about 80% canvas extent with safe padding. Asset {item["key"]}.'
 if item['characterId']==3 and item['material']!='original':result+=' Rabbit-specific palette: retain BOTH outer ears warm original BROWN and both inner-ear panels salmon pink, even when main body is mint or berry. Ears are not recolored.'
 if item['characterId']==4:result+=' Preserve original BLUE water droplets and BLUE puddle; only recolor the brown body. Keep wet character identity.'
 if item['characterId']==7:result+=' Preserve all sesame seeds GOLDEN YELLOW; recolor only the ivory main body, never the seeds. Keep the long stretchy extension on the RIGHT. No white backing or shadow.'
 if item['characterId']==11 and item['material']!='original':result=result.replace('caramel, ', '')+' Steel-specific palette: recolor ALL brown body tiers including the top swirl to the requested cream color. The top swirl is NOT caramel. Keep the TWO silver armor bands and every metal rivet silver and unchanged.'
 if item['characterId']==14 and item['material']!='original':result+=' Lava-specific palette: recolor only the non-glowing solid rocky body surfaces. Keep every molten channel and drip bright ORANGE and yellow, never pink or mint. Keep the original fluid lava silhouette.'
 if item['characterId']==13 and item['material']!='original':result=result.replace('caramel, ', '')+' Keep original broad volcano crater silhouette and all grey smoke puffs. Recolor ALL brown solid volcano body surfaces including rim to the requested cream color; preserve orange magma and gray smoke.'
 return dict(key=item['key'],prompt=result,references=refs)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('action',choices=['init','next','import','report','review']);parser.add_argument('args',nargs='*');a=parser.parse_args()
 data=initialize()
 if a.action=='next':
  limit=int(a.args[0]) if a.args else 4
  pending=[x for x in data['items'] if x['status'] in ['pending','repair_pending'] or x['review']=='needs_revision']
  def priority(x):
   if x['review']=='needs_revision':return (-1,x['characterId'])
   if x['material']=='original' and x['expression']=='default' and x['outfit']=='royal': return (0,x['characterId'])
   if x['status']=='repair_pending':return (1,x['characterId'])
   if x['material']=='original' and x['expression']=='default':return (2,x['characterId'])
   return (3,x['characterId'],x['material'],x['outfit'],x['expression'])
  jobs=[make_job(x,data) for x in sorted(pending,key=priority)[:limit]]
  print(json.dumps(jobs,ensure_ascii=False));return
 if a.action=='import':
  key,source,*jobfile=a.args;item=next(x for x in data['items'] if x['key']==key)
  source=Path(source).resolve();geo=geometry(source)
  if not geo['bounds'] or not geo['transparent']:raise ValueError('Expected nonempty transparent PNG')
  if min(geo['width'],geo['height'])<512:raise ValueError('Unexpectedly small image')
  job=json.loads(Path(jobfile[0]).read_text()) if jobfile else make_job(item,data)
  if item.get('generatedAt'):
   item.setdefault('history',[]).append({k:item.get(k) for k in ['provenance','prompt','generationReferences','review','generatedAt']})
  item['prompt']=job['prompt'];item['generationReferences']=job['references']
  shutil.copy2(source,OUT/item['file']);item.update(status='generated',review='needs_visual_review',geometry=geo,provenance=str(source),generatedAt=now());save(data)
 if a.action=='review':
  key,status=a.args
  if status not in ['visual_checked','needs_revision']:raise ValueError('Invalid review status')
  item=next(x for x in data['items'] if x['key']==key);item['review']=status;save(data)
 counts=Counter(x['status'] for x in data['items']);reviews=Counter(x['review'] for x in data['items'])
 print(json.dumps(dict(total=len(data['items']),status=dict(counts),review=dict(reviews)),ensure_ascii=False))

if __name__=='__main__':main()
