document.getElementById('log').addEventListener('click', function() {
    chrome.extension.sendMessage({ msg: "logClicked" });
});