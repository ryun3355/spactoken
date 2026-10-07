// SPAC 관련주 데이터
let allStocks = [];
let filteredStocks = [];
let currentStatusFilter = 'all';

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
            
            <div class="stock-description">${stock.description}</div>
            
            <div class="stock-info">
                <div class="info-item">
                    <div class="info-label">상장 상태</div>
                    <div class="info-value">${stock.status}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">기업 분야</div>
                    <div class="info-value">${stock.sector}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">공시일</div>
                    <div class="info-value">${stock.announcementDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">주요 주주</div>
                    <div class="info-value">${stock.mainShareholder}</div>
                </div>
            </div>
            
            <span class="stock-status ${getStatusClass(stock.status)}">${stock.status}</span>
            
            <div class="stock-links" style="margin-top: 15px;">
                ${stock.newsLink ? `<a href="${stock.newsLink}" target="_blank" class="link-btn">뉴스</a>` : ''}
                ${stock.filingLink ? `<a href="${stock.filingLink}" target="_blank" class="link-btn">공시</a>` : ''}
            </div>
        </div>
    `).join('');
}

// 상태에 따른 CSS 클래스 반환
function getStatusClass(status) {
    if (status === '상장') return 'status-listed';
    if (status === '상장예정') return 'status-pending';
    if (status === '검토중') return 'status-review';
    return '';
}

// 검색 필터링
function filterStocks() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    
    filteredStocks = allStocks.filter(stock => {
        const matchesSearch = 
            stock.name.toLowerCase().includes(searchValue) ||
            stock.code.toLowerCase().includes(searchValue) ||
            stock.description.toLowerCase().includes(searchValue);
        
        const matchesStatus = currentStatusFilter === 'all' || stock.status === currentStatusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderStocks();
    updateStats();
}

// 상태별 필터링
function filterByStatus(status) {
    currentStatusFilter = status;
    
    // 버튼 활성화 상태 업데이트
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    filterStocks();
}

// 통계 업데이트
function updateStats() {
    const total = allStocks.length;
    const listed = allStocks.filter(s => s.status === '상장').length;
    const pending = allStocks.filter(s => s.status === '상장예정').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('listedCount').textContent = listed;
    document.getElementById('pendingCount').textContent = pending;
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', loadStocks);