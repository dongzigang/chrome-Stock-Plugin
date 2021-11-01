<template>
	<div class="content_page" v-if="status">
    <!--  上方搜索框  -->
    <div class="searchBar" :class="{'showBar': showSearchInput}">
      <input
        class="searchBar-input"
        v-model="searchKey"
        placeholder="请输入关键词查询，如：0000001 或 上证指数"
        @keyup.enter="searchStock"
      />
      <div class="suggestList" v-show="showSearchList">
        <div
          class="suggestList-item"
          v-for="item in suggestList"
          :key="item.label"
          @click="addStock(item)"
        >
          {{item.label}}
          {{item.description}}
        </div>
      </div>
    </div>
    <!--  股票列表  -->
    <div class="stock-list" :class="{'hideStockList': stockListHide}">
      <div class="stock-title">
        <img src="../../assets/images/add.png"  @click="showAddInput" alt="" class="add-icon" title="添加股票">
        <img src="../../assets/images/refresh.png"  @click="refreshData" alt="" class="add-icon" title="刷新">
        <img src="../../assets/images/sort.png"  @click="sortData" alt="" class="add-icon" title="排序">
        <img src="../../assets/images/save.png"  @click="save" alt="" class="add-icon" title="将自选股票及预警信息缓存到当前网站，当您需要重新安装本插件时可以进行此操作，重装完成后，请重新进入当前网站，点击旁边的导入按钮，即可恢复数据">
        <img src="../../assets/images/import.png"  @click="importData" alt="" class="add-icon" title="将缓存在当前站点的数据重新载入">
      </div>
      <div class="stockList-ctn">
        <div class="stockList">
          <div
            v-for="item in stockList"
            :key="item.increase"
            class="stockItem"
            :title="`今开${item.open} 昨收${item.yestclose}&#10;最高${item.high} 最低${item.low}&#10;成交量${item.volume} 成交额${item.amount}`"
            :class="{'stockGreen':item.increase < 0 }">
            <div class="stockItem-main">
              <span class="increase-icon" v-show="item.increase < 0">↓</span>
              <span class="increase-icon" v-show="item.increase >= 0">↑</span>
              <span class="increase">{{item.increase}}%</span>
              <span class="price">{{item.price}}</span>
              <span class="name">{{item.name}}</span>
              <img
               src="../../assets/images/warning.png"
               class="warning-icon"
               :title="`${item.warnTitle}`"
               v-show="item.isWarn">
            </div>
            <div class="ops-ctn">
              <img src="../../assets/images/warn.png"  @click="stockWarn(item)" alt="" class="add-icon" title="价格预警">
              <img src="../../assets/images/del.png" class="del-icon" alt="删除" title="删除" @click="delStock(item)">
            </div>
          </div>
          <!-- 添加预警弹窗 -->
          <div class="warn-ctn" v-show="warnShow">
            <div class="warn-main">
              <div>
                {{warnName}}【{{warnCode}}】
              </div>
              <div>当前价格：{{warnStockNowPrice}}</div>
              <input type="number" v-model="warnPrice" min="0" placeholder="请输入预警价格" class="warn-input">
              <div class="warn-btn-ctn">
                <button style="margin-right:10px" @click="addWarn">确定</button>
                <button @click="cancelWarn">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <img src="../../assets/images/open.png" class="open-icon" @click="hideList">
    </div>
	</div>
</template>

