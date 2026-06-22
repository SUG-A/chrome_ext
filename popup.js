document.getElementById('checkBtn').addEventListener('click', async () => {
  // 1. 今開いているタブの情報を取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 2. 設定画面で保存されたURLを取得
  chrome.storage.sync.get(['savedUrl'], (result) => {
    const savedUrl = result.savedUrl;

    if (!savedUrl) {
      alert("先に拡張機能のオプションからURLを設定してください。");
      return;
    }

    // 3. URLの判定（前方の部分一致で判定します）
    if (tab.url.startsWith(savedUrl)) {
      
      // 一致した場合：今開いているページの中でプログラムを実行してDOMを取る
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // この中身は「今開いているページ」側で実行されます
          const dom = document.documentElement.outerHTML;
          alert("URLが一致しました！DOMを表示します。");
          alert(dom);
        }
      });

    } else {
      // 一致しなかった場合
      alert("開いているURLが違います");
    }
  });
});