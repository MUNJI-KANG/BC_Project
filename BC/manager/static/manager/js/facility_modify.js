document.addEventListener("DOMContentLoaded", function () {

    /* -------------------------------
     * 1. 기존 시간 JSON 파싱
     * ------------------------------- */
    let raw = document.getElementById("timeJson").textContent.trim();
    console.log(raw)
    let timeData = {};

    try {
        timeData = raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.warn("시간 JSON 파싱 실패. 기본값으로 진행");
        timeData = {};
    }

    /* -------------------------------
     * 2. 요일 리스트
     * ------------------------------- */
    const days = [
        { key: "monday", label: "월요일" },
        { key: "tuesday", label: "화요일" },
        { key: "wednesday", label: "수요일" },
        { key: "thursday", label: "목요일" },
        { key: "friday", label: "금요일" },
        { key: "saturday", label: "토요일" },
        { key: "sunday", label: "일요일" }
    ];

    const container = document.getElementById("timeSettingContainer");


    /* -------------------------------
     * 3. UI 자동 생성
     * ------------------------------- */
    days.forEach(day => {

        if (!timeData[day.key]) {
            timeData[day.key] = {
                open: null,
                close: null,
                interval: 60,
                active: false
            };
        }

        const d = timeData[day.key];
        const isActive = d.active === true;

        const html = `
            <div class="day-row" data-day="${day.key}">
                <h3 class="day-title">${day.label}</h3>

                <label class="active-wrap">
                    <input type="checkbox" class="active-check" ${isActive ? "checked" : ""}>
                    운영함
                </label>

                <div class="time-inputs">
                    <label>시작</label>
                    <input type="time" class="open-time"
                        value="${d.open ?? ""}"
                        ${isActive ? "" : "disabled"}>

                    <label>종료</label>
                    <input type="time" class="close-time"
                        value="${d.close ?? ""}"
                        ${isActive ? "" : "disabled"}>

                    <label>간격(분)</label>
                    <input type="number" class="interval-time"
                        value="${d.interval ?? 60}"
                        min="10" step="10"
                        ${isActive ? "" : "disabled"}>
                </div>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", html);
    });


    /* -------------------------------
     * 4. active 체크 → input 활성/비활성
     * ------------------------------- */
    container.addEventListener("change", function (e) {

        if (!e.target.classList.contains("active-check")) return;

        const row = e.target.closest(".day-row");
        const key = row.dataset.day;
        const isActive = e.target.checked;

        row.querySelectorAll(".open-time, .close-time, .interval-time")
            .forEach(inp => inp.disabled = !isActive);

        timeData[key].active = isActive;

        if (!isActive) {
            timeData[key].open = null;
            timeData[key].close = null;
            timeData[key].interval = null;
        }
    });


    /* -------------------------------
     * 5. input 입력 시 timeData 갱신
     * ------------------------------- */
    container.addEventListener("input", function (e) {

        const row = e.target.closest(".day-row");
        if (!row) return;

        const key = row.dataset.day;

        timeData[key].open = row.querySelector(".open-time").value || null;
        timeData[key].close = row.querySelector(".close-time").value || null;

        let intervalVal = parseInt(row.querySelector(".interval-time").value);
        timeData[key].interval = isNaN(intervalVal) ? null : intervalVal;
    });


    /* -------------------------------
     * 6. 전체 저장 버튼 → JSON 숨겨진 input에 저장
     * ------------------------------- */
    const saveBtn = document.querySelector(".btn-save-all");
    saveBtn.addEventListener("click", function () {

        document.getElementById("reservationTimeInput").value =
            JSON.stringify(timeData);

        console.log("🔥 최종 저장 JSON", timeData);

        // form은 기본 submit 됨
    });



    /* -------------------------------
     * 7. 이미지 미리보기 기능
     * ------------------------------- */
    const photoInput = document.getElementById("photoInput");
    const previewImage = document.getElementById("previewImage");
    const previewPlaceholder = document.getElementById("previewPlaceholder");

    if (photoInput) {
        photoInput.addEventListener("change", function () {

            const file = this.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("이미지 파일만 업로드 가능합니다.");
                return;
            }

            const reader = new FileReader();

            reader.onload = function (e) {

                if (previewPlaceholder) previewPlaceholder.style.display = "none";

                previewImage.style.display = "block";
                previewImage.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });
    }


    /* --------------------------------------------------------
     * 8. 기존 첨부파일 삭제 처리 (X 버튼)
     * -------------------------------------------------------- */
    document.querySelectorAll(".delete-existing-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const fileId = this.dataset.id;

            // UI에서 제거
            this.closest(".attached-item").remove();

            // hidden input 추가
            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = "delete_file";
            hidden.value = fileId;

            document.querySelector("form").appendChild(hidden);
        });
    });


    /* --------------------------------------------------------
     * 9. 새 파일 업로드 (board 방식 동일)
     * -------------------------------------------------------- */
    const newFileInput = document.getElementById("newFileInput");
    const newFileList = document.getElementById("newFileList");
    let selectedFiles = [];

    newFileInput.addEventListener("change", function () {
        Array.from(newFileInput.files).forEach(file => {
            selectedFiles.push(file);
        });
        newFileInput.value = "";
        renderNewFiles();
    });

    function renderNewFiles() {
        newFileList.innerHTML = "";

        selectedFiles.forEach((file, idx) => {
            const div = document.createElement("div");
            div.classList.add("file-item");
            div.style = "display:flex; align-items:center; gap:8px; padding:4px 0;";

            div.innerHTML = `
                <span>${file.name}</span>
                <button type="button" data-index="${idx}" 
                    class="delete-new-btn"
                    style="background:#ff4d4d; color:white; border:none; padding:2px 6px; cursor:pointer; border-radius:3px;">
                    X
                </button>
            `;
            newFileList.appendChild(div);
        });

        document.querySelectorAll(".delete-new-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const idx = this.dataset.index;
                selectedFiles.splice(idx, 1);
                renderNewFiles();
            });
        });
    }


    /* --------------------------------------------------------
     * 10. 폼 submit → FormData 구성 + fetch
     * -------------------------------------------------------- */
    const form = document.getElementById("modifyForm");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        selectedFiles.forEach(file => {
            formData.append("attachment_files", file);
        });

        fetch(form.action, {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (res.redirected) window.location.href = res.url;
        });
    });


    /* --------------------------------------------------------
     * 11. 예약 활성화 toggle
     * -------------------------------------------------------- */
    const rsCheck = document.getElementById("rsPosible");
    const timeBox = document.getElementById("timeSettingBox");
    const reservationHidden = document.getElementById("reservationTimeInput");

    function toggleTimeBox() {
        if (rsCheck.checked) {
            timeBox.classList.remove("time-disabled");
        } else {
            timeBox.classList.add("time-disabled");
            reservationHidden.value = "{}";
        }
    }

    toggleTimeBox();

    rsCheck.addEventListener("change", toggleTimeBox);

});
