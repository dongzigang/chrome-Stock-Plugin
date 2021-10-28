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
            </div>
            <img src="../../assets/images/del.png" class="del-icon" alt="删除" title="删除" @click="delStock(item)">
          </div>
        </div>
      </div>
      <img src="../../assets/images/open.png" class="open-icon" @click="hideList">
    </div>
	</div>
</template>

<script>
import {reactive, toRefs, onMounted} from 'vue';
import { getLocalStorage, setLocalStorage, sortStock } from '../../assets/js/utils'
  export default {
    setup() {
      const data = reactive({
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
        stockCodeList: []
      })
      onMounted(async () => {
        getBgMessage();
        getLocalStorage('stockCodeList', (stockCodeList) => {
          data.stockCodeList = stockCodeList || []
        })
        monitorKey(data)
        setInterval(() => {
          refreshData()
        }, 5000)
      });
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
        if (data.stockCodeList[0] && data.status && !data.stockListHide) {
          window.sendMessageToBackgroundPopupScript({
            greeting: 'getStockList',
            data: { codeList: data.stockCodeList }
          }, res => {
            res.forEach((item) => {
              item.increase = ((item.price - item.yestclose) / item.yestclose * 100).toFixed(2)
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
        setLocalStorage('stockCodeList', data.stockCodeList)
        data.stockList.forEach((item, index) => {
          if (item.code === stock.code) {
            data.stockList.splice(index, 1)
          }
        })
      }
      // 添加股票
      const addStock = (stockMsg) => {
        const code = stockMsg.label.substring(0, 8)
        data.stockCodeList.push(code)
        getStockList(data.stockCodeList)
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
          setLocalStorage('stockCodeList', codeList)
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
      return {
        ...toRefs(data),
        getBgMessage,
        searchStock,
        addStock,
        hideList,
        delStock,
        showAddInput,
        refreshData,
        sortData
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
    display: flex;
    align-items: center;
    .increase-icon {
      margin-right: 5px;
    }
  }
  .stockList-ctn {
    height: 100%;
    overflow-y: auto;
  }
  .del-icon {
    display: none;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  .increase {
    display: inline-block;
    width: 60px;
  }
  .price {
    display: inline-block;
    width: 60px;
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
    width: 250px;
    height: 500px;
		z-index: 100001;
		right: 0;
		bottom: 0;
    transition: all 1s inherit;
	}
  .hideStockList {
    right: -250px
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
    position: absolute;
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
      .del-icon {
        display: inline-block;
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
