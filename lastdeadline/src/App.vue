<script setup>
import { onMounted } from "vue"
import { startGame } from "./game/game"
import MobileBlock from "./components/MobileBlock.vue"

onMounted(() => {
  startGame("game-container")
})
</script>

<template>
  <MobileBlock />
  <div id="game-container"></div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: black;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

#app, #game-container {
  width: 100%;
  height: 100%;
}
</style>