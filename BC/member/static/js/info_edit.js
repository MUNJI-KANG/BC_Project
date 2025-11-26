// DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", () => {
    const btnEditCom = document.querySelector(".btn-edit-complete");

    // 3) 정보 수정 완료
    btnEditCom.addEventListener("click", function() {
        // console.log("정보 수정 클릭됨");
        handleEditComProfile();
    });
});

// -----------------------------
// 함수 분리 (필요 시 기능 바로 추가 가능)
// -----------------------------

function handleEditComProfile() {
    // 예시: 수정 페이지로 이동
    window.location.href = "/member/info/";

    // 또는 모달 열기, 입력 필드 활성화 등 여기 넣으면 됨
    // alert("정보 수정 기능 준비중");
}