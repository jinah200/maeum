# 온라인 마음쉼터 🌿

학생과 교사가 잠시 들어와 쉬어가는 고요한 숲속 쉼터 웹앱입니다.
로그인·설치 없이 링크만으로 입장해 **숲호흡으로 쉬어가고**, **염원을 작은 등불로 띄울** 수 있습니다.
학생이 쓰는 글은 **욕설·비방·개인정보를 2단계로 걸러냅니다.**

---

## 두 가지 작동 모드

| 모드 | 설정 | 저장 | 필터 |
| --- | --- | --- | --- |
| **로컬 모드** (기본) | 아무 설정 없이 바로 | 내 브라우저 | 1차(금칙어 사전)만 |
| **시트 모드** (무료·권장) | Google 시트 + Apps Script + GitHub Pages | 내 Google 시트 | 1차 + 서버 규칙 + (선택) Gemini |
| **서버 모드** | Supabase + Vercel 배포 | 모두 공유 | 1차 + 2차(Gemini 검열) |

> 처음엔 **로컬 모드로 바로 확인**하고, 반응이 좋으면 서버 모드로 올리면 됩니다.

---

## 1단계 — 바로 열어보기 (로컬 모드)

1. `index.html` 을 더블클릭해 브라우저로 엽니다.
2. **쉬어가기** 버튼 → 캐릭터가 숲호흡을 하고 횟수가 올라갑니다.
3. **염원 올리기** → 100자 이내로 쓰면 등불로 떠오릅니다. 욕설·전화번호는 즉시 막힙니다.

이 상태로도 수업에서 쓸 수 있습니다. (단, 글은 각자 브라우저에만 저장됩니다.)

---

## 2단계 — GitHub + Vercel 로 런칭 (서버 모드)

### (1) GitHub 에 올리기
이 폴더를 그대로 GitHub 새 저장소에 올립니다.

```bash
cd maeum-shelter
git init
git add .
git commit -m "온라인 마음쉼터 첫 버전"
git branch -M main
git remote add origin https://github.com/<내아이디>/maeum-shelter.git
git push -u origin main
```

### (2) Supabase 준비 (염원 저장소)
1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다.
2. **SQL Editor** 에 `supabase/schema.sql` 내용을 붙여넣고 실행합니다.
3. **Project Settings → API** 에서 세 값을 확인해 둡니다.
   - `Project URL`
   - `anon public` 키 (공개용)
   - `service_role` 키 (비공개, 서버 전용)

