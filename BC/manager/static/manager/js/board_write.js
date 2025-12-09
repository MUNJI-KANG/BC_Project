document.addEventListener('DOMContentLoaded', function () {
    const pinTopCheckbox = document.querySelector("input[name='pin_top']");
    const noticeSection = document.querySelector(".notice-section");
    const noticeTypeRadios = document.querySelectorAll("input[name='notice_type']");
    const dateSection = document.getElementById("date-section");
    const startDateInput = document.querySelector("input[name='start_date']");
    const endDateInput = document.querySelector("input[name='end_date']");

    if (!pinTopCheckbox || !noticeSection) return;

    function toggleDateInputs() {
        const checked = document.querySelector("input[name='notice_type']:checked");

        if (checked.value === "always") {
            dateSection.classList.add("hidden");
            startDateInput.disabled = true;
            endDateInput.disabled = true;
        } else {
            dateSection.classList.remove("hidden");
            startDateInput.disabled = false;
            endDateInput.disabled = false;
        }
    }

    function toggleNoticeSection() {
        const isPinned = pinTopCheckbox.checked;

        if (!isPinned) {
            noticeSection.classList.add("hidden");
            dateSection.classList.add("hidden");

            noticeTypeRadios.forEach(r => r.disabled = true);
            startDateInput.disabled = true;
            endDateInput.disabled = true;
        } else {
            noticeSection.classList.remove("hidden");

            noticeTypeRadios.forEach(r => r.disabled = false);

            toggleDateInputs();
        }
    }

    pinTopCheckbox.addEventListener("change", toggleNoticeSection);
    noticeTypeRadios.forEach(radio => {
        radio.addEventListener("change", toggleDateInputs);
    });

    toggleNoticeSection();

    const form = document.querySelector('form');
    const contextInput = document.querySelector("#contextInput");

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (window.editorInstance) {
            contextInput.value = window.editorInstance.getHTML();
        }

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


});
