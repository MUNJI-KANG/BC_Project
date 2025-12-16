document.addEventListener("DOMContentLoaded", function () {

    /* -------------------------------
     * 1. 기존 시간 JSON 파싱 및 데이터 구조 변환
     * ------------------------------- */
    let raw = document.getElementById("timeJson")?.textContent.trim();
    let timeData = {};

    try {
        const parsed = raw ? JSON.parse(raw) : {};
        
        // 기존 구조를 새 구조로 변환
        // 기존: { monday: { open, close, interval, payment, active } }
        // 새: { monday: { slots: [{ start, end, interval, payment }], active }, dateExceptions: [...] }
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        
        // slots 구조가 있으면 사용, 없으면 기존 구조 변환
        if (parsed.slots && typeof parsed.slots === 'object') {
            // 새 구조: parsed.slots.monday = [...]
            days.forEach(day => {
                if (parsed.slots[day] && Array.isArray(parsed.slots[day])) {
                    timeData[day] = {
                        slots: parsed.slots[day],
                        active: parsed[day]?.active !== false
                    };
                } else {
                    timeData[day] = {
                        slots: [],
                        active: false
                    };
                }
            });
        } else {
            // 기존 구조: parsed.monday = { open, close, ... }
            days.forEach(day => {
                if (parsed[day]) {
                    const old = parsed[day];
                    if (old.open && old.close) {
                        // 기존 구조 → 새 구조로 변환
                        timeData[day] = {
                            slots: [{
                                start: old.open,
                                end: old.close,
                                interval: old.interval || 60,
                                payment: old.payment || null
                            }],
                            active: old.active === true
                        };
                    } else {
                        timeData[day] = {
                            slots: [],
                            active: false
                        };
                    }
                } else {
                    timeData[day] = {
                        slots: [],
                        active: false
                    };
                }
            });
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:data-init:complete',message:'timeData initialization complete',data:{timeDataKeys:Object.keys(timeData),mondaySlots:timeData.monday?.slots?.length,tuesdaySlots:timeData.tuesday?.slots?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // 날짜별 예외는 제거 (우측 패널이 활성화된 요일 표시로 변경됨)
        
    } catch (e) {
        console.warn("시간 JSON 파싱 실패. 기본값 사용", e);
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        days.forEach(day => {
            timeData[day] = { slots: [], active: false };
        });
        // 날짜별 예외는 제거
    }

    /* -------------------------------
     * 2. DOM 요소
     * ------------------------------- */
    const dayTabs = document.querySelectorAll(".day-tab");
    const timeSlotsList = document.getElementById("timeSlotsList");
    const btnAddSlot = document.getElementById("btnAddSlot");
    const activeDaysSummary = document.getElementById("activeDaysSummary");
    const reservationHidden = document.getElementById("reservationTimeInput");

    let currentDay = null; // 기본 선택 요일 (표시용) - 초기에는 비어있음
    let selectedDays = new Set(); // 다중 선택된 요일들 - 초기에는 비어있음

    /* -------------------------------
     * 3. 요일 탭 전환 (단순 클릭 토글 방식 - 예약 화면처럼)
     * ------------------------------- */
    dayTabs.forEach(tab => {
        tab.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const day = this.dataset.day;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:dayTab-click:entry',message:'day tab clicked',data:{day:day,selectedDaysHasDay:selectedDays.has(day),timeDataDayExists:!!timeData[day],timeDataDaySlots:timeData[day]?.slots?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
            // #endregion
            
            // 단순 클릭 토글 (예약 화면의 시간 선택처럼)
            if (selectedDays.has(day)) {
                // 이미 선택된 요일이면 해제
                selectedDays.delete(day);
                this.classList.remove("active");
                
                // 모든 요일이 해제되면 빈 상태로 유지
                if (selectedDays.size === 0) {
                    currentDay = null;
                    timeSlotsList.innerHTML = `
                        <div class="no-slots-message">요일을 선택해주세요.</div>
                    `;
                } else {
                    // 다른 선택된 요일 중 하나를 표시
                    const firstSelected = Array.from(selectedDays)[0];
                    currentDay = firstSelected;
                    renderTimeSlots(firstSelected);
                }
            } else {
                // 선택되지 않은 요일이면 추가
                selectedDays.add(day);
                this.classList.add("active");
                currentDay = day;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:dayTab-click:add-day',message:'adding day to selection',data:{day:day,timeDataDayExists:!!timeData[day],timeDataDay:timeData[day],selectedDaysSize:selectedDays.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,E'})}).catch(()=>{});
                // #endregion
                renderTimeSlots(day);
            }
            
            // 다중 선택 상태 업데이트
            updateMultiSelectUI();
            // 활성화된 요일과 시간 표시 업데이트
            updateActiveDaysSummary();
        });
    });
    
    /* -------------------------------
     * 3-1. 다중 선택 UI 업데이트
     * ------------------------------- */
    function updateMultiSelectUI() {
        const multiSelectActions = document.getElementById("multiSelectActions");
        const singleDayAddSection = document.getElementById("singleDayAddSection");
        const selectedDaysCount = document.getElementById("selectedDaysCount");
        
        if (selectedDays.size > 1) {
            // 다중 선택 모드
            multiSelectActions.style.display = "block";
            singleDayAddSection.style.display = "none";
            selectedDaysCount.textContent = selectedDays.size;
        } else if (selectedDays.size === 1) {
            // 단일 선택 모드
            multiSelectActions.style.display = "none";
            singleDayAddSection.style.display = "block";
            const day = Array.from(selectedDays)[0];
            currentDay = day;
            renderTimeSlots(day);
        } else {
            // 선택 없음
            multiSelectActions.style.display = "none";
            singleDayAddSection.style.display = "none";
        }
    }
    
    /* -------------------------------
     * 3-2. 활성화된 요일과 시간 표시 업데이트
     * ------------------------------- */
    function updateActiveDaysSummary() {
        if (!activeDaysSummary) return;
        
        // 예약 비활성화 상태면 비우기
        const rsCheck = document.getElementById("rsPosible");
        if (!rsCheck || !rsCheck.checked) {
            activeDaysSummary.innerHTML = `
                <div class="no-active-days">예약하기가 비활성화되어 있습니다.</div>
            `;
            return;
        }
        
        const dayLabels = {
            "sunday": "일요일",
            "monday": "월요일",
            "tuesday": "화요일",
            "wednesday": "수요일",
            "thursday": "목요일",
            "friday": "금요일",
            "saturday": "토요일"
        };
        
        const activeDays = [];
        // 월요일부터 시작하도록 순서 변경
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        
        days.forEach(day => {
            const dayData = timeData[day];
            // slots가 있고, 실제로 시간이 설정된 구간이 있는 경우만 표시
            if (dayData && dayData.slots && Array.isArray(dayData.slots) && dayData.slots.length > 0) {
                // 유효한 시간 구간만 필터링 (start와 end가 모두 있는 경우)
                const validSlots = dayData.slots.filter(slot => 
                    slot && slot.start && slot.end && slot.start.trim() !== "" && slot.end.trim() !== ""
                );
                
                if (validSlots.length > 0) {
                    const slots = validSlots.map((slot, index) => {
                        const payment = slot.payment && slot.payment !== null && slot.payment !== "" 
                            ? ` (₩${Number(slot.payment).toLocaleString("ko-KR")})` 
                            : "";
                        return `${slot.start} ~ ${slot.end}${payment}`;
                    }).join(", ");
                    
                    activeDays.push({
                        day: day,
                        label: dayLabels[day],
                        slots: slots,
                        validSlots: validSlots
                    });
                }
            }
        });
        
        // 기존 내용 완전히 제거 후 새로 렌더링 (누적 방지)
        activeDaysSummary.innerHTML = "";
        
        if (activeDays.length === 0) {
            activeDaysSummary.innerHTML = `
                <div class="no-active-days">설정된 예약 가능 시간이 없습니다.</div>
            `;
            return;
        }
        
        // 정렬된 순서로 표시 (삭제 버튼 포함)
        activeDays.forEach(item => {
            const div = document.createElement("div");
            div.className = "active-day-item";
            div.setAttribute("data-day", item.day);
            div.innerHTML = `
                <div class="active-day-header">
                    <div class="active-day-label">${item.label}</div>
                    <button type="button" class="btn-delete-day" data-day="${item.day}" title="이 요일의 모든 시간 구간 삭제">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                            <path d="M3 4h10M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2m-5 4v4m4-4v4M5 4l1 8a1 1 0 001 1h4a1 1 0 001-1l1-8" stroke-width="1.5"/>
                        </svg>
                    </button>
                </div>
                <div class="active-day-slots">${item.slots}</div>
            `;
            activeDaysSummary.appendChild(div);
        });
        
        // 삭제 버튼 이벤트 리스너 추가
        activeDaysSummary.querySelectorAll(".btn-delete-day").forEach(btn => {
            btn.addEventListener("click", function () {
                const day = this.dataset.day;
                if (confirm(`${dayLabels[day]}의 모든 시간 구간을 삭제하시겠습니까?`)) {
                    // 해당 요일의 모든 슬롯 삭제
                    if (timeData[day]) {
                        timeData[day].slots = [];
                        timeData[day].active = false;
                    }
                    
                    // 선택된 요일에서도 제거
                    selectedDays.delete(day);
                    const dayTab = document.querySelector(`.day-tab[data-day="${day}"]`);
                    if (dayTab) {
                        dayTab.classList.remove("active");
                    }
                    
                    // 현재 표시 중인 요일이 삭제된 요일이면 다른 요일로 변경
                    if (currentDay === day && selectedDays.size > 0) {
                        currentDay = Array.from(selectedDays)[0];
                        renderTimeSlots(currentDay);
                    } else if (currentDay === day) {
                        // 삭제된 요일이 현재 표시 중인 요일이면 비어있는 상태로
                        currentDay = null;
                        renderTimeSlots(null);
                    }
                    
                    updateReservationTime();
                    updateActiveDaysSummary();
                    updateMultiSelectUI();
                }
            });
        });
    }

    /* -------------------------------
     * 4. 시간 구간 렌더링
     * ------------------------------- */
    function renderTimeSlots(day) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:renderTimeSlots:entry',message:'renderTimeSlots called',data:{day:day,timeDataExists:!!timeData[day],timeDataDay:timeData[day]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
        // #endregion
        
        if (!day) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:renderTimeSlots:null-check',message:'day is null',data:{day:day},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            timeSlotsList.innerHTML = `
                <div class="no-slots-message">요일을 선택해주세요.</div>
            `;
            return;
        }
        
        const dayData = timeData[day];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:renderTimeSlots:dayData-check',message:'dayData retrieved',data:{day:day,dayDataExists:!!dayData,dayData:dayData,slotsLength:dayData?.slots?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
        // #endregion
        
        const slots = dayData.slots || [];
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:renderTimeSlots:slots-check',message:'slots array check',data:{day:day,slotsLength:slots.length,slots:slots},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,D'})}).catch(()=>{});
        // #endregion
        
        if (slots.length === 0) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:renderTimeSlots:empty-slots',message:'showing empty slots with add button hint',data:{day:day,slotsLength:0},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'A,D'})}).catch(()=>{});
            // #endregion
            // 빈 배열일 때는 안내 메시지와 함께 표시 (추가 버튼은 HTML에 항상 있으므로 사용 가능)
            timeSlotsList.innerHTML = `
                <div class="no-slots-message">아래 + 버튼을 클릭하여 시간 구간을 추가하세요.</div>
            `;
            // return하지 않음 - 추가 버튼이 이미 DOM에 있으므로 사용자가 시간을 추가할 수 있음
            return;
        }
        
        timeSlotsList.innerHTML = slots.map((slot, index) => `
            <div class="time-slot-row" data-index="${index}">
                <div class="time-range-inputs">
                    <input type="time" class="slot-start" value="${slot.start || ''}" data-index="${index}">
                    <span class="time-separator">~</span>
                    <input type="time" class="slot-end" value="${slot.end || ''}" data-index="${index}">
                </div>
                <div class="slot-actions">
                    <button type="button" class="btn-delete-slot" data-index="${index}" title="삭제">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                            <path d="M3 4h10M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2m-5 4v4m4-4v4M5 4l1 8a1 1 0 001 1h4a1 1 0 001-1l1-8" stroke-width="1.5"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join("");
        
        // 이벤트 리스너 추가
        timeSlotsList.querySelectorAll(".slot-start, .slot-end").forEach(input => {
            input.addEventListener("change", function () {
                const index = parseInt(this.dataset.index);
                const slot = timeData[day].slots[index];
                if (this.classList.contains("slot-start")) {
                    slot.start = this.value;
                } else {
                    slot.end = this.value;
                }
                updateReservationTime();
                updateActiveDaysSummary();
            });
        });
        
        timeSlotsList.querySelectorAll(".btn-delete-slot").forEach(btn => {
            btn.addEventListener("click", function () {
                const index = parseInt(this.dataset.index);
                deleteTimeSlot(day, index);
            });
        });
    }

    /* -------------------------------
     * 5. 단일 요일 시간 및 요금 추가
     * ------------------------------- */
    const btnSingleAdd = document.getElementById("btnSingleAdd");
    const singleStartTime = document.getElementById("singleStartTime");
    const singleEndTime = document.getElementById("singleEndTime");
    const singlePayment = document.getElementById("singlePayment");
    
    // 단일 요일 요금 입력 포맷팅
    if (singlePayment) {
        singlePayment.addEventListener("input", function (e) {
            let raw = this.value.replace(/[^\d]/g, "");
            
            if (raw === "") {
                this.value = "0";
                return;
            }
            
            const numValue = Number(raw);
            if (!isNaN(numValue)) {
                this.value = "₩ " + numValue.toLocaleString("ko-KR");
            }
        });
        
        singlePayment.addEventListener("blur", function () {
            let raw = this.value.replace(/[^\d]/g, "");
            if (raw === "" || raw === "0") {
                this.value = "0";
            } else {
                this.value = "₩ " + Number(raw).toLocaleString("ko-KR");
            }
        });
        
        singlePayment.addEventListener("focus", function () {
            let raw = this.value.replace(/[^\d]/g, "");
            this.value = raw === "" || raw === "0" ? "0" : raw;
        });
    }
    
    if (btnSingleAdd) {
        btnSingleAdd.addEventListener("click", function () {
            if (selectedDays.size !== 1) {
                alert("요일을 하나만 선택해주세요.");
                return;
            }
            
            const day = currentDay;
            if (!day) {
                alert("요일을 선택해주세요.");
                return;
            }
            
            const start = singleStartTime.value;
            const end = singleEndTime.value;
            
            if (!start || !end) {
                alert("시작 시간과 종료 시간을 모두 입력해주세요.");
                return;
            }
            
            if (start >= end) {
                alert("시작 시간은 종료 시간보다 빨라야 합니다.");
                return;
            }
            
            // 요금 추출 (기본값 0원)
            let paymentValue = singlePayment.value.trim();
            const paymentRaw = paymentValue.replace(/[^\d]/g, "");
            const payment = paymentRaw === "" || paymentRaw === "0" ? "0" : paymentRaw;
            
            if (!timeData[day].slots) {
                timeData[day].slots = [];
            }
            
            // 중복 체크
            const isDuplicate = timeData[day].slots.some(slot => 
                slot.start === start && slot.end === end
            );
            
            if (!isDuplicate) {
                timeData[day].slots.push({
                    start: start,
                    end: end,
                    interval: 60,
                    payment: payment
                });
            } else {
                // 중복이면 요금만 업데이트
                const existingSlot = timeData[day].slots.find(slot => 
                    slot.start === start && slot.end === end
                );
                if (existingSlot) {
                    existingSlot.payment = payment;
                }
            }
            
            // 시간 구간이 추가되면 해당 요일을 활성화
            timeData[day].active = true;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:btnSingleAdd:after-add',message:'single day slot added',data:{day:day,slotsLength:timeData[day].slots.length,active:timeData[day].active},timestamp:Date.now(),sessionId:'debug-session',runId:'data-check',hypothesisId:'active'})}).catch(()=>{});
            // #endregion
            
            renderTimeSlots(day);
            updateReservationTime();
            updateActiveDaysSummary();
        });
    }
    
    /* -------------------------------
     * 5-1. 일괄 시간 및 요금 추가 (다중 선택된 요일들)
     * ------------------------------- */
    const btnBatchAdd = document.getElementById("btnBatchAdd");
    const batchStartTime = document.getElementById("batchStartTime");
    const batchEndTime = document.getElementById("batchEndTime");
    const batchPayment = document.getElementById("batchPayment");
    
    // 요금 입력 포맷팅 (숫자만 입력해도 자동 원화 표시)
    if (batchPayment) {
        batchPayment.addEventListener("input", function (e) {
            let raw = this.value.replace(/[^\d]/g, "");
            
            if (raw === "") {
                this.value = "0";
                return;
            }
            
            // 숫자만 있으면 자동으로 원화 표시 적용
            const numValue = Number(raw);
            if (!isNaN(numValue)) {
                this.value = "₩ " + numValue.toLocaleString("ko-KR");
            }
        });
        
        // 포커스 아웃 시에도 포맷팅 적용
        batchPayment.addEventListener("blur", function () {
            let raw = this.value.replace(/[^\d]/g, "");
            if (raw === "" || raw === "0") {
                this.value = "0";
            } else {
                this.value = "₩ " + Number(raw).toLocaleString("ko-KR");
            }
        });
        
        // 포커스 인 시 숫자만 표시
        batchPayment.addEventListener("focus", function () {
            let raw = this.value.replace(/[^\d]/g, "");
            this.value = raw === "" || raw === "0" ? "0" : raw;
        });
    }
    
    if (btnBatchAdd) {
        btnBatchAdd.addEventListener("click", function () {
            if (selectedDays.size < 2) {
                alert("여러 요일을 선택해주세요.");
                return;
            }
            
            const start = batchStartTime.value;
            const end = batchEndTime.value;
            
            if (!start || !end) {
                alert("시작 시간과 종료 시간을 모두 입력해주세요.");
                return;
            }
            
            if (start >= end) {
                alert("시작 시간은 종료 시간보다 빨라야 합니다.");
                return;
            }
            
            // 요금 추출 (기본값 0원)
            let paymentValue = batchPayment.value.trim();
            const paymentRaw = paymentValue.replace(/[^\d]/g, "");
            const payment = paymentRaw === "" || paymentRaw === "0" ? "0" : paymentRaw;
            
            // 선택된 모든 요일에 동일한 시간 구간 및 요금 추가
            selectedDays.forEach(day => {
                if (!timeData[day].slots) {
                    timeData[day].slots = [];
                }
                
                // 중복 체크 (동일한 시간 구간이 이미 있는지)
                const isDuplicate = timeData[day].slots.some(slot => 
                    slot.start === start && slot.end === end
                );
                
                if (!isDuplicate) {
                    timeData[day].slots.push({
                        start: start,
                        end: end,
                        interval: 60,
                        payment: payment
                    });
                } else {
                    // 중복이면 요금만 업데이트
                    const existingSlot = timeData[day].slots.find(slot => 
                        slot.start === start && slot.end === end
                    );
                    if (existingSlot) {
                        existingSlot.payment = payment;
                    }
                }
                
                // 시간 구간이 추가되면 해당 요일을 활성화
                timeData[day].active = true;
            });
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:btnBatchAdd:after-add',message:'batch slots added',data:{selectedDaysSize:selectedDays.size,firstDay:Array.from(selectedDays)[0],firstDayActive:timeData[Array.from(selectedDays)[0]]?.active},timestamp:Date.now(),sessionId:'debug-session',runId:'data-check',hypothesisId:'active'})}).catch(()=>{});
            // #endregion
            
            // 추가 완료 후 선택된 요일 모두 해제
            const selectedDaysArray = Array.from(selectedDays);
            selectedDays.clear();
            dayTabs.forEach(tab => {
                tab.classList.remove("active");
            });
            
            // 비어있는 상태로 초기화
            currentDay = null;
            renderTimeSlots(null);
            
            // 다중 선택 UI 숨기기
            updateMultiSelectUI();
            
            // 데이터 업데이트
            updateReservationTime();
            updateActiveDaysSummary();
            
            alert(`${selectedDaysArray.length}개 요일에 시간 구간이 추가되었습니다.`);
        });
    }

    /* -------------------------------
     * 6. 시간 구간 삭제
     * ------------------------------- */
    function deleteTimeSlot(day, index) {
        if (timeData[day].slots && timeData[day].slots[index]) {
            timeData[day].slots.splice(index, 1);
            renderTimeSlots(day);
            updateReservationTime();
            updateActiveDaysSummary();
        }
    }


    /* -------------------------------
     * 11. 저장 데이터 업데이트 (기존 호환성 유지)
     * ------------------------------- */
    function updateReservationTime() {
        // 기존 구조와 호환되도록 변환
        const output = {};
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        
        days.forEach(day => {
            const dayData = timeData[day];
            // 유효한 슬롯이 있는지 확인 (start와 end가 모두 있는 경우)
            const validSlots = dayData.slots && Array.isArray(dayData.slots) 
                ? dayData.slots.filter(slot => 
                    slot && slot.start && slot.end && slot.start.trim() !== "" && slot.end.trim() !== ""
                )
                : [];
            
            if (validSlots.length > 0) {
                // 첫 번째 구간을 기본값으로 사용 (기존 호환성 - 예약 화면에서 사용)
                const firstSlot = validSlots[0];
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:updateReservationTime:active-check',message:'checking active field',data:{day:day,dayDataActive:dayData.active,validSlotsLength:validSlots.length,willSetActive:true},timestamp:Date.now(),sessionId:'debug-session',runId:'data-check',hypothesisId:'active'})}).catch(()=>{});
                // #endregion
                
                // active 필드는 validSlots가 있으면 무조건 true (예약 화면에서 사용)
                output[day] = {
                    open: firstSlot.start,
                    close: firstSlot.end,
                    interval: firstSlot.interval || 60,
                    payment: firstSlot.payment && firstSlot.payment !== "" && firstSlot.payment !== "0" ? String(firstSlot.payment) : (firstSlot.payment === "0" ? "0" : null),
                    active: true  // validSlots가 있으면 무조건 활성화
                };
            } else {
                output[day] = {
                    open: null,
                    close: null,
                    interval: 60,
                    payment: null,
                    active: false
                };
            }
        });
        
        // 새 구조 데이터도 포함 (여러 구간 지원)
        output.slots = {};
        days.forEach(day => {
            const dayData = timeData[day];
            const validSlots = dayData.slots && Array.isArray(dayData.slots)
                ? dayData.slots.filter(slot => 
                    slot && slot.start && slot.end && slot.start.trim() !== "" && slot.end.trim() !== ""
                ).map(slot => ({
                    start: slot.start,
                    end: slot.end,
                    interval: slot.interval || 60,
                    payment: slot.payment && slot.payment !== "" && slot.payment !== "0" ? String(slot.payment) : (slot.payment === "0" ? "0" : null)
                }))
                : [];
            output.slots[day] = validSlots;
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1892e383-4af3-4b95-88cc-370032f82f04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facility_modify.js:updateReservationTime:output',message:'saving reservation time data',data:{output:output,mondayData:output.monday,tuesdayData:output.tuesday},timestamp:Date.now(),sessionId:'debug-session',runId:'data-check',hypothesisId:'data-save'})}).catch(()=>{});
        // #endregion
        
        // 디버깅용 콘솔 출력 (개발 중에만)
        console.log("저장되는 데이터:", output);
        
        reservationHidden.value = JSON.stringify(output);
    }

    /* -------------------------------
     * 12. 초기 렌더링
     * ------------------------------- */
    // 초기에는 아무 요일도 선택하지 않음 (비어있는 상태)
    renderTimeSlots(null);
    updateMultiSelectUI();
    updateActiveDaysSummary();
    updateReservationTime();

    /* -------------------------------
     * 13. 저장 버튼 → JSON 저장
     * ------------------------------- */
    const saveBtn = document.querySelector(".btn-save-all");
    if (saveBtn) {
        saveBtn.addEventListener("click", function () {
            updateReservationTime();
        });
    }

    /* -------------------------------
     * 14. 이미지 미리보기
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
     * 15. 폼 submit (첨부파일 포함)
     * ------------------------------- */
    const form = document.getElementById("modifyForm");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        updateReservationTime();

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
     * 16. 예약 활성화 토글
     * ------------------------------- */
    const rsCheck = document.getElementById("rsPosible");
    const timeBox = document.getElementById("timeSettingBox");

    function toggleTimeBox() {
        if (rsCheck.checked) {
            timeBox.classList.remove("time-disabled");
            // 활성화 시 현재 데이터 표시
            updateActiveDaysSummary();
        } else {
            timeBox.classList.add("time-disabled");
            reservationHidden.value = "{}";
            // 비활성화 시 우측 패널 비우기
            updateActiveDaysSummary();
        }
    }

    toggleTimeBox();
    rsCheck.addEventListener("change", toggleTimeBox);

});