### (3) Gemini API 키 (2차 검열)
1. [aistudio.google.com](https://aistudio.google.com) 에서 **API Key** 를 발급합니다.

### (4) 프론트에 공개 키 넣기
`js/config.js` 를 열어 **공개 키 두 개만** 채웁니다.

```js
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...(anon public 키)",
```

> ⚠️ `service_role` 키와 `GEMINI_API_KEY` 는 **절대 여기 넣지 마세요.** 서버에만 둡니다.

### (5) Vercel 배포
1. [vercel.com](https://vercel.com) → **Add New → Project** → 방금 만든 GitHub 저장소 선택.
2. **Environment Variables** 에 아래를 넣습니다. (`.env.example` 참고)

   | 이름 | 값 |
   | --- | --- |
   | `SUPABASE_URL` | Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role 키 |
   | `GEMINI_API_KEY` | Gemini API 키 |
   | `GEMINI_MODEL` | `gemini-flash-lite-latest` (선택, AI Studio에서 현재 모델 ID 확인) |
   | `ADMIN_PASSWORD` | 교사 관리 비밀번호 |

3. **Deploy** 를 누르면 끝. 나오는 주소를 학생에게 공유하면 됩니다.

---

## 염원 필터 구조 (가장 중요)

1. **1차 · 브라우저** (`js/badwords.js`) — 금칙어 사전으로 즉시 차단. 빠르지만 우회에 약함.
2. **2차 · 서버** (`api/submit-wish.js`) — 통과한 글만 Gemini 가 맥락까지 판정.
   **통과한 글만 공개**됩니다(게시 전 검열). 검열 중에는 "염원을 올리는 중…" 연출이 보입니다.
3. 추가 방어 — 100자 제한, 도배 방지(쿨다운), 전화번호·숫자열 차단.
4. 최종 안전망 — **교사 관리 화면**(`admin.html`)에서 숨기기·삭제.

> Gemini 검열기가 일시적으로 실패하면, 글은 공개되지 않고 **'검토중(pending)'** 으로 저장되어
> 교사가 확인한 뒤에만 공개됩니다. (안전 우선)

---

## 교사 관리 화면

- 주소 끝에 `/admin.html` 을 붙이면 들어갑니다. (예: `https://내앱.vercel.app/admin.html`)
- `ADMIN_PASSWORD` 로 로그인 → 올라온 염원을 보고 **공개/숨기기/삭제**, **신고된 글**을 따로 볼 수 있습니다.

---

## 파일 구조

```
maeum-shelter/
├─ index.html          쉼터 메인 화면
├─ admin.html          교사 관리 화면
├─ css/style.css       화면 디자인
├─ js/
│  ├─ config.js        설정(공개 키·옵션)
│  ├─ badwords.js      1차 금칙어 필터
│  └─ app.js           메인 로직
├─ api/
│  ├─ submit-wish.js   2차 Gemini 검열 + 저장 (서버리스)
│  └─ admin.js         교사 관리 API (서버리스)
├─ supabase/schema.sql 테이블 생성 SQL
├─ .env.example        서버 환경변수 예시
├─ package.json
└─ README.md
```

---

## 커스터마이즈 힌트

- 캐릭터 색·모양 → `index.html` 의 SVG, `css/style.css` 의 `.body/.leaf` 등.
- 금칙어 추가 → `js/badwords.js` 의 `BAD_WORDS` 배열.
- 검열 기준 조정 → `api/submit-wish.js` 의 Gemini 프롬프트 문장.
- 쉼터 테마 변경(예: 바닷가·밤하늘) → 배경 그라데이션과 안내 문구만 바꾸면 됩니다.


---

## Google 시트로 런칭하기 (무료 · 권장)

염원이 **선생님의 Google 시트**에 쌓이고, 시트의 **'상태' 칸이 곧 관리 화면**입니다.
호스팅은 GitHub Pages(무료), 서버 역할은 Apps Script(무료)가 맡습니다. Supabase·Vercel은 쓰지 않습니다.

```
학생 브라우저 ─ GitHub Pages(화면)
      └─ Apps Script 웹 앱 ─ Google 시트(염원·방문) ─ (선택) Gemini 판정
```

### 1. 시트와 스크립트 만들기
1. [sheets.new](https://sheets.new) 로 새 시트를 만들고 이름을 "마음쉼터 염원"으로 바꿉니다.
2. **확장 프로그램 → Apps Script** 를 엽니다.
3. 기본 `Code.gs` 내용을 지우고, 이 저장소의 `apps-script/Code.gs` 내용을 붙여넣어 저장합니다.
4. 위쪽 함수 선택 칸에서 **`setup`** 을 고르고 **실행** → 권한 승인 창이 뜨면 허용합니다.
   (시트에 `염원`·`방문` 탭이 생기고, '상태' 칸에 드롭다운이 붙습니다.)

### 2. 웹 앱으로 배포
1. 오른쪽 위 **배포 → 새 배포 → 유형: 웹 앱**
2. **다음 사용자 인증 정보로 실행: 나**, **액세스 권한: 모든 사용자**
3. **배포** 후 나오는 **웹 앱 URL**(`https://script.google.com/macros/s/…/exec`)을 복사합니다.

> 학교 Google Workspace 계정에서는 '모든 사용자' 배포가 관리자 설정으로 막혀 있을 수 있습니다.
> 그럴 때는 개인 Gmail 계정으로 시트를 만드세요.

### 3. 화면에 주소 연결
`js/config.js` 의 `APPS_SCRIPT_URL` 에 복사한 URL을 넣고 저장합니다.

```js
APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfy…/exec",
```

### 4. GitHub Pages로 공개
1. 수정한 파일을 GitHub 저장소에 다시 올립니다.
2. 저장소 **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch** / Branch: **main**, 폴더 **/(root)** → Save
3. 1~2분 뒤 `https://<내아이디>.github.io/<저장소이름>/` 주소가 열립니다. 이 주소를 학생에게 공유하세요.

### 5. 운영
- **공개하기** : 시트 `염원` 탭에서 '상태'를 `공개` 로 바꾸면 등불이 뜹니다. (최대 15초 지연)
- **숨기기** : `숨김` 으로 바꿉니다. 지우려면 행을 삭제하면 됩니다.
- **막힌 글 확인** : Gemini가 부적절로 판정한 글은 `차단` 으로 남아 생활지도에 참고할 수 있습니다.
- `Code.gs` 를 고친 뒤에는 **배포 → 배포 관리 → 연필 아이콘 → 버전: 새 버전 → 배포** 를 해야 반영됩니다. (URL은 그대로)

### (선택) Gemini 자동 판정 켜기
기본값은 **Gemini 없이** 동작합니다. 이때 모든 글이 `검토중` 으로 들어오고, 선생님이 `공개` 로 바꾼 글만 화면에 뜹니다.
자동 판정을 쓰려면:
1. [aistudio.google.com](https://aistudio.google.com) 에서 API 키를 만듭니다. **결제 수단을 연결하지 않은 무료 티어**로 쓰세요.
2. Apps Script → **프로젝트 설정 → 스크립트 속성 → 속성 추가**
   - `GEMINI_API_KEY` = 발급한 키
   - `GEMINI_MODEL` = AI Studio에 표시된 현재 Flash 계열 모델 ID (비우면 `gemini-flash-lite-latest`)
3. 키는 스크립트 속성에만 두며 GitHub에는 올라가지 않습니다.

호출이 실패하거나 한도를 넘으면 글은 공개되지 않고 `검토중` 으로 보관됩니다. (안전 우선)
