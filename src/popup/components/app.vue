<template>
	<div class="popup_page">
    <el-switch v-model="status" @change="toggleStatus"></el-switch>
	</div>
</template>

<script>
  import {reactive, toRefs} from 'vue';
  // eslint-disable-next-line no-undef
  const $BG = chrome.extension.getBackgroundPage();
	export default {
    setup() {
      const data = reactive({
        status: true
      })
      const toggleStatus = (value) => {
        data.status = value
        $BG.popupActiveChange(value);
        chrome.tabs.query({}, tabs => {
          const list = tabs.filter(item => item.url.indexOf('baidu') > -1);
          list.forEach(item => {
            console.log(item)
            chrome.tabs.sendMessage(item.id, {
              type: 'activeChange',
              active: value
            }, () => {

            });
          })
        });
      }
      return {
        ...toRefs(data),
        toggleStatus
      };
    }
	}
</script>

<style lang="less" scoped>

</style>
