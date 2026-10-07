// SPAC 관련주 데이터
let allStocks = [];
let filteredStocks = [];
let currentSearch = '';

// 데이터 로드
async function loadStocks() {
    try {
        const response = await fetch('data/spac-stocks.json');
        allStocks = await response.json();

        allStocks = allStocks.map(stock => ({
            ...stock,
            listingDate: stock.listingDate || stock.announcementDate || '미공개',
            currentPrice: stock.currentPrice || '가격 미제공'
        }));

        filteredStocks = allStocks;
        await hydrateCurrentPrices(filteredStocks);
        renderStocks();
        updateStats();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

async function hydrateCurrentPrices(stockList) {
    const symbolsToFetch = stockList
        .map(stock => ({
            id: stock.code,
            code: stock.code,
            name: stock.name
        }))
        .filter(item => item.code && item.code.length > 0);

    for (const item of symbolsToFetch) {
        const price = await fetchCurrentPrice(item.code, item.name);
        const target = allStocks.find(stock => stock.code === item.code);
        if (target) {
            target.currentPrice = price;
        }
    }
}

async function fetchCurrentPrice(code, name = '') {
    const normalized = normalizeMarketCode(code);
    if (!normalized) {
        return '가격 미제공';
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?range=1d&interval=1m`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return '가격 미제공';
        }

        const data = await response.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

        if (typeof price === 'number') {
            return `${Number(price).toLocaleString('ko-KR')}원`;
        }

        return '가격 미제공';
    } catch (error) {
        console.warn(`가격 조회 실패: ${code} (${name})`, error);
        return '가격 미제공';
    }
}

function normalizeMarketCode(code) {
    const cleaned = String(code || '').trim().toUpperCase();
    if (!cleaned) return null;

    // 실제 KRX 종목코드: 6자리 숫자 -> .KS 로 연결
    if (/^\d{6}$/.test(cleaned)) {
        return `${cleaned}.KS`;
    }

    // 이미 심볼 형식이면 그대로 사용
    if (cleaned.includes('.')) {
        return cleaned;
    }

    // 숫자가 아닌 코드들은 공식 시장 심볼이 아니므로 조회 불가
    return null;
}

// 주식 카드 렌더링
function renderStocks() {
    const container = document.getElementById('stocksContainer');
    const noResults = document.getElementById('noResults');

    if (filteredStocks.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    container.innerHTML = filteredStocks.map(stock => `
        <div class="stock-card">
            <div class="stock-header">
                <div>
                    <div class="stock-name">${stock.name}</div>
                    <span class="stock-code">${stock.code}</span>
                </div>
            </div>

            <div class="stock-info">
                <div class="info-item">
                    <div class="info-label">업종</div>
                    <div class="info-value">${stock.sector || '미분류'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">상장일</div>
                    <div class="info-value">${stock.listingDate || '미공개'}</div>
                </div>
                <div class="info-item full-width">
                    <div class="info-label">현재가</div>
                    <div class="info-value price-value">${stock.currentPrice || '가격 미제공'}</div>
                </div>
            </div>

            <div class="stock-links" style="margin-top: 15px;">
                ${stock.newsLink ? `<a href="${stock.newsLink}" target="_blank" class="link-btn">뉴스</a>` : ''}
                ${stock.filingLink ? `<a href="${stock.filingLink}" target="_blank" class="link-btn">공시</a>` : ''}
            </div>
        </div>
    `).join('');
}

// 검색 필터링
function filterStocks() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    currentSearch = searchValue;

    filteredStocks = allStocks.filter(stock => {
        const matchesSearch =
            (stock.name && stock.name.toLowerCase().includes(searchValue)) ||
            (stock.code && stock.code.toLowerCase().includes(searchValue)) ||
            (stock.sector && stock.sector.toLowerCase().includes(searchValue));

        return matchesSearch;
    });

    renderStocks();
    updateStats();
}

// 통계 업데이트
function updateStats() {
    const total = allStocks.length;
    const listed = allStocks.filter(s => s.listingDate || s.status === '상장').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('listedCount').textContent = listed;
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', loadStocks);
