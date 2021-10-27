import hotReload from '@/utils/hotReload'
import { getStockSuggestList, getStockList } from '../api/api'
hotReload()
const backInfo = {
  popopActive: true
};
const active = localStorage.getItem('popopActive');
window.popopActive = active !== 'false';
backInfo.popopActive = active !== 'false';

// 插件激活状态改变
window.popupActiveChange = (active) => {
  window.popopActive = active;
  backInfo.popopActive = active;
  localStorage.setItem('popopActive', active);
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
  } else if (request.greeting === 'searchKey') {
    getStockSuggestList(request.data.searchKey).then((res) => {
      sendResponse(res);
    })
  } else if (request.greeting === 'getStockList') {
    getStockList(request.data.codeList).then((res) => {
      sendResponse(res);
    })
  }
  return true;
})
