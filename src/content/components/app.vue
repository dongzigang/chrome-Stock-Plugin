<template>
	<div class="content_page">
		content_page
		<div class="content_page_main">
			content_page_main
		</div>
		<div class="content_page_footer">
			content_page_footer
		</div>
	</div>
</template>

<script>
import {reactive, toRefs, onMounted} from 'vue';

  export default {
    setup() {
      const data = reactive({
        status: true
      })
      onMounted(async () => {
        getBgMessage();
      });
      const getBgMessage = () => {
        window.sendMessageToBackgroundPopupScript({
          greeting: 'getBackGroundMessage'
        }, info => {
          if (!info.popopActive) {
            data.status = false;
          } else {
            data.status = false;
          }
        })
      };
      // eslint-disable-next-line no-undef
      chrome.runtime.onMessage.addListener(async function (request, sendResponse) {
        console.log(request)
        if (request.type === 'activeChange') {
          /*激活禁用就刷新*/
          // window.location.reload();
          return true
        }
        sendResponse();
      });
      return {
        ...toRefs(data),
        getBgMessage
      };
    }
	}
</script>

<style lang="less" scoped>
	.content_page{
		color: red;
		position: fixed;
		z-index: 100001;
		right: 10px;
		bottom: 10px;
		.content_page_main{
			color: green;
		}
	}
</style>
