# ONERS CUP

FC Online과 League of Legends 대회의 공개 순위, 경기 결과, LoL KDA를 제공하는 반응형 Next.js 앱입니다. FC 초기 데이터는 `SAB_FC_Online_CUP_운영표.xlsx`에서 추출했으며 원본은 변경하지 않았습니다.

## 준비

Node.js 20.9 이상, npm, Supabase 계정, Vercel 계정이 필요합니다.

1. `npm install`
2. `.env.example`을 `.env.local`로 복사하고 값을 입력합니다.
3. `npm run dev` 후 `http://localhost:3000`을 엽니다.

## Supabase 설정

1. Supabase에서 무료 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다. 테이블, 제약조건, 공개 읽기 및 관리자 쓰기 RLS, FC 선수와 LoL 팀 seed가 생성됩니다.
3. 프로젝트 설정의 Custom Postgres Config에 `app.settings.admin_email`을 관리자 이메일로 지정합니다. 호스팅 환경에서 이 설정을 사용할 수 없다면 `is_admin()` 함수의 비교값을 별도 `admin_users` 테이블 조회로 바꾸십시오. 클라이언트가 보내는 이메일만 신뢰하면 안 됩니다.
4. Authentication → Users에서 이메일/비밀번호 방식으로 관리자 한 명을 생성합니다.
5. Project URL과 anon key를 `.env.local`에 넣고, 동일한 이메일을 `ADMIN_EMAIL`에 설정합니다. service-role 키는 브라우저나 저장소에 넣지 않습니다.

## 운영

- 공개 페이지는 로그인 없이 `/fc-online`, `/lol`에서 확인합니다.
- `/admin`은 관리자 진입 화면입니다. 운영 연결 시 Supabase SSR 세션을 사용하고 서버에서 `ADMIN_EMAIL`을 재검증하십시오. 데이터베이스 RLS가 최종 쓰기 권한을 차단합니다.
- FC 점수 입력·수정·삭제 후 순위는 저장값이 아니라 `lib/rankings/fc-ranking.ts`에서 다시 계산합니다.
- LoL은 완료된 세트 승자를 세어 최종 스코어를 만들고, 상대 킬을 자동으로 데스로 사용합니다.
- 모든 날짜 표시는 `Asia/Seoul` 기준으로 변환하십시오.

## 검사 및 GitHub Pages 배포

`npm test`와 `npm run build`를 실행합니다. `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 정적 사이트를 자동으로 빌드하고 GitHub Pages에 배포합니다.

GitHub 저장소의 Settings → Secrets and variables → Actions → Variables에 다음 값을 등록합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`

Settings → Pages → Source는 `GitHub Actions`로 선택합니다. 배포 주소는 `https://00skgun.github.io/oners_game_rank/`입니다. `.env.local`은 커밋하지 않습니다.

단위 테스트와 프로덕션 빌드를 실행해 검증했습니다.
