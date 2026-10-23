// 데이터는 scripts/update_spac_data.py가 KIND·네이버 증권에서 수집해 자동 생성한다.
const DATA_URL = 'data/spac-stocks.json';
const ALL_MARKETS = '전체';
const TOP_MOVERS_COUNT = 5;

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
        renderTopMovers(data);
        renderMarketFilter();
        renderStats(data);
        renderUpdatedAt(data);
        applyFilters();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        showStatus('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
}

// 전일 대비 등락률의 절댓값이 큰 종목 (같으면 거래량 많은 순)
function getTopMovers(stocks) {
    return stocks
        .filter(stock => typeof stock.changeRate === 'number' && stock.changeRate !== 0)
        .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate) || (b.volume || 0) - (a.volume || 0))
        .slice(0, TOP_MOVERS_COUNT);
}

// 0%를 기준선으로 상승은 오른쪽, 하락은 왼쪽으로 뻗는 가로 막대그래프
function renderTopMovers(data) {
    const section = document.getElementById('moversSection');
    const movers = getTopMovers(allStocks);
    if (movers.length === 0) {
        section.hidden = true;
        return;
    }

    document.getElementById('moversTitle').textContent = `등락률 상위 ${movers.length}종목`;
    document.getElementById('moversCaption').textContent =
        `전일 대비 등락률 절댓값 기준${data.baseDate ? ` · ${data.baseDate} 종가` : ''}`;

    const rates = movers.map(stock => stock.changeRate);
    const min = Math.min(0, ...rates);
    const max = Math.max(0, ...rates);
    const span = max - min;
    const zero = (-min / span) * 100;

    const chart = document.getElementById('moversChart');
    chart.classList.toggle('has-up', max > 0);
    chart.classList.toggle('has-down', min < 0);
    chart.replaceChildren(...movers.map(stock => createMoverRow(stock, zero, span)));

    renderMoversTable(movers);
    section.hidden = false;
}

function createMoverRow(stock, zero, span) {
    const isUp = stock.changeRate > 0;
    const width = (Math.abs(stock.changeRate) / span) * 100;

    const row = document.createElement('div');
    row.className = 'mover-row';
    row.tabIndex = 0;
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${stock.name} ${formatChange(stock)}`);

    const name = document.createElement('div');
    name.className = 'mover-name';
    name.textContent = stock.name;

    const baseline = document.createElement('div');
    baseline.className = 'mover-baseline';
    baseline.style.left = `${zero}%`;

    const bar = document.createElement('div');
    bar.className = `mover-bar ${isUp ? 'up' : 'down'}`;
    bar.style.width = `${width}%`;

    const value = document.createElement('span');
    value.className = `mover-value ${isUp ? 'up' : 'down'}`;
    value.textContent = formatRate(stock.changeRate);

    if (isUp) {
        bar.style.left = `${zero}%`;
        value.style.left = `${zero + width}%`;
    } else {
        bar.style.right = `${100 - zero}%`;
        value.style.right = `${100 - zero + width}%`;
    }

    const inner = document.createElement('div');
    inner.className = 'mover-plot-inner';
    inner.append(baseline, bar, value);

    const plot = document.createElement('div');
    plot.className = 'mover-plot';
    plot.append(inner);

    row.append(name, plot);

    row.addEventListener('pointerenter', event => showMoverTooltip(stock, event.clientX, event.clientY));
    row.addEventListener('pointermove', event => positionTooltip(event.clientX, event.clientY));
    row.addEventListener('pointerleave', hideMoverTooltip);
    row.addEventListener('focus', () => {
        const rect = bar.getBoundingClientRect();
        showMoverTooltip(stock, rect.right, rect.bottom);
    });
    row.addEventListener('blur', hideMoverTooltip);
    return row;
}

function showMoverTooltip(stock, x, y) {
    const tooltip = document.getElementById('moversTooltip');

    const key = document.createElement('span');
    key.className = `tooltip-key ${stock.changeRate > 0 ? 'up' : 'down'}`;
    const value = document.createElement('div');
    value.className = 'tooltip-value';
    value.append(key, formatRate(stock.changeRate));

    const lines = [
        stock.name,
        `전일 대비 ${typeof stock.change === 'number' ? `${formatChangeAmount(stock.change)}원` : '-'}`,
        `종가 ${formatPrice(stock.close)}`,
        `거래량 ${formatNumber(stock.volume)}`
    ].map((text, index) => {
        const line = document.createElement('div');
        line.className = index === 0 ? 'tooltip-name' : 'tooltip-detail';
        line.textContent = text;
        return line;
    });

    tooltip.replaceChildren(value, ...lines);
    tooltip.hidden = false;
    positionTooltip(x, y);
}

function positionTooltip(x, y) {
    const tooltip = document.getElementById('moversTooltip');
    if (tooltip.hidden) return;

    const offset = 14;
    const { offsetWidth: width, offsetHeight: height } = tooltip;
    const left = Math.min(x + offset, window.innerWidth - width - 8);
    const top = y + offset + height > window.innerHeight ? y - height - offset : y + offset;
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
}

function hideMoverTooltip() {
    document.getElementById('moversTooltip').hidden = true;
}

function renderMoversTable(movers) {
    const rows = movers.map(stock => {
        const tr = document.createElement('tr');
        [stock.name, formatChange(stock), formatPrice(stock.close), formatNumber(stock.volume)].forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            tr.append(td);
        });
        return tr;
    });
    document.querySelector('#moversTable tbody').replaceChildren(...rows);
}

function toggleMoversTable(event) {
    const button = event.currentTarget;
    const showTable = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(showTable));
    button.textContent = showTable ? '차트로 보기' : '표로 보기';
    document.getElementById('moversChart').hidden = showTable;
    document.getElementById('moversLegend').hidden = showTable;
    document.getElementById('moversTable').hidden = !showTable;
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

function formatRate(rate) {
    return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`;
}

function formatChangeAmount(change) {
    const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '';
    return `${arrow}${Math.abs(change).toLocaleString('ko-KR')}`;
}

function formatChange(stock) {
    if (typeof stock.change !== 'number') {
        return '-';
    }
    const rate = typeof stock.changeRate === 'number' ? ` (${formatRate(stock.changeRate)})` : '';
    return `${formatChangeAmount(stock.change)}${rate}`;
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
    document.getElementById('moversTableToggle').addEventListener('click', toggleMoversTable);
    document.getElementById('marketFilter').addEventListener('click', event => {
        const button = event.target.closest('.market-btn');
        if (!button) return;
        selectedMarket = button.dataset.market;
        renderMarketFilter();
        applyFilters();
    });
    loadStocks();
});
