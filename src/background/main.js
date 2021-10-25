import hotReload from '@/utils/hotReload'
hotReload()
const backInfo = {
  popopActive: true
};
window.popupActiveChange = (active) => {
  backInfo.popopActive = active;
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.greeting === 'getBackGroundMessage') {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, async function () {
      sendResponse(backInfo);
    });
    return true;
  }
  return true;
})
