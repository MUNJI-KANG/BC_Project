// ============================================
// 모바일 메뉴 토글
// ============================================
function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.querySelector('.header__nav');
  const overlay = document.getElementById('mobileMenuOverlay');
  const navItems = document.querySelectorAll('.header__nav-item');

  if (!menuBtn || !nav || !overlay) return;

  // 햄버거 메뉴 버튼 클릭
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });

  // 오버레이 클릭 시 메뉴 닫기
  overlay.addEventListener('click', () => {
    menuBtn.classList.remove('active');
    nav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
  });

  // 모바일 메뉴 아이템 클릭 (서브메뉴 토글)
  navItems.forEach(item => {
    const link = item.querySelector('.header__nav-link');
    if (link) {
      link.addEventListener('click', (e) => {
        // 데스크탑에서는 기본 동작 유지
        if (window.innerWidth > 768) return;
        
        // 모바일에서는 서브메뉴가 있는 경우에만 토글
        const submenu = item.querySelector('.header__submenu');
        if (submenu) {
          e.preventDefault();
          item.classList.toggle('active');
        }
      });
    }
  });

  // 화면 크기 변경 시 메뉴 닫기
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      menuBtn.classList.remove('active');
      nav.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
}

// DOM이 로드된 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
  // DOM이 이미 로드된 경우
  initMobileMenu();
}
