<template>
	<div class="popup_page">
    <el-switch v-model="status" @change="toggleStatus"></el-switch>
	</div>
</template>

<script>
  import {reactive, toRefs, onMounted} from 'vue';
  // eslint-disable-next-line no-undef
  const $BG = chrome.extension.getBackgroundPage();
	export default {
    setup() {
      const data = reactive({
        status: true
      })

      onMounted(async () => {
        const atv = $BG.popopActive;
        data.status = atv;
      })

      const toggleStatus = (value) => {
        data.status = value
        $BG.popupActiveChange(value);
        chrome.tabs.query({}, tabs => {
          tabs.forEach(item => {
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
