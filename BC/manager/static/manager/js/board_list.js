document.addEventListener("DOMContentLoaded", function () {

    /* 올바른 boardName 가져오기 */
    let boardNm = document.querySelector('.box-header').textContent.trim();

    /* JSON 파싱 */
    let list = [];
    try {
        list = JSON.parse(document.getElementById("boardData").textContent.trim());
    } catch (e) {
        console.error("JSON 파싱 오류:", e);
    }

    /* 렌더링 */
    function renderBoardList(data) {
        const box = document.getElementById("boardList");
        box.innerHTML = "";

        if (!data || data.length === 0) {
            box.innerHTML = `<tr><td colspan="5">등록된 ${boardNm}이(가) 없습니다.</td></tr>`;
            return;
        }

        box.innerHTML = data.map(item => `
            <tr ${item.delete_date ? 'style="opacity:0.6;background:#f5f5f5;"' : ''}>
                <td>${item.row_no}</td>
                <td>${item.delete_date ? '' : `<input type="checkbox" value="${item.id}">`}</td>                
                <td><a href="/manager/board_detail/${item.id}/">${item.title}</a></td>
                <td>${item.author}</td>
                <td>${item.delete_date || '-'}</td>
            </tr>
        `).join("");
         // <td><input type="checkbox" value="${item.id}"></td>
    }

    renderBoardList(list);

    /* 삭제 기능 동일 */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    document.querySelector('.delete-btn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#boardList input[type="checkbox"]:checked');
        const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

        if (ids.length === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }

        if (!confirm(`선택한 ${ids.length}개의 게시글을 삭제하시겠습니까?`)) return;

        fetch('/manager/api/articles/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ ids: ids, board_type: 'post' })
            
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                alert(`${data.deleted}개 삭제 완료`);
                location.reload();
            } else {
                alert('삭제 오류: ' + data.msg);
            }
        });
    });

});