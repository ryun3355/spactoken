// SPAC 관련주 데이터
let allStocks = [];
let filteredStocks = [];
let currentSearch = '';

// 데이터 로드
async function loadStocks() {
    try {
        const response = await fetch('data/spac-stocks.json');
        allStocks = await response.json();
        filteredStocks = allStocks;
        renderStocks();
        updateStats();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
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