<script>
import {reactive, toRefs, toRaw, onMounted} from 'vue';
import { getChromeLocalStorage, setChromeLocalStorage, getLocalStorage, setLocalStorage, sortStock } from '../../assets/js/utils'
  export default {
    setup() {
      const data = reactive({
        needRefreshData: true,
        // 搜索框
        status: false,
        searchKey: '',
        suggestList: '',
        showSearchInput: false,
        showSearchList: false,
        // 股票列表
        sortType: 0,
        stockListHide: true,
        stockList: [],
        stockCodeList: [],
        // 股价预警
        warnList: {},
        warnShow: false,
        warnCode: '',
        warnPrice: '',
        warnName: '',
        warnStockNowPrice: ''
      })
      onMounted(async () => {
        getBgMessage();
        getChromeLocalStorage('stockCodeList', (stockCodeList) => {
          if (stockCodeList) {
            data.stockCodeList = stockCodeList
          }
        })
        getChromeLocalStorage('stockWarnList', (warnList) => {
          data.warnList = warnList || {}
        })
        monitorKey(data)
        setInterval(() => {
          refreshData()
        }, 5000)
        pageVisibilitychange()
      });
      const pageVisibilitychange = () => {
        document.addEventListener('visibilitychange', (event) => {
          if (document.webkitHidden) {
            data.needRefreshData = false
          } else {
            data.needRefreshData = true
          }
        })
      }
      // 发送桌面通知
      const showNotification = (title, data) => {
        window.sendMessageToBackgroundPopupScript({
          greeting: 'showNotification',
          data: { title, data }
        }, res => {

        })
      }
      // 股票预警
      const stockWarn = (item) => {
        data.warnCode = item.code
        data.warnName = item.name
        data.warnStockNowPrice = item.price
        data.warnShow = true
      }
      // 添加预警
      const addWarn = () => {
        if (!data.warnPrice) {
          return
        }
        const flag = data.warnPrice - data.warnStockNowPrice > 0 ? 'rise' : 'fall'
        const _data = data.warnList[data.warnCode]
        let isRepeat = false
        if (_data) {
          _data.forEach((item) => {
            if (item.targetPrice === data.warnPrice) {
              isRepeat = true
            }
          })
          if (isRepeat) {
            return
          } else {
            data.warnList[data.warnCode].push({
              type: flag,
              targetPrice: data.warnPrice
            })
          }
        } else {
          data.warnList[data.warnCode] = [{
              type: flag,
              targetPrice: data.warnPrice
            }]
        }
        setChromeLocalStorage('stockWarnList', toRaw(data.warnList))
        data.warnShow = false
        data.warnCode = ''
        data.warnName = ''
      }
      const cancelWarn = () => {
        data.warnShow = false
        data.warnCode = ''
        data.warnName = ''
      }
      // 显示搜索框
      const showAddInput = () => {
        data.showSearchInput = true
        data.inputAutoFocus = true
      }
      // 排序
      const sortData = () => {
        const _sortType = data.sortType + 1 === 2 ? -1 : data.sortType + 1
        data.sortType = _sortType
        data.stockList = sortStock(data.stockList, _sortType)
      }
      // 刷新数据
      const refreshData = () => {
        if (data.stockCodeList[0] && data.status && data.needRefreshData) {
          window.sendMessageToBackgroundPopupScript({
            greeting: 'getStockList',
            data: { codeList: data.stockCodeList }
          }, res => {
            res.forEach((item) => {
              // 计算涨幅
              item.increase = ((item.price - item.yestclose) / item.yestclose * 100).toFixed(2)
              // 如果当前有打开添加预警的弹窗，预警股票的价格要实时更新
              if (data.warnCode && item.code === data.warnCode) {
                data.warnStockNowPrice = item.price
              }
              if (data.warnList[item.code]) {
                item.isWarn = true
                item.warnTitle = ''
                data.warnList[item.code].forEach((warnItem, index) => {
                  // 添加到了预警提示
                  item.warnTitle += warnItem.type === 'rise' ? '涨' : '跌'
                  item.warnTitle += `到${warnItem.targetPrice}时预警`
                  if (index < data.warnList[item.code].length - 1) {
                    item.warnTitle += '//'
                  }
                  // 判断是否达到预计阙值
                  if (warnItem.type === 'rise' && item.price >= warnItem.targetPrice) {
                      showNotification('股票助手', `${item.name}【${item.code}】已涨到您设置的预警价位${warnItem.targetPrice}`);
                      data.warnList[item.code].splice(index, 1)
                      setChromeLocalStorage('stockWarnList', toRaw(data.warnList))
                  } else if (warnItem.type === 'fall' && item.price <= warnItem.targetPrice) {
                      showNotification('股票助手', `${item.name}【${item.code}】已跌到您设置的预警价位${warnItem.targetPrice}`);
                      data.warnList[item.code].splice(index, 1)
                      setChromeLocalStorage('stockWarnList', toRaw(data.warnList))
                  }
                })
              }
            })
            data.stockList = sortStock(res, data.sortType)
          })
        }
      }
      // 删除股票
      const delStock = (stock) => {
        data.stockCodeList.forEach((item, index) => {
          if (item === stock.code) {
            data.stockCodeList.splice(index, 1)
          }
        })
        setChromeLocalStorage('stockCodeList', toRaw(data.stockCodeList))
        data.stockList.forEach((item, index) => {
          if (item.code === stock.code) {
            data.stockList.splice(index, 1)
          }
        })
      }
      // 添加股票
      const addStock = (stockMsg) => {
        const code = stockMsg.label.substring(0, 8)
        console.log(data.stockCodeList.includes(code))
        if (!data.stockCodeList.includes(code)) {
          data.stockCodeList.push(code)
          getStockList(data.stockCodeList)
        }
      }
      // 隐藏股票列表
      const hideList = () => {
        data.stockListHide = !data.stockListHide
      }
      const searchStock = () => {
        if (data.searchKey) {
          window.sendMessageToBackgroundPopupScript({
            greeting: 'searchKey',
            data: { searchKey: data.searchKey }
          }, res => {
            data.suggestList = res
            data.showSearchList = true
          })
        }
      }
      const getStockList = (codeList) => {
        window.sendMessageToBackgroundPopupScript({
          greeting: 'getStockList',
          data: { codeList }
        }, res => {
          const codeList = res.map((item) => {
            return item.code
          })
          setChromeLocalStorage('stockCodeList', codeList)
          res.forEach((item) => {
            item.increase = ((item.price - item.yestclose) / item.yestclose * 100).toFixed(2)
          })
          data.stockList = sortStock(res, data.sortType)
        })
      }
      // 页面加载时获取当前的插件状态
      const getBgMessage = () => {
        window.sendMessageToBackgroundPopupScript({
          greeting: 'getBackGroundMessage'
        }, info => {
          if (!info.popopActive) {
            data.status = false;
          } else {
            data.status = true;
          }
        })
      };
      // 插件激活状态改变时触发
      chrome.runtime.onMessage.addListener(async function (request, sendResponse) {
        if (request.type === 'activeChange') {
          console.log(request.type)
          data.status = request.active
          /*激活禁用就刷新*/
          // window.location.reload();
          return true
        }
        sendResponse();
      });
      // 将数据缓存到当前站点
      const save = () => {
        if (data.stockCodeList[0]) {
          setLocalStorage('stockCodeList', data.stockCodeList)
          setLocalStorage('stockWarnList', data.warnList)
          console.log(data.warnList)
          alert('自选股票及预警信息已缓存到当前网站，请您重新安装安装完成插件后回到当前网站点击导入按钮')
        }
      }
      // 导入
      const importData = () => {
        const stockCodeList = getLocalStorage('stockCodeList') || '[]'
        const stockWarnList = getLocalStorage('stockWarnList') || '{}'
        console.log(stockWarnList)
        if (data.stockCodeList && data.stockCodeList[0]) {
          const r = confirm('当前列表已有自选股票，继续导入将会覆盖当前列表，是否继续导入？');
          if (r === true) {
              data.stockCodeList = stockCodeList
              data.warnList = stockWarnList
              setChromeLocalStorage('stockWarnList', stockWarnList)
              setChromeLocalStorage('stockCodeList', stockCodeList)
              alert('导入成功')
          } else {

          }
        } else {
          data.stockCodeList = stockCodeList
          data.warnList = stockWarnList
          setChromeLocalStorage('stockWarnList', stockWarnList)
          setChromeLocalStorage('stockCodeList', stockCodeList)
          alert('导入成功')
        }
      }
      return {
        ...toRefs(data),
        getBgMessage,
        searchStock,
        addStock,
        hideList,
        delStock,
        showAddInput,
        refreshData,
        sortData,
        stockWarn,
        cancelWarn,
        addWarn,
        save,
        importData
      };
    }
	}
	// 监听按键
  function monitorKey (state) {
    document.onkeyup = (e) => {
      if (e && e.shiftKey && e.keyCode === 70) { // 按  shift + f 显示搜索框
        state.showSearchInput = true
        state.inputAutoFocus = true
      }
      if (e && e.keyCode === 27) { // 按 Esc 隐藏搜搜框
        state.showSearchInput = false
        state.showSearchList = false
        state.searchKey = ''
      }
    }
  }

