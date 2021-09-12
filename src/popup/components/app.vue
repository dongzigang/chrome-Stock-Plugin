<template>
	<div class="popup_page">
    {{status}}
    <button @click="toggleStatus(true)">open</button>
    <button @click="toggleStatus(false)">close</button>
	</div>
</template>

<script>
  import { ref } from 'vue';
	export default {
    setup() {
      let status = ref(true);
      const toggleStatus = () =>{
        console.log(this.status)
      }
      return {
        status,
        toggleStatus
      };
    }
	}
</script>

<style lang="less" scoped>

</style>
