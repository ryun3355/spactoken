# SpacToken - 국내 SPAC 관련주 정보 플랫폼

국내 SPAC(기업인수목적회사) 관련주를 한곳에서 정리하고 추적할 수 있는 정적 웹사이트입니다.

## 🎯 주요 기능

- **실시간 검색**: 회사명, 종목코드로 빠른 검색
- **상태별 필터링**: 상장 / 상장예정 / 검토중 분류
- **통계 대시보드**: 전체, 상장, 예정 기업 수 한눈에 확인
- **상세 정보**: 각 기업의 기본정보, 공시, 뉴스 링크 제공
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 최적화
- **모던 UI**: 다크모드 그라디언트 디자인

## 📁 폴더 구조

```
spactoken/
├── index.html          # 메인 HTML 페이지
├── styles.css          # 모던 디자인 스타일
├── script.js           # 필터링, 검색 로직
├── data/
│   └── spac-stocks.json  # SPAC 기업 데이터
└── README.md           # 문서
```

## 🚀 사용 방법

### 로컬에서 실행

```bash
# 저장소 클론
git clone https://github.com/ryun3355/spactoken.git
cd spactoken

# 간단한 HTTP 서버 실행 (Python)
python -m http.server 8000

# 또는 Node.js의 http-server 사용
npx http-server
```

그 후 `http://localhost:8000` 접속

### GitHub Pages로 배포

1. Repository Settings → Pages
2. Source를 `main` branch 선택
3. `https://ryun3355.github.io/spactoken/` 에서 확인

## 📊 데이터 구조

`data/spac-stocks.json` 예시:

```json
[
  {
    "name": "한국프로로지스SPAC",
    "code": "KPRO",
    "status": "상장",
    "sector": "부동산/물류",
    "description": "국내 물류 부동산 전문 기업",
    "announcementDate": "2023-06-15",
    "mainShareholder": "프로로지스",
    "newsLink": "https://example.com/news",
    "filingLink": "https://example.com/filing"
  }
]
```

## 🎨 커스터마이징

### 데이터 추가
1. `data/spac-stocks.json`에 새 기업 정보 추가
2. 자동으로 사이트에 반영됨

### 디자인 변경
- `styles.css`에서 색상, 레이아웃 조정
- 그라디언트 색상 변경: `#667eea`, `#764ba2`

### 기능 추가
- `script.js`에 새로운 필터링 로직 추가 가능
- 정렬, 즐겨찾기 등 기능 확장 가능

## 📝 향후 계획

- [ ] 실시간 주가 데이터 연동
- [ ] 사용자 댓글 및 토론 기능
- [ ] CSV 데이터 내보내기
- [ ] API 서버 구축
- [ ] 앱 버전 개발

## ✨ 라이선스

MIT License

## 📧 문의

issue 또는 PR로 피드백 주세요!
