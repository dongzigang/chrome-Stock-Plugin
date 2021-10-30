import axios from 'axios'
export const STOCK_TYPE = ['sh', 'sz', 'hk', 'gb', 'us'];
export async function request(params) {
  const url = params.url
  // @ts-ignore
  const result = await axios({
    method: params.method ? params.method : 'get',
    url: url,
    data: params.data
  }).then((res) => {
    return res.data
  });
  return result
}

export function getLocalStorage(key, callBack) {
  try {
    chrome.storage.local.get(key, (data) => {
      callBack && callBack(JSON.parse(data[key]))
    });
  } finally {

  }
}
export function setLocalStorage(key, value) {
  let _value = value
  if (_value && typeof _value === 'object') {
    _value = JSON.stringify(_value)
  }
  chrome.storage.local.set({[key]: _value}, function() {
    console.log('保存股票成功')
  });
}
export const calcFixedPirceNumber = (
  open,
  yestclose,
  price,
  high,
  low
) => {
  const reg = /0+$/g;
  open = open.replace(reg, '');
  yestclose = yestclose.replace(reg, '');
  price = price.replace(reg, '');
  high = high.replace(reg, '');
  low = low.replace(reg, '');
  const o = open.indexOf('.') === -1 ? 0 : open.length - open.indexOf('.') - 1;
  const yc = yestclose.indexOf('.') === -1 ? 0 : yestclose.length - yestclose.indexOf('.') - 1;
  const p = price.indexOf('.') === -1 ? 0 : price.length - price.indexOf('.') - 1;
  const h = high.indexOf('.') === -1 ? 0 : high.length - high.indexOf('.') - 1;
  const l = low.indexOf('.') === -1 ? 0 : low.length - low.indexOf('.') - 1;
  let max = Math.max(o, yc, p, h, l);
  if (max > 3) {
    max = 2; // 接口返回的指数数值的小数位为4，但习惯两位小数
  }
  return max;
};
export const formatNumber = (val = 0, fixed = 2, format = true) => {
  const num = +val;
  if (format) {
    if (num > 1000 * 10000) {
      return (num / (10000 * 10000)).toFixed(fixed) + '亿';
    } else if (num > 1000) {
      return (num / 10000).toFixed(fixed) + '万';
    }
  }
  return `${num.toFixed(fixed)}`;
};
/**
 * 股票排序
 * sortType : 0 不排序 1从大到小 -1 从小到大
 * */
export const sortStock = (list = [], sortType = 0, key = 'increase') => {
  const _list = [...list]
  if (sortType === 0) {
    return _list
  } else if (sortType === 1) {
    _list.sort((a, b) => {
      return a[key] - b[key]
    })
    return _list
  } else if (sortType === -1) {
    _list.sort((a, b) => {
      return b[key] - a[key]
    })
    return _list
  }
}

/**
 * 桌面通知
 * 
*/
export const showNotification = (title, data) => {
    //显示一个桌面通知
    if (window.webkitNotifications) {
      const notification = window.webkitNotifications.createNotification(
          'assets/images/icon128.png', // icon url - can be relative
          title, // notification title
          data // notification body text
      );
      notification.show();        
      // 设置3秒后，将桌面通知dismiss
      setTimeout(() => { 
        notification.cancel()
      }, 300000);
  } else if (chrome.notifications) {
      const opt = {
          type: 'basic',
          title: title,
          message: data,
          iconUrl: 'assets/images/icon128.png'
      }
      chrome.notifications.create('', opt, function(id) {
        setTimeout(() => {
          chrome.notifications.clear(id, () => {});
        }, 300000);
      })
  } else {
    alert('亲，你的浏览器不支持啊！');
  }
}