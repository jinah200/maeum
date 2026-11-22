# 온라인 마음쉼터 🌿

학생과 교사가 잠시 들어와 쉬어가는 고요한 숲속 쉼터 웹앱입니다.
로그인·설치 없이 링크만으로 입장해 **숲호흡으로 쉬어가고**, **염원을 작은 등불로 띄울** 수 있습니다.
학생이 쓰는 글은 **욕설·비방·개인정보를 2단계로 걸러냅니다.**

---

## 두 가지 작동 모드

| 모드 | 설정 | 저장 | 필터 |
| --- | --- | --- | --- |
| **로컬 모드** (기본) | 아무 설정 없이 바로 | 내 브라우저 | 1차(금칙어 사전)만 |
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
   | `GEMINI_MODEL` | `gemini-2.5-flash` (선택) |
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
