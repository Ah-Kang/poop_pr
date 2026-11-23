# 푸딩똥 모듈 조합 테스트

로컬 주소: http://localhost:5173/cosmetics-lab.html

본 게임과 저장 데이터는 변경하지 않는 독립 미리보기입니다. 재질 3종 × 표정 3종 × 의상 3종으로 27가지 조합을 테스트합니다. 원본 비교, 밝은/어두운/게임 배경, 축소 보기, 함께 움직이기, 터치 반응, 전체 조합 갤러리가 있습니다.

## 구현 범위와 제한

- 얼굴 없는 몸통 PNG, 표정 아틀라스 PNG, 의상 아틀라스 PNG 3장만 사용합니다. 원본 이미지는 비교용입니다.
- SVG viewBox가 원본 아틀라스의 부분을 참조합니다. 조합별 완성 이미지를 저장하지 않습니다.
- 모든 부품은 같은 캐릭터 좌표계에 있고 움직임은 최상위 컨테이너 하나에 적용합니다.
- 민트/딸기는 SVG 색상 필터로 색감·광택을 시험합니다. 실제 반투명 젤리나 물리 재질 구현은 아닙니다. 캐러멜은 별도 경계로 원래 색을 보존합니다.
- 표정은 얼굴 없는 몸통 위에 교체합니다. 망토는 뒤/앞 레이어로 나누며 왕관과 리본은 푸딩똥의 기준점에 맞춥니다.
- 부품 좌표와 캐러멜 경계는 푸딩똥 전용입니다. 다른 체형으로 자동 호환되지 않으며 별도 피팅이 필요합니다.
- 원본과 얼굴 없는 새 몸통 사이에 생성 과정의 미세한 차이가 있을 수 있습니다. 최종 아트 제작 시 정밀 정렬과 가장자리 검수가 필요합니다.
- 이 페이지에는 적용/구매/저장 기능이 없고 배포용 메인 진입점에도 연결하지 않았습니다.

## 이미지 생성

기본 내장 이미지 생성 도구를 사용했습니다. 참조: ../assets/PoopImage/pudding-poop.png. 생성 결과 3장을 assets/에 복사해 보관했습니다.

### body

Edit the supplied existing pudding game sprite. Output ONE transparent PNG asset. REMOVE ONLY all facial features: both eyes, mouth, rosy cheeks and cheek marks. Seamlessly inpaint these small areas with the surrounding warm yellow custard texture. Preserve exactly the pudding's entire silhouette, wide proportions, caramel top and drips, painterly shading, golden outline, original perspective, original placement and scale on the square canvas. Do not redesign, recenter, crop tightly, add props, limbs, text, shadows outside the body or background. This is the faceless BASE layer for a modular character. Preserve original alpha transparency. The shape and caramel must be identical to the reference.

### faces

Create a transparent PNG SPRITE ATLAS of THREE facial-expression overlays for the supplied pudding character. Only facial features floating on genuine transparency, absolutely NO pudding body, face-colored oval, backdrop, text or labels. Square canvas divided into three equal HORIZONTAL ROWS: top row original happy face with two glossy dark chocolate oval eyes, tiny curved smile, subtle peach blush spots; middle row wink with left eye open and right eye closed, same smile and blush; bottom row sleepy closed eyes and tiny relaxed smile, same blush. Each row contains one centered entire face at the same scale, occupying 75% canvas width, with generous space separating rows. Preserve exact reference character's soft painterly shading, chocolate eye color, cream highlights, peach cheeks and cute proportions. Eyes separated by around 40% of entire face width. All feature sets have same eye locations and mouth locations. No extra facial features. Transparent between eyes and mouth, no rectangular backing. Production-quality reusable sprite atlas.

### outfits

Create one transparent square PNG SPRITE ATLAS with FOUR separate costume pieces for the supplied cute golden pudding character, matching its warm painterly game art, soft dark golden outlines, lighting from upper left. Layout strict 2x2 equal cells, generous empty transparent gutters, no overlap. TOP LEFT: a small gold crown with 3 round-tipped points, one central red jewel, elliptical curved gold band seen slightly from above, isolated with no head. TOP RIGHT: a soft coral-pink satin bow, two rounded loops, small central knot and two short tails, isolated with no head. BOTTOM LEFT: BACK LAYER of a burgundy royal cape for a wide low pudding with no neck or arms: broad trapezoid cloth, narrower top, wide curved bottom, warm gold trim, soft folds, empty body omitted. It goes entirely BEHIND a separate pudding sprite so no collar or front clasp on this piece. BOTTOM RIGHT: FRONT LAYER trim of that cape: very shallow wide U-shaped thin golden chain, small round ruby clasp at bottom center, with small burgundy fabric corners at each end. It overlays just the lower edge of the pudding below its face. All four objects isolated on genuine transparent alpha, no character, no faces, no labels, no background, no shadows outside objects, no UI. Each object fits comfortably inside its cell.
