const inputEl = document.getElementById('targetUrl');
const saveBtn = document.getElementById('saveBtn');

// 画面が開かれたとき、すでに保存されているURLがあれば入力欄に表示する
chrome.storage.sync.get(['savedUrl'], (result) => {
  if (result.savedUrl) {
    inputEl.value = result.savedUrl;
  }
});

// ボタンが押されたら、入力されたURLを保存する
saveBtn.addEventListener('click', () => {
  const urlToSave = inputEl.value.trim();
  chrome.storage.sync.set({ savedUrl: urlToSave }, () => {
    alert('URLを保存しました！');
  });
});