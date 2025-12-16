document.addEventListener("DOMContentLoaded", function () {

    /*****************************************
     * 1) 지역(시/도/구) 데이터
     *****************************************/
    const regionData = {
        "서울특별시": [
            "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구",
            "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구",
            "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구",
            "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
        ],
        "부산광역시": [
            "강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구",
            "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구",
            "중구", "해운대구"
        ],
        "대구광역시": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
        "인천광역시": [
            "강화군", "계양구", "남동구", "동구", "미추홀구", "부평구",
            "서구", "연수구", "옹진군", "중구"
        ],
        "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
        "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
        "울산광역시": ["남구", "동구", "북구", "울주군", "중구"],
        "세종특별자치시": ["세종시"],
        "경기도": [
            "가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구",
            "과천시", "광명시", "광주시", "구리시", "군포시", "김포시",
            "남양주시", "동두천시", "부천시", "성남시 분당구", "성남시 수정구",
            "성남시 중원구", "수원시 권선구", "수원시 영통구", "수원시 장안구",
            "수원시 팔달구", "시흥시", "안산시 단원구", "안산시 상록구",
            "안성시", "안양시 동안구", "안양시 만안구", "양주시", "양평군",
            "여주시", "연천군", "오산시", "용인시 기흥구", "용인시 수지구",
            "용인시 처인구", "의왕시", "의정부시", "이천시", "파주시",
            "평택시", "포천시", "하남시", "화성시"
        ],
        "강원특별자치도": [
            "강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군",
            "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시",
            "평창군", "홍천군", "화천군", "횡성군"
        ],
        "충청북도": [
            "괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시",
            "증평군", "진천군", "청주시 상당구", "청주시 서원구", "청주시 청원구",
            "청주시 흥덕구", "충주시"
        ],
        "충청남도": [
            "계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군",
            "서산시", "서천군", "아산시", "예산군", "천안시 동남구", "천안시 서북구",
            "청양군", "태안군", "홍성군"
        ],
        "전북특별자치도": [
            "고창군", "군산시", "김제시", "남원시", "무주군", "부안군",
            "순창군", "완주군", "익산시", "임실군", "장수군", "전주시 덕진구",
            "전주시 완산구", "정읍시", "진안군"
        ],
        "전라남도": [
            "강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시",
            "담양군", "목포시", "무안군", "보성군", "순천시", "신안군",
            "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군",
            "진도군", "함평군", "해남군", "화순군"
        ],
        "경상북도": [
            "경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시",
            "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군",
            "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군",
            "청도군", "청송군", "칠곡군", "포항시 남구", "포항시 북구"
        ],
        "경상남도": [
            "거제시", "거창군", "고성군", "김해시", "남해군", "밀양시",
            "사천시", "산청군", "양산시", "의령군", "진주시",
            "창녕군", "창원시 마산합포구", "창원시 마산회원구",
            "창원시 성산구", "창원시 의창구", "창원시 진해구",
            "통영시", "하동군", "함안군", "함양군", "합천군"
        ],
        "제주특별자치도": ["서귀포시", "제주시"]
    };

    const params = new URLSearchParams(window.location.search);

    const sidoEl = document.getElementById("sido");
    const sigunguEl = document.getElementById("sigungu");
    const perPageEl = document.getElementById("perPageSelect");

    /*****************************************
     * 2) 시·도 옵션 생성
     *****************************************/
    Object.keys(regionData).forEach((sido) => {
        const opt = document.createElement("option");
        opt.value = sido;
        opt.textContent = sido;
        sidoEl.appendChild(opt);
    });

    const nowSido = params.get("sido") || "";
    const nowSigungu = params.get("sigungu") || "";

    if (nowSido) sidoEl.value = nowSido;

    function renderSigungu(sido) {
        sigunguEl.innerHTML = `<option value="">구/군 선택</option>`;
        if (!regionData[sido]) return;

        regionData[sido].forEach((sgg) => {
            const opt = document.createElement("option");
            opt.value = sgg;
            opt.textContent = sgg;
            sigunguEl.appendChild(opt);
        });
    }

    renderSigungu(nowSido);
    if (nowSigungu) sigunguEl.value = nowSigungu;

    sidoEl.addEventListener("change", function () {
        const selected = this.value;

        renderSigungu(selected);
        params.set("sido", selected);
        params.delete("sigungu");
        params.set("page", 1);

        window.location.search = params.toString();
    });

    sigunguEl.addEventListener("change", function () {
        params.set("sigungu", this.value);
        params.set("page", 1);
        window.location.search = params.toString();
    });

    if (perPageEl) {
        perPageEl.value = params.get("per_page") || "15";

        perPageEl.addEventListener("change", function () {
            params.set("per_page", this.value);
            params.set("page", 1);
            window.location.search = params.toString();
        });
    }

    /*****************************************
     * 3) 시설 리스트 렌더링
     *****************************************/
    function renderFacilityList(data) {
        const box = document.getElementById("facilityList");
        box.innerHTML = "";

        if (!data || data.length === 0) {
            box.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:20px;">검색 결과가 없습니다.</td>
                </tr>
            `;
            return;
        }

        box.innerHTML = data.map(item => `
            <tr>
                <td>${item.row_no}</td>
                <td><input type="checkbox" class="facility-check" value="${item.id}"></td>
                <td>
                ${item.name}
                <span class="${item.faci_stat_nm == '정상운영' ? 'status-active' : 'status-inactive'}">${item.faci_stat_nm} </span>
                </td>
                <td>${item.address}</td>
            </tr>
        `).join("");
    }

    try {
        const raw = document.getElementById("facilityData").textContent.trim();
        const list = JSON.parse(raw);
        renderFacilityList(list);
    } catch (e) {
        console.error("JSON 파싱 오류:", e);
    }


    /*****************************************
     * 4) 종목 관리 팝업
     *****************************************/
    const sportsPopup = document.getElementById("sportsPopup");
    const openBtn = document.getElementById("openSportsPopup");
    const closeBtn = document.getElementById("closeSportsPopup");
    const saveBtn = document.getElementById("saveSportsBtn");
    const cardContainer = document.getElementById("sportsCardContainer");

    let sportsData = [];
    try {
        sportsData = JSON.parse(document.getElementById("sportData").textContent.trim());
    } catch (e) {
        console.error("종목 JSON 파싱 오류:", e);
    }

    let selectedSports = new Set();
    sportsData.forEach(s => {
        if (s.selected) selectedSports.add(s.id);
    });

    /* 팝업 열기 */
    openBtn.addEventListener("click", () => {
        sportsPopup.style.display = "flex";
        renderSportsCards();
    });

    /* 팝업 닫기 */
    closeBtn.addEventListener("click", () => {
        sportsPopup.style.display = "none";
    });

    function renderSportsCards() {
        cardContainer.innerHTML = "";

        sportsData.forEach((sport) => {
            // wrap이 그리드 아이템
            const wrap = document.createElement("div");
            wrap.className = "sports-card-wrap";

            // 카드
            const card = document.createElement("div");
            card.className = "sports-card";
            card.dataset.id = sport.id;
            card.innerText = sport.s_name;

            if (selectedSports.has(sport.id)) {
                card.classList.add("selected");
            }

            // 카드 클릭 → 선택/해제
            card.addEventListener("click", () => {
                if (selectedSports.has(sport.id)) {
                    selectedSports.delete(sport.id);
                    card.classList.remove("selected");
                } else {
                    selectedSports.add(sport.id);
                    card.classList.add("selected");
                }
            });

            // ❌ 삭제 버튼
            const delBtn = document.createElement("button");
            delBtn.className = "sport-del-btn";
            delBtn.textContent = "✕";

            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();  // 카드 클릭 이벤트 막기
                handleDeleteSport(sport.id);
            });

            wrap.appendChild(card);
            wrap.appendChild(delBtn);
            cardContainer.appendChild(wrap);
        });
    }


    /**************************************
     *  종목 추가 버튼  (완전 정상 버전)
     **************************************/
    const newSportInput = document.getElementById("newSportName");
    const addSportBtn = document.getElementById("addSportBtn");

    addSportBtn.addEventListener("click", function () {
        const name = newSportInput.value.trim();
        if (!name) return alert("종목명을 입력하세요.");

        fetch("/manager/add_sport/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: new URLSearchParams({ name })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {

                    // 1) 메모리 배열에 push
                    sportsData.push({
                        id: data.id,
                        s_name: data.name,
                        selected: false
                    });

                    // 2) 입력창 초기화
                    newSportInput.value = "";

                    // 3) 카드 다시 렌더링
                    renderSportsCards();

                    alert("종목이 추가되었습니다.");
                } else {
                    alert(data.message);
                }
            });
    });



    /**************************************
     *  저장하기 버튼 (중복 제거)
     **************************************/
    saveBtn.addEventListener("click", () => {

        const formData = new URLSearchParams();
        [...selectedSports].forEach(id => {
            formData.append("ids[]", id);
        });

        fetch("/manager/save_selected_sports/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {

                    // 팝업 닫기
                    sportsPopup.style.display = "none";

                    // URL 파라미터 수정
                    const params = new URLSearchParams(window.location.search);
                    params.set("apply_sports", "1");   // 종목 적용 ON
                    params.set("page", "1");           // 첫 페이지로 이동

                    // 부모 페이지 reload
                    window.location.search = params.toString();
                } else {
                    alert("저장 실패");
                }
            })
            .catch(err => {
                console.error(err);
                alert("저장 중 오류가 발생했습니다.");
            });
    });


    function getCookie(name) {
        let cookieValue = null;
        document.cookie.split(";").forEach(cookie => {
            const cookieTrim = cookie.trim();
            if (cookieTrim.startsWith(name + "=")) {
                cookieValue = cookieTrim.substring(name.length + 1);
            }
        });
        return cookieValue;
    }

    // 종목삭제하기
    function handleDeleteSport(id) {
        if (!confirm("이 종목을 삭제하시겠습니까?")) return;

        fetch("/manager/sport_delete/", {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ ids: [id] }),   // 뷰에서 ids 리스트 받으니까
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("삭제 응답:", data);
                if (data.status === "ok") {
                    // 1) 메모리에서 제거
                    sportsData = sportsData.filter((s) => s.id !== id);
                    selectedSports.delete(id);

                    // 2) 다시 렌더
                    renderSportsCards();

                    alert("종목이 삭제되었습니다.");
                } else {
                    alert(data.msg || "삭제에 실패했습니다.");
                }
            })
            .catch((err) => {
                console.error(err);
                alert("삭제 중 오류가 발생했습니다.");
            });
    }

    /*****************************************
    * 종목 적용 체크박스 → 즉시 검색 반영
    *****************************************/
    const applySportsCheckbox = document.getElementById("applySportsFilter");

    if (applySportsCheckbox) {
        applySportsCheckbox.addEventListener("change", () => {
            const params = new URLSearchParams(window.location.search);

            if (applySportsCheckbox.checked) {
                params.set("apply_sports", "1");
            } else {
                params.delete("apply_sports");
            }

            params.set("page", 1);

            window.location.search = params.toString();
        });
    }

    /*****************************************
        * 시설 등록 기능
    *****************************************/
    const registerBtn = document.getElementById("registerBtn");

    if (registerBtn) {
        registerBtn.addEventListener("click", () => {

            const checked = document.querySelectorAll(".facility-check:checked");
            if (checked.length === 0) {
                alert("등록할 시설을 선택하세요.");
                return;
            }

            const ids = [...checked].map(c => c.value);

            if (!confirm(`선택된 ${ids.length}개의 시설을 등록하시겠습니까?`)) {
                return;
            }

            const formData = new URLSearchParams();
            ids.forEach(id => formData.append("ids[]", id));

            fetch("/manager/facility_register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === "success") {
                        alert(`${data.count}개의 시설이 등록되었습니다.`);
                        window.location.reload();
                    } else {
                        alert(data.message || "등록 중 오류 발생");
                    }
                });
        });
    }

});
