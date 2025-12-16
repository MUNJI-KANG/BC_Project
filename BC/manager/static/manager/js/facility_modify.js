document.addEventListener("DOMContentLoaded", function () {

    /* -------------------------------
     * 1. 기존 시간 JSON 파싱
     * ------------------------------- */
    let raw = document.getElementById("timeJson")?.textContent.trim();
    let timeData = {};

    try {
        timeData = raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.warn("시간 JSON 파싱 실패. 기본값 사용");
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
                payment: null,
                active: false
            };
        }

        const d = timeData[day.key];
        const isActive = d.active === true;

        const displayPay = d.payment
            ? "₩ " + Number(d.payment).toLocaleString("ko-KR")
            : "";

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

                    <label>요금</label>
                    <input type="text" class="interval-pay"
                        value="${displayPay}"
                        ${isActive ? "" : "disabled"}>
                </div>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", html);
    });

    /* -------------------------------
     * 4. 운영 체크 → 활성/비활성
     * ------------------------------- */
    container.addEventListener("change", function (e) {
        if (!e.target.classList.contains("active-check")) return;

        const row = e.target.closest(".day-row");
        const key = row.dataset.day;
        const isActive = e.target.checked;

        row.querySelectorAll(
            ".open-time, .close-time, .interval-time, .interval-pay"
        ).forEach(inp => inp.disabled = !isActive);

        timeData[key].active = isActive;

        if (!isActive) {
            timeData[key].open = null;
            timeData[key].close = null;
            timeData[key].interval = null;
            timeData[key].payment = null;
        }
    });

    /* -------------------------------
     * 5. 입력값 처리 (시간 / 간격 / 요금)
     * ------------------------------- */
    container.addEventListener("input", function (e) {

        const row = e.target.closest(".day-row");
        if (!row) return;

        const key = row.dataset.day;

        // 시작 / 종료
        timeData[key].open = row.querySelector(".open-time").value || null;
        timeData[key].close = row.querySelector(".close-time").value || null;

        // 간격
        const intervalVal = parseInt(row.querySelector(".interval-time").value);
        timeData[key].interval = isNaN(intervalVal) ? null : intervalVal;

        // 💰 요금 (여기만 포맷)
        if (e.target.classList.contains("interval-pay")) {
            let raw = e.target.value.replace(/[^\d]/g, "");

            if (raw === "") {
                e.target.value = "";
                timeData[key].payment = null;
                return;
            }

            e.target.value = "₩ " + Number(raw).toLocaleString("ko-KR");
            timeData[key].payment = raw;
        }
    });

    /* -------------------------------
     * 6. 저장 버튼 → JSON 저장
     * ------------------------------- */
    const saveBtn = document.querySelector(".btn-save-all");
    saveBtn.addEventListener("click", function () {
        document.getElementById("reservationTimeInput").value =
            JSON.stringify(timeData);
    });

    /* -------------------------------
     * 7. 이미지 미리보기
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

    /* -------------------------------
     * 8. 폼 submit (첨부파일 포함)
     * ------------------------------- */
    const form = document.getElementById("modifyForm");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        // fileupload.js에서 관리되는 selectedFiles 그대로 사용
        if (typeof selectedFiles !== "undefined") {
            selectedFiles.forEach(file => {
                formData.append("attachment_files", file);
            });
        }

        fetch(form.action, {
            method: "POST",
            body: formData
        }).then(res => {
            if (res.redirected) window.location.href = res.url;
        });
    });

    /* -------------------------------
     * 9. 예약 활성화 토글
     * ------------------------------- */
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
