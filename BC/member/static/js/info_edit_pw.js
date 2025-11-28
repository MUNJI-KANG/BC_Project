// DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", () => {
    // 비밀번호 수정 버튼만 정확히 선택
    const btnEditCom = document.querySelector(".password-btn-box button");

    if (!btnEditCom) return;   // 안전장치

    btnEditCom.addEventListener("click", function (e) {
        e.preventDefault();    // form 기본 submit 막기
        console.log("비밀번호 수정 클릭됨");
        handleEditProfile();
    });
});

// -----------------------------
// 함수 분리
// -----------------------------
function handleEditProfile() {
    // 예시: 수정 완료 후 마이페이지로 이동
    window.location.href = "/member/info/";
}