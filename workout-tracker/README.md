# 운동 기록

개인용 운동 트래커. 월간 캘린더에서 운동한 날을 확인하고, 시간/종목/한줄평/사진을 기록합니다.

## 로컬에서 실행하기

```bash
npm install
npm run dev
```

## 배포하기 (Vercel)

1. 이 폴더를 GitHub 저장소로 push
2. https://vercel.com 에서 GitHub 로그인 → "Add New Project" → 이 저장소 선택
3. 설정 그대로 두고 Deploy (Vite 프로젝트는 자동 감지됨)
4. 배포된 주소를 휴대폰에서 열고 "홈 화면에 추가"

## 데이터 저장

브라우저의 localStorage에 저장됩니다. 같은 브라우저/기기에서만 데이터가 유지되며,
브라우저 데이터를 삭제하면 기록도 함께 사라지니 주의하세요.
