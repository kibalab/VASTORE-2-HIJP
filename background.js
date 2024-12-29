// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("VA-STORE to HIJP Extension Installed.");
});

// 메시지를 받아서 처리해도 되지만, 이 예시에서는 주로 storage를 통한 데이터 공유를 설명합니다.
