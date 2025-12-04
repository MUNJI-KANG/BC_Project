// 파일 선택 시 파일 목록 표시
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');

    // 허용된 파일 확장자
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf'];
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    if (fileInput && fileList) {
        fileInput.addEventListener('change', function(e) {
            fileList.innerHTML = ''; // 기존 목록 초기화

            if (e.target.files.length > 0) {
                const validFiles = [];
                const dt = new DataTransfer();

                Array.from(e.target.files).forEach((file, index) => {
                    // 파일 확장자 검증
                    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
                    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
                        alert(`허용되지 않은 파일 형식입니다: ${file.name}\n허용 형식: 이미지 파일(jpg, jpeg, png, gif, bmp, webp) 또는 PDF`);
                        return;
                    }

                    // 파일 크기 검증
                    if (file.size > MAX_FILE_SIZE) {
                        alert(`파일 크기가 너무 큽니다: ${file.name}\n최대 크기: 2MB`);
                        return;
                    }

                    // 유효한 파일만 추가
                    validFiles.push(file);
                    dt.items.add(file);

                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <span class="file-item-name">${file.name} (${(file.size / 1024).toFixed(1)}KB)</span>
                        <button type="button" class="file-item-remove" data-index="${validFiles.length - 1}">✕</button>
                    `;
                    fileList.appendChild(fileItem);

                    // 파일 제거 버튼 클릭 이벤트
                    fileItem.querySelector('.file-item-remove').addEventListener('click', function() {
                        const removeIndex = parseInt(this.getAttribute('data-index'));
                        validFiles.splice(removeIndex, 1);
                        
                        // DataTransfer 재생성
                        const newDt = new DataTransfer();
                        validFiles.forEach(f => newDt.items.add(f));
                        fileInput.files = newDt.files;
                        
                        // 파일 목록에서 제거
                        fileItem.remove();
                        
                        // 인덱스 재설정
                        fileList.querySelectorAll('.file-item-remove').forEach((btn, idx) => {
                            btn.setAttribute('data-index', idx);
                        });
                        
                        // 파일이 없으면 목록 숨김
                        if (fileInput.files.length === 0) {
                            fileList.innerHTML = '';
                        }
                    });
                });

                // 유효한 파일만 input에 설정
                fileInput.files = dt.files;
            }
        });
    }
});

