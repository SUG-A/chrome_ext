document.addEventListener("DOMContentLoaded", () => {
    // URLのパラメータから時間と予定名を取得して画面に埋め込む
    const urlParams = new URLSearchParams(window.location.search);
    const time = urlParams.get('time') || '00:00';
    const title = urlParams.get('title') || '予定';

    document.getElementById('displayTime').textContent = time;
    document.getElementById('displayTitle').textContent = `${title} の時間です！`;

    // 「了解」ボタンを押したらウインドウを閉じる
    document.getElementById('closeBtn').addEventListener('click', () => {
        window.close();
    });
});