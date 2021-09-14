<template>
  <img :src="src" alt="" class="cmp-img-shadow" :width="wd">
</template>
<script>
export default {
  props: {
    src: {
      type: String,
      required: true
    },
    wd: {
      type: String,
      default: '400px'
    }
  }
}
</script>
<style lang="less" scoped>
.cmp-img-shadow {
  margin: 20px 0;
  box-shadow: 10px 10px 30px #999;
  border-radius: 10px;
}
</style>