<template>
	<div class="content_page" v-if="status">
      <el-input
        v-model="searchKey"
        placeholder="请输入关键词查询，如：0000001 或 上证指数"
        @keyup.enter="searchStock"
      />
	</div>
</template>

<script>
import {reactive, toRefs, onMounted} from 'vue';
import { getStockSuggestList } from '../../api/api'
  export default {
    setup() {
      const data = reactive({
        status: false,
        searchKey: ''
      })
      onMounted(async () => {
        getBgMessage();
      });
      const searchStock = () => {
        if (data.searchKey) {
          getStockSuggestList(data.searchKey).then((res) => {
            data.showSearchList = true
            data.suggestList = res
          })
        }
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
	.content_page{
		background: aqua;
		position: fixed;
    width: 250px;
    height: 500px;
		z-index: 100001;
		right: 10px;
		bottom: 10px;
	}
</style>
