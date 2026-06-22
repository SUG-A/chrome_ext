document.getElementById('checkBtn').addEventListener('click', async () => {
  // 1. 今開いているタブの情報を取得
  // [tab]:配列の最初だけ持ってきてる
  // active: true → 今開いているタブを取得
  // currentWindow: true → 今クリックしているウィンドウのタブを取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 2. 設定画面で保存されたURLを取得
  chrome.storage.local.get(['savedUrl'], (result) => {
    const savedUrl = result.savedUrl;

    if (!savedUrl) {
      alert("先に拡張機能のオプションからURLを設定してください。");
      return;
    }

    // 3. URLの判定（前方の部分一致で判定します）
    // クエリパラメータとか入っててもOK！
    if (tab.url.startsWith(savedUrl)) {
      
      // 今開いてるページでプログラムを実行する（ここを書き換えます）
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // 1. ページ内から「class="news-date"」がついた要素を検索して取得する
          const newsDateElement = document.querySelector('.news-date');

          // 2. 要素が見つかったかどうかで処理を分ける（エラー防止のための安全装置）
          if (newsDateElement) {
            // 見つかった場合：その要素の「文字データ（テキスト）」を抜き出す
            const dateText = newsDateElement.textContent.trim();
            
            alert("URLが一致しました！日付を取得しました。");
            alert("取得した日付: " + dateText);
          } else {
            // 見つからなかった場合
            alert("URLは一致しましたが、ページ内に 'news-date' クラスが見つかりませんでした。");
          }
        }
      });

    } else {
      // 一致しなかった場合
      alert("開いているURLが違います");
    }
  });
});