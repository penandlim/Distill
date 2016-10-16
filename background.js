chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });
});