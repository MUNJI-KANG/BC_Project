document.addEventListener('DOMContentLoaded', function () {

    /* ===========================================
       기존 파일 삭제 기능
    ============================================ */
    document.querySelectorAll(".delete-existing-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const fileId = this.dataset.fileId;

            this.parentElement.remove();

            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = "delete_files";
            hidden.value = fileId;

            document.querySelector("form").appendChild(hidden);
        });
    });


    /* ===========================================
       새 파일 관리
    ============================================ */

    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    let selectedFiles = [];

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            Array.from(fileInput.files).forEach(file => {
                selectedFiles.push(file);
            });
            fileInput.value = "";
            renderFileList();
        });
    }

    function renderFileList() {
        if (!fileList) return;

        fileList.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.style = "display:flex; align-items:center; gap:8px; padding:4px 0;";

            item.innerHTML = `
                <span>${file.name}</span>
                <button type="button" class="delete-file-btn" data-index="${index}"
                    style="background:#ff4d4d; color:white; border:none; padding:2px 6px; cursor:pointer; border-radius:3px;">
                    X
                </button>
            `;
            fileList.appendChild(item);
        });

        document.querySelectorAll(".delete-file-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const idx = this.dataset.index;
                selectedFiles.splice(idx, 1);
                renderFileList();
            });
        });
    }


    /* ===========================================
       폼 submit (AJAX 적용)
    ============================================ */

    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);

            selectedFiles.forEach(file => {
                formData.append("file", file);
            });

            fetch(form.action, {
                method: "POST",
                body: formData
            })
            .then(res => {
                if (res.redirected) window.location.href = res.url;
            });
        });
    }


    /* ===========================================
       공지 설정 UI (핵심)
    ============================================ */

    const pinTopCheckbox   = document.querySelector("input[name='pin_top']");
    const noticeSection    = document.querySelector(".notice-section");   // 공지기간 전체 영역
    const noticeTypeRadios = document.querySelectorAll("input[name='notice_type']");
    const dateSection      = document.getElementById("date-section");
    const startDateInput   = document.querySelector("input[name='start_date']");
    const endDateInput     = document.querySelector("input[name='end_date']");


    if (!pinTopCheckbox || !noticeSection) return;


    /* ---- 공지 방식 라디오 변경 ---- */
    function toggleDateInputs() {
        const checked = document.querySelector("input[name='notice_type']:checked");

        if (!checked) return;

        if (checked.value === "always") {
            // 상시공지 → 날짜 숨김
            dateSection.classList.add("hidden");
            startDateInput.disabled = true;
            endDateInput.disabled = true;
        } else {
            // 기간공지 → 날짜 표시
            dateSection.classList.remove("hidden");
            startDateInput.disabled = false;
            endDateInput.disabled = false;
        }
    }


    /* ---- 상단 고정 체크박스 변경 ---- */
    function toggleNoticeSection() {
        const isPinned = pinTopCheckbox.checked;

        if (!isPinned) {
            // 상단고정 해제 → 전체 숨김
            noticeSection.classList.add("hidden");
            dateSection.classList.add("hidden");

            noticeTypeRadios.forEach(r => r.disabled = true);
            startDateInput.disabled = true;
            endDateInput.disabled = true;
        } else {
            // 상단고정 활성 → 공지기간 표시
            noticeSection.classList.remove("hidden");

            noticeTypeRadios.forEach(r => r.disabled = false);

            toggleDateInputs(); // 라디오 상태에 따라 날짜 영역 조절
        }
    }


    /* 이벤트 바인딩 */
    pinTopCheckbox.addEventListener("change", toggleNoticeSection);
    noticeTypeRadios.forEach(radio => {
        radio.addEventListener("change", toggleDateInputs);
    });

    /* 초기 상태 UI 맞추기 */
    toggleNoticeSection();
});