/*content-script发消息给后台*/
window.sendMessageToBackgroundPopupScript = (message, callback) => {
  let {requestBody} = message
  if (requestBody) {
    requestBody = Object.assign({}, requestBody, {
      url: window.location.href
    })
  } else {
    requestBody = {
      url: window.location.href
    }
  }
  // eslint-disable-next-line no-undef
  chrome.runtime.sendMessage({
    ...message,
    requestBody: JSON.stringify(requestBody)
  }, function (response) {
    if (callback) callback(response)
  })
};

</script>

<style lang="less" scoped>
  * {
    box-sizing: border-box;
  }
  .warning-icon {
    margin-left: 5px;
    width: 12px;
    height: 12px;
  }
  .warn-input {
    margin: 5px 0 10px;
    border: 1px solid rgb(204,204,204);
  }
  .warn-btn-ctn {
    text-align: center;
  }
  .warn-ctn {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
    background: rgba(255, 255, 255, 0.8);
    .warn-main {
      background: #ffffff;
      border: 1px solid rgb(204,204,204);
      padding:5px 10px;
      width: 200px;
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%,0);
    }
  }
  .add-icon {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  .stock-title {
    height: 32px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-bottom: 1px solid rgb(204,204,204);
    img {
      margin-right: 10px;
    }
  }
  .stockItem-main {
    position: relative;
    display: flex;
    align-items: center;
    .increase-icon {
      margin-right: 5px;
    }
  }
  .stockList-ctn {
    position: relative;
    height: 100%;
    overflow-y: auto;
  }
  .ops-ctn {
   display: none;
   align-items: center;
   img {
     margin-left: 10px;
   }
  }
  .del-icon {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  .increase {
    text-align: right;
    display: inline-block;
    width: 56px;
    margin-right: 8px;
  }
  .price {
    display: inline-block;
    width: 80px;
    text-align: right;
    padding-right: 10px;
  }
  .open-icon {
    cursor: pointer;
    width: 30px;
    height: 30px;
    position: absolute;
    left: -30px;
    top: 50%;
    transform: translate(0, 50%);
    z-index: 99999;
  }
	.stock-list{
    font-size: 14px;
    border-radius: 3px;
    border:1px solid rgb(204,204,204);
		background: #ffffff;
		position: fixed;
    width: 300px;
    height: 500px;
		z-index: 100001;
		right: 0;
		bottom: 0;
    transition: all 1s inherit;
	}
  .hideStockList {
    right: -300px
  }
  .suggestList {
    border: 1px solid rgb(204,204,204);
    border-radius: 0 0 5px 5px;
    border-top: none;
    background: #ffffff;
  }
  .suggestList-item {
    padding:0px 10px;
    cursor: pointer;
    line-height: 2em;
    color: gray;
  }
  .searchBar {
    position: fixed;
    top: -60px;
    left: 50%;
    width: 500px;
    transform: translate(-50%,0);
    transition: all 0.3s;
    z-index: 9999999;
  }
  .showBar {
    top: 20px!important;
  }
  .searchBar-input {
    width: 500px;
    height: 36px;
    line-height: 36px;
    border: 1px solid #cccccc;
    border-radius: 5px;
    outline-color: #409EFF;
    padding: 0 5px;
  }
  .stockItem {
    color: red;
    line-height: 26px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    >span {
      display: inline-block;
      margin-right: 10px;
    }
    &:hover {
      background: rgb(245,247,250);
      .ops-ctn {
        display: flex;
      }
    }

  }
  .stockGreen {
    color: green;
  }
  * {
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 4px;
      background-color: rgba(144, 147, 153, 0.3);
    }

    &::-webkit-scrollbar-track {
      //background-color: ;
    }
  }
</style>
