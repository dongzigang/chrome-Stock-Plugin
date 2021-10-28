<template>
	<div class="popup_page">
    <label class="switch">
      <input type="checkbox" v-model="status" @change="toggleStatus(status)">
      <span></span>
    </label>
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
        console.log(value)
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
.switch{
  cursor: pointer;
  width:40px;
  height:20px;
  border-radius:10px;
  overflow: hidden;
  vertical-align:middle;
  position:relative;
  display: inline-block;
  background:#ccc;
  box-shadow: 0 0 1px #3399ff;
}
.switch input{
  visibility: hidden;
}
.switch span{
  position:absolute;
  top:0;
  left:0;
  border-radius: 50%;
  background:#fff;
  width:50%;
  height:100%;
  transition:all linear 0.2s;
}
.switch span::before{
  position: absolute;
  top:0;
  left:-100%;
  content:'';
  width:200%;
  height:100%;
  border-radius: 30px;
  background:#3399ff;
}
.switch span::after{
  content:'';
  position:absolute;
  left:0;
  top:0;
  width:100%;
  height:100%;
  border-radius: 50%;
  background:#fff;
}
.switch input:checked +span{
  transform:translateX(100%);
}
</style>
