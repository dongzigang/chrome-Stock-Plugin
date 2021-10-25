<template>
	<div class="popup_page">
    {{status}}
    <button @click="toggleStatus(true)">open</button>
    <button @click="toggleStatus(false)">close</button>
	</div>
</template>

<script>
  import {reactive, toRefs} from 'vue';
	export default {
    setup() {
      const data = reactive({
        status: true

      })
      const toggleStatus = (starusParams) => {
        data.status = starusParams
        console.log(data.status)
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
