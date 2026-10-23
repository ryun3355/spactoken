// 데이터는 scripts/update_spac_data.py가 KIND·네이버 증권에서 수집해 자동 생성한다.
const DATA_URL = 'data/spac-stocks.json';
const ALL_MARKETS = '전체';

let allStocks = [];
let selectedMarket = ALL_MARKETS;

// 데이터 로드
async function loadStocks() {
    try {
        const response = await fetch(DATA_URL, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();

        allStocks = data.stocks || [];
        renderMarketFilter();
        renderStats(data);
        renderUpdatedAt(data);
        applyFilters();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        showStatus('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
}

// 데이터에 들어 있는 시장 목록 (코스피/코스닥 등)
function getMarkets() {
    return [...new Set(allStocks.map(stock => stock.market).filter(Boolean))].sort();
}

function renderMarketFilter() {
    const container = document.getElementById('marketFilter');
    const markets = [ALL_MARKETS, ...getMarkets()];

    container.innerHTML = markets.map(market => `
        <button type="button" class="market-btn${market === selectedMarket ? ' active' : ''}" data-market="${escapeHtml(market)}">
            ${escapeHtml(market)}
        </button>
    `).join('');
}

function renderStats(data) {
    const stats = [
        { label: '전체 상장 스팩', value: `${allStocks.length}개` },
        ...getMarkets().map(market => ({
            label: market,
            value: `${allStocks.filter(stock => stock.market === market).length}개`
        })),
        { label: '시세 기준일', value: data.baseDate || '-' }
    ];

    document.getElementById('statsSection').innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-number">${escapeHtml(stat.value)}</div>
            <div class="stat-label">${escapeHtml(stat.label)}</div>
        </div>
    `).join('');
}

function renderUpdatedAt(data) {
    if (!data.updatedAt) {
        return;
    }
    const updatedAt = new Date(data.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    document.getElementById('updatedAt').textContent = `마지막 갱신: ${updatedAt} (KST)`;
}

// 검색·시장 필터·정렬 적용
function applyFilters() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const [sortKey, sortOrder] = document.getElementById('sortSelect').value.split('-');

    const stocks = allStocks
        .filter(stock => selectedMarket === ALL_MARKETS || stock.market === selectedMarket)
        .filter(stock =>
            !keyword ||
            stock.name.toLowerCase().includes(keyword) ||
            stock.code.toLowerCase().includes(keyword)
        )
        .sort((a, b) => compareStocks(a, b, sortKey, sortOrder));

    renderStocks(stocks);
}

// 값이 없는 종목은 정렬 방향과 관계없이 맨 뒤로 보낸다.
function compareStocks(a, b, key, order) {
    const left = a[key];
    const right = b[key];
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;

    const result = typeof left === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'ko');
    return order === 'desc' ? -result : result;
}

// 종목 카드 렌더링
function renderStocks(stocks) {
    const container = document.getElementById('stocksContainer');
    document.getElementById('resultSummary').textContent = `${stocks.length}개 종목`;

    if (stocks.length === 0) {
        container.innerHTML = '';
        showStatus('검색 결과가 없습니다.');
        return;
    }

    hideStatus();
    container.innerHTML = stocks.map(stock => `
        <div class="stock-card">
            <div class="stock-header">
                <div class="stock-name">${escapeHtml(stock.name)}</div>
                <span class="stock-code">${escapeHtml(stock.code)}</span>
                <span class="market-badge">${escapeHtml(stock.market)}</span>
            </div>

            <div class="stock-info">
                <div class="info-item">
                    <div class="info-label">상장일</div>
                    <div class="info-value">${escapeHtml(stock.listingDate || '-')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">종가${stock.priceDate ? ` (${escapeHtml(stock.priceDate.slice(5))})` : ''}</div>
                    <div class="info-value">${formatPrice(stock.close)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">전일 대비</div>
                    <div class="info-value ${changeClass(stock.change)}">${formatChange(stock)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">거래량</div>
                    <div class="info-value">${formatNumber(stock.volume)}</div>
                </div>
            </div>

            <div class="stock-links">
                <a href="https://finance.naver.com/item/main.naver?code=${encodeURIComponent(stock.code)}" target="_blank" rel="noopener" class="link-btn">네이버 증권</a>
            </div>
        </div>
    `).join('');
}

function formatNumber(value) {
    return typeof value === 'number' ? value.toLocaleString('ko-KR') : '-';
}

function formatPrice(value) {
    return typeof value === 'number' ? `${value.toLocaleString('ko-KR')}원` : '-';
}

function formatChange(stock) {
    if (typeof stock.change !== 'number') {
        return '-';
    }
    const arrow = stock.change > 0 ? '▲' : stock.change < 0 ? '▼' : '';
    const rate = typeof stock.changeRate === 'number' ? ` (${stock.changeRate > 0 ? '+' : ''}${stock.changeRate.toFixed(2)}%)` : '';
    return `${arrow}${Math.abs(stock.change).toLocaleString('ko-KR')}${rate}`;
}

function changeClass(change) {
    if (typeof change !== 'number' || change === 0) return '';
    return change > 0 ? 'up' : 'down';
}

function showStatus(message) {
    const status = document.getElementById('statusMessage');
    status.textContent = message;
    status.hidden = false;
}

function hideStatus() {
    document.getElementById('statusMessage').hidden = true;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

// 이벤트 연결
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('sortSelect').addEventListener('change', applyFilters);
    document.getElementById('marketFilter').addEventListener('click', event => {
        const button = event.target.closest('.market-btn');
        if (!button) return;
        selectedMarket = button.dataset.market;
        renderMarketFilter();
        applyFilters();
    });
    loadStocks();
});
