똥 키우기 — Google Play 제출 준비
작성일: 2026-11-25

앱 정보
- 앱 이름: 똥 키우기
- 패키지 이름: com.ahkang.pooppr (최초 Play 등록 후 변경 불가)
- Android 버전 이름: 1.0.0 / 버전 코드: 1
- 최소 Android: 6.0(API 23), 대상 Android: 16(API 36)
- 게임 주소: https://poop-pr.onrender.com/
- 형태: Chrome Trusted Web Activity(TWA). 배포된 웹 게임을 앱 창에서 실행한다.
  카카오 로그인과 계정 저장은 기존 웹 서버를 사용한다. 인터넷 연결이 필요하다.
  첫 서버 접근 때 Render 무료 서비스의 기동 대기가 발생할 수 있다.

제출할 파일
- releases/android/1.0.0/poop-pr-1.0.0-play.aab
- .aab는 Play Console 업로드 파일이며 휴대전화에 직접 설치하는 .apk와 다르다.
- GitHub Actions의 unsigned 산출물은 서명 전 파일이다. 그대로 제출하지 않는다.
- 서명키, 비밀번호, 빌드 산출물은 .gitignore로 제외했다.

Play Console에서 할 일
1. 새 앱 만들기: 이름 '똥 키우기', 기본 언어 한국어, 게임으로 등록.
2. 앱 무결성/Play 앱 서명: Google이 앱 서명키를 관리하도록 설정.
3. 테스트 > 내부 테스트 > 새 버전에서 위의 서명된 .aab 파일 업로드.
4. Play 앱 서명 인증서의 SHA-256 지문을 확인.
   public/.well-known/assetlinks.json의 sha256_cert_fingerprints 배열에
   Google Play의 '앱 서명 키 인증서' SHA-256을 추가하고 웹 서버에 배포해야 한다.
   현재 파일에는 로컬 업로드키 인증서의 지문만 있다. 업로드키와 Play 앱 서명키는
   서로 다를 수 있으므로 반드시 Play에 표시된 앱 서명 인증서를 사용한다.
   이 연결 전에도 앱은 브라우저 도구막대가 있는 창으로 열릴 수 있다.
5. 내부 테스트 링크로 실제 Android 휴대전화에 설치하여 로그인, 저장 복원,
   뒤로가기, 퍼즐 종료, 네트워크 끊김과 재접속을 확인한다.
6. 스토어 정보와 정책 항목을 완료한 다음 공개 출시를 진행한다.
   이 작업에서는 Play Console에 업로드하거나 공개 출시하지 않았다.

출시 전 남은 항목 — 업로드 가능한 AAB와 공개 출시 승인은 다르다
- 실제 운영자/문의처/보관 기간을 반영한 개인정보처리방침 및 공개 URL.
- 앱 안과 웹에서 사용자가 계정 및 관련 데이터 삭제를 요청할 수 있는 경로.
  현재 앱에는 계정 탈퇴 기능이 없으므로 출시 전에 구현해야 한다.
- 데이터 보안 양식: 로그인 식별자, 닉네임/프로필 사진, 플레이 시간 및 행동 기록,
  게임 진행 저장 등을 실제 동작에 맞게 신고. 별도 광고/결제 SDK는 아직 없다.
- 스토어 설명, 앱 아이콘, 기능 그래픽, 실제 휴대전화 스크린샷, 콘텐츠 등급,
  대상 연령, 앱 접근 권한 안내와 개발자 연락처.
- 신규 개인 개발자 계정에 해당하면 연속 14일 동안 최소 12명의 테스터가
  참여하는 비공개 테스트 및 프로덕션 접근 신청이 필요할 수 있다.
- 출시 승인 및 심사 통과는 보장할 수 없으며 실제 기기 검증이 필요하다.

서명키 백업 — 이 폴더는 공개 업로드하지 말 것
- android/signing/upload-key.jks
- android/signing/upload-password.txt
- alias: upload
- android/signing/upload-certificate.der (공개 인증서)
- android/signing/upload-certificate-sha256.txt (공개 인증서 지문)
키와 비밀번호를 안전한 별도 저장소에 함께 백업한다. 업데이트 때 같은 업로드키를
사용해야 한다. 키가 이미 있으면 create-signing-key.py는 새 키로 덮어쓰지 않는다.

다음 버전 만들기
1. android/app/build.gradle의 versionCode를 2, 3 ... 으로 증가시키고
   versionName도 갱신. 첫 등록 후 패키지 이름은 유지한다.
2. Android 변경사항을 GitHub main에 푸시하면 Android bundle 작업이 실행된다.
   Android 코드 변경이 없을 때는 Actions에서 수동 실행할 수 있다.
3. 성공한 작업의 poop-pr-android-unsigned 산출물을 내려받아 압축 해제한다.
4. JDK 17 및 기존 서명키가 있는 PC에서 아래 실행:
   python3 android/sign-bundle.py <서명전.aab> <새버전-play.aab>
   JAVA_HOME을 지정하거나, 이 PC의 android-tools/java-home.txt 설정을 사용한다.
5. Play Console의 내부 테스트에 먼저 업로드하고 실제 기기에서 확인한다.
웹 게임 내용 변경은 웹 서버 배포로 반영되지만 앱 패키지 설정 변경은 새 AAB가 필요하다.

공식 참고 자료
https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
https://support.google.com/googleplay/android-developer/answer/11926878
https://support.google.com/googleplay/android-developer/answer/10144311
https://support.google.com/googleplay/android-developer/answer/13327111
https://support.google.com/googleplay/android-developer/answer/14151465
