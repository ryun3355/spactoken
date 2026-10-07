// SPAC 관련주 데이터
let allStocks = [];
let filteredStocks = [];

// 데이터 로드
async function loadStocks() {
    try {
        const response = await fetch('data/spac-stocks.json');
        allStocks = await response.json();

        allStocks = allStocks.map(stock => ({
            ...stock,
            listingDate: stock.listingDate || stock.announcementDate || '미공개',
            previousClose: '조회 중...',
            previousVolume: '조회 중...'
        }));

        filteredStocks = allStocks;
        await hydrateMarketData(filteredStocks);
        renderStocks();
        updateStats();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

async function hydrateMarketData(stockList) {
    for (const stock of stockList) {
        const marketCode = resolveMarketCode(stock);
        const marketInfo = await fetchMarketData(marketCode);
        stock.previousClose = marketInfo.previousClose;
        stock.previousVolume = marketInfo.previousVolume;
    }
}

async function fetchMarketData(code) {
    if (!code) {
        return {
            previousClose: '미공개',
            previousVolume: '미공개'
        };
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(code)}?range=5d&interval=1d`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return {
                previousClose: '미공개',
                previousVolume: '미공개'
            };
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        const quote = result?.meta;
        const previousClose = quote?.previousClose;
        const quoteVolume = result?.indicators?.quote?.[0]?.volume;
        const latestVolume = Array.isArray(quoteVolume) ? quoteVolume[quoteVolume.length - 2] : null;

        return {
            previousClose: typeof previousClose === 'number'
                ? `${Number(previousClose).toLocaleString('ko-KR')}원`
                : '미공개',
            previousVolume: typeof latestVolume === 'number'
                ? Number(latestVolume).toLocaleString('ko-KR')
                : '미공개'
        };
    } catch (error) {
        console.warn(`시장 데이터 조회 실패: ${code}`, error);
        return {
            previousClose: '미공개',
            previousVolume: '미공개'
        };
    }
}

function resolveMarketCode(stock) {
    const marketCode = String(stock?.marketCode || '').trim();
    if (marketCode && /^\d{6}$/.test(marketCode)) {
        return `${marketCode}.KS`;
    }

    const rawCode = String(stock?.code || '').trim();
    if (rawCode.includes('.')) {
        return rawCode.toUpperCase();
    }

    if (/^\d{6}$/.test(rawCode)) {
        return `${rawCode}.KS`;
    }

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
                    <div class="info-label">상장일자</div>
                    <div class="info-value">${stock.listingDate || '미공개'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">종가(직전거래일)</div>
                    <div class="info-value">${stock.previousClose || '미공개'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">거래량(직전거래일)</div>
                    <div class="info-value">${stock.previousVolume || '미공개'}</div>
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
    document.getElementById('totalCount').textContent = total;
    document.getElementById('listedCount').textContent = total;
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', loadStocks);
