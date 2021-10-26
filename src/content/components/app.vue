<template>
	<div class="content_page" v-if="status">
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
    <div class="stock-list">

    </div>
	</div>
</template>

<script>
import {reactive, toRefs, onMounted} from 'vue';
  export default {
    setup() {
      const data = reactive({
        status: false,
        searchKey: '',
        suggestList: '',
        showSearchInput: false,
        showSearchList: false
      })
      onMounted(async () => {
        getBgMessage();
        monitorKey(data)
      });
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
      const addStock = () => {

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
        searchStock
      };
    }
	}
  function monitorKey (state) {
    document.onkeyup = (e) => {
      if (e && e.shiftKey && e.keyCode === 70) { // 按 f 显示搜索框
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
	.stock-list{
		background: aqua;
		position: fixed;
    width: 250px;
    height: 500px;
		z-index: 100001;
		right: 10px;
		bottom: 10px;
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
    &:hover {
      background: #eeeeee;
    }
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
</style>
