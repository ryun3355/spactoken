#!/usr/bin/env python3
"""코스피/코스닥 상장 스팩 목록과 시세를 모아 data/spac-stocks.json을 갱신한다.

- 종목 목록: KIND 상장법인목록 (회사명에 '스팩' 또는 '기업인수목적'이 들어간 종목)
- 시세: 네이버 증권 일봉 (최근 거래일 종가, 전일 대비, 거래량)

표준 라이브러리만 사용하므로 별도 설치 없이 `python3 scripts/update_spac_data.py`로 실행한다.
"""
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path

KIND_URL = 'https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&marketType={market}'
NAVER_CHART_URL = 'https://fchart.stock.naver.com/sise.nhn?symbol={code}&timeframe=day&count=2&requestType=0'
MARKETS = {'stockMkt': '코스피', 'kosdaqMkt': '코스닥'}
SPAC_KEYWORDS = ('스팩', '기업인수목적')
OUTPUT = Path(__file__).resolve().parent.parent / 'data' / 'spac-stocks.json'
KST = timezone(timedelta(hours=9))
USER_AGENT = 'Mozilla/5.0 (compatible; spactoken-data-bot)'


def fetch_text(url, encoding='euc-kr', retries=3):
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode(encoding, errors='replace')
        except Exception:
            if attempt == retries:
                raise
            time.sleep(2 * attempt)


class TableParser(HTMLParser):
    """KIND 엑셀 다운로드(실제로는 HTML 표)를 행 단위 리스트로 읽는다."""

    def __init__(self):
        super().__init__()
        self.rows = []
        self._row = None
        self._cell = None

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self._row = []
        elif tag in ('td', 'th') and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self._cell is not None:
            self._row.append(' '.join(''.join(self._cell).split()))
            self._cell = None
        elif tag == 'tr' and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def fetch_spacs():
    spacs = []
    for market_id, market_name in MARKETS.items():
        parser = TableParser()
        parser.feed(fetch_text(KIND_URL.format(market=market_id)))
        if not parser.rows:
            raise RuntimeError(f'KIND {market_name} 목록이 비어 있습니다.')

        header, *rows = parser.rows
        missing = {'회사명', '종목코드', '상장일'} - set(header)
        if missing:
            raise RuntimeError(f'KIND {market_name} 목록 형식이 바뀌었습니다. 없는 열: {sorted(missing)}')

        for row in rows:
            item = dict(zip(header, row))
            name = item['회사명']
            if not any(keyword in name for keyword in SPAC_KEYWORDS):
                continue
            spacs.append({
                'name': name,
                'code': item['종목코드'],
                'market': market_name,
                'listingDate': item.get('상장일') or None,
            })
    return spacs


def fetch_quote(code):
    xml = fetch_text(NAVER_CHART_URL.format(code=code))
    bars = [item.split('|') for item in re.findall(r'<item data="([^"]+)"', xml)]
    if not bars:
        return None

    date, _open, _high, _low, close, volume = bars[-1]
    close = int(float(close))
    quote = {
        'priceDate': f'{date[:4]}-{date[4:6]}-{date[6:8]}',
        'close': close,
        'change': None,
        'changeRate': None,
        'volume': int(float(volume)),
    }
    if len(bars) >= 2:
        prev_close = int(float(bars[-2][4]))
        if prev_close:
            quote['change'] = close - prev_close
            quote['changeRate'] = round((close - prev_close) / prev_close * 100, 2)
    return quote


def load_existing():
    try:
        existing = json.loads(OUTPUT.read_text(encoding='utf-8'))
    except (FileNotFoundError, json.JSONDecodeError):
        return None
    return existing if isinstance(existing, dict) else None


def main():
    spacs = fetch_spacs()
    if not spacs:
        raise RuntimeError('스팩 종목을 하나도 찾지 못했습니다. 기존 데이터를 유지합니다.')

    empty_quote = {'priceDate': None, 'close': None, 'change': None, 'changeRate': None, 'volume': None}
    failed = []
    for spac in spacs:
        try:
            quote = fetch_quote(spac['code'])
        except Exception as error:
            print(f'시세 조회 실패: {spac["name"]}({spac["code"]}) - {error}', file=sys.stderr)
            quote = None
        if quote is None:
            failed.append(spac['code'])
        spac.update(quote or empty_quote)
        time.sleep(0.2)

    if len(failed) > len(spacs) / 2:
        raise RuntimeError(f'시세 조회 실패가 너무 많습니다({len(failed)}/{len(spacs)}). 기존 데이터를 유지합니다.')

    spacs.sort(key=lambda s: (s['listingDate'] or '', s['name']), reverse=True)
    price_dates = [s['priceDate'] for s in spacs if s['priceDate']]
    data = {
        'updatedAt': datetime.now(KST).isoformat(timespec='seconds'),
        'baseDate': max(price_dates) if price_dates else None,
        'count': len(spacs),
        'stocks': spacs,
    }

    existing = load_existing()
    if existing and {**existing, 'updatedAt': None} == {**data, 'updatedAt': None}:
        print('변경 사항이 없어 파일을 그대로 둡니다.')
        return

    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'스팩 {len(spacs)}개 저장 (기준일 {data["baseDate"]}, 시세 실패 {len(failed)}개) → {OUTPUT}')


if __name__ == '__main__':
    main()
