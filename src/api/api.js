import {request, STOCK_TYPE, calcFixedPirceNumber, formatNumber} from '../assets/js/utils'
export async function getStockList (data) {
  const params = data.join(',')
  const resp = await request({
    url: 'https://hq.sinajs.cn/list=' + params
  })
  const splitData = resp.split(';\n');
  const sz = null;
  let aStockCount = 0;
  let usStockCount = 0;
  let hkStockCount = 0;
  let noDataStockCount = 0;
  const _data = splitData.map((item, index) => {
    if (item) {
      const code = item.split('="')[0].split('var hq_str_')[1];
      const params = item.split('="')[1].split(',');
      let type = code.substr(0, 2) || 'sh';
      let symbol = code.substr(2);
      let stockItem;
      let fixedNumber = 2;
      if (params.length > 1) {
        if (/^(sh|sz)/.test(code)) {
          const open = params[1];
          const yestclose = params[2];
          const price = params[3];
          const high = params[4];
          const low = params[5];
          fixedNumber = calcFixedPirceNumber(open, yestclose, price, high, low);
          stockItem = {
            code,
            area: 'A',
            name: params[0],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[8], 2),
            amount: formatNumber(params[9], 2),
            percent: ''
          };
          aStockCount += 1;
        } else if (/^hk/.test(code)) {
          const open = params[2];
          const yestclose = params[3];
          const price = params[6];
          const high = params[4];
          const low = params[5];
          fixedNumber = calcFixedPirceNumber(open, yestclose, price, high, low);
          stockItem = {
            code,
            area: 'HK',
            name: params[1],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[12], 2),
            amount: formatNumber(params[11], 2),
            percent: ''
          };
          hkStockCount += 1;
        } else if (/^gb_/.test(code)) {
          symbol = code.substr(3);
          const open = params[5];
          const yestclose = params[26];
          const price = params[1];
          const high = params[6];
          const low = params[7];
          fixedNumber = calcFixedPirceNumber(open, yestclose, price, high, low);
          stockItem = {
            code,
            area: 'GB',
            name: params[0],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[10], 2),
            amount: '???????????????',
            percent: ''
          };
          type = code.substr(0, 3);
          noDataStockCount += 1;
        } else if (/^usr_/.test(code)) {
          symbol = code.substr(4);
          const open = params[5];
          const yestclose = params[26];
          const price = params[1];
          const high = params[6];
          const low = params[7];
          fixedNumber = calcFixedPirceNumber(open, yestclose, price, high, low);
          stockItem = {
            code,
            area: 'US',
            name: params[0],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[10], 2),
            amount: '???????????????',
            percent: ''
          };
          type = code.substr(0, 4);
          usStockCount += 1;
        }
      } else {
        console.log(`???????????????????????? ${code}`)
      }
      return stockItem
    }
  })
  const result = []
  _data.forEach((item) => {
    if (item) {
      result.push(item)
    }
  })
  return result
}
export async function getStockSuggestList(searchText = '', type = '2') {
  if (!searchText) {
    alert('?????????????????????????????????0000001 ??? ????????????')
  }
  const url = `https://suggest3.sinajs.cn/suggest/type=${type}&key=${encodeURIComponent(searchText)}`;
  try {
    const response = await request({url: url});
    const text = response.slice(18, -1);
    const tempArr = text.split(';');
    const result = [];
    tempArr.forEach((item) => {
      const arr = item.split(',');
      let code = arr[0];
      if (code.substr(0, 2) === 'of') {
        // ??????lof??????etf???????????????????????????
        // http://www.csisc.cn/zbscbzw/cpbmjj/201212/f3263ab61f7c4dba8461ebbd9d0c6755.shtml
        // ?????????????????????????????????????????????????????????50???59??????6???????????????????????????????????????????????????????????????????????????15???19??????6??????????????????
        code = code.replace(/^(of)(5[0-9])/g, 'sh$2').replace(/^(of)(1[5-9])/g, 'sz$2');
      }
      if (code === 'hkhsi' || code === 'hkhscei') {
        code = code.toUpperCase().replace('HK', 'hk');
      }
      // ??????????????? us. ??????????????????
      if (STOCK_TYPE.includes(code.substr(0, 2)) && !code.startsWith('us.')) {
        result.push({
          label: `${code} | ${arr[4]}`,
          description: arr[7] && arr[7].replace(/"/g, '')
        });
      }
    });
    return result;
  } catch (err) {
    alert('????????????????????????')
  }
}
