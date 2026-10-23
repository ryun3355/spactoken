# SpacToken - 국내 상장 스팩 전 종목 조회

코스피·코스닥에 상장된 스팩(SPAC, 기업인수목적회사) 전 종목의 상장일, 종가, 전일 대비, 거래량을 보여주는 정적 웹사이트입니다.

종목 목록은 사람이 직접 입력하지 않습니다. 한국거래소 KIND의 상장법인목록에서 매일 자동으로 가져오므로, 새로 상장한 스팩은 추가되고 합병·상장폐지된 스팩은 빠집니다.

## 주요 기능

- 종목명·종목코드 검색
- 시장(코스피/코스닥) 필터. 필터 버튼은 데이터에 있는 시장을 기준으로 자동 생성됩니다.
- 상장일·거래량·등락률·종가·종목명 정렬
- 시세 기준일과 마지막 갱신 시각 표시

## 구조

```
spactoken/
├── index.html                      # 메인 페이지
├── styles.css                      # 스타일
├── script.js                       # 검색·필터·정렬·렌더링
├── data/
│   └── spac-stocks.json            # 자동 생성 데이터 (직접 수정하지 않음)
├── scripts/
│   └── update_spac_data.py         # 데이터 수집 스크립트
└── .github/workflows/
    └── update-data.yml             # 평일 장 마감 후 자동 갱신
```

## 데이터 수집 방식

| 항목 | 출처 |
|------|------|
| 종목 목록 (종목명, 코드, 시장, 상장일) | [KIND 상장법인목록](https://kind.krx.co.kr/corpgeneral/corpList.do?method=loadInitPage)에서 회사명에 `스팩` 또는 `기업인수목적`이 들어간 종목 |
| 종가, 전일 대비, 거래량 | 네이버 증권 일봉 차트 |

두 곳 모두 브라우저에서 직접 호출할 수 없기 때문에(CORS), GitHub Actions가 서버에서 수집해 `data/spac-stocks.json`으로 저장하고 커밋합니다.

- 실행 시각: 평일 17:00 KST (GitHub Actions 탭에서 **Run workflow**로 수동 실행 가능)
- 목록을 하나도 못 받았거나 시세 조회가 절반 넘게 실패하면 기존 데이터를 그대로 둡니다.
- 내용이 바뀌지 않았으면 커밋하지 않습니다.

## 로컬에서 실행

```bash
# 데이터 갱신 (Python 3 표준 라이브러리만 사용)
python3 scripts/update_spac_data.py

# 사이트 확인
python3 -m http.server 8000
# → http://localhost:8000
```

## 데이터 형식

```json
{
  "updatedAt": "2026-10-23T17:00:00+09:00",
  "baseDate": "2026-10-23",
  "count": 68,
  "stocks": [
    {
      "name": "KB제34호스팩",
      "code": "0209J0",
      "market": "코스닥",
      "listingDate": "2026-09-22",
      "priceDate": "2026-10-23",
      "close": 1900,
      "change": 1,
      "changeRate": 0.05,
      "volume": 43089
    }
  ]
}
```

## 배포

GitHub Pages(`main` 브랜치 루트)로 배포하며, 커스텀 도메인은 `CNAME`에 있습니다.

`script.js`나 `styles.css`를 수정하면 `index.html`에서 두 파일을 불러오는 주소의 `?v=` 값도 바꿔 주세요. GitHub Pages는 파일을 브라우저에 10분간 캐시하기 때문에, 값을 바꾸지 않으면 새 HTML과 예전 JS가 섞여 화면이 깨질 수 있습니다.

## 라이선스

MIT License
