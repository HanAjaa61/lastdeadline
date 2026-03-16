import Phaser from "phaser"
import GameState from "./GameState"
import DoorCheckManager from "./DoorCheckManager"

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene")
  }

  init(data) {
    this.msg = data.msg || "Game Over!"
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false

    this.cameras.main.setBackgroundColor("#000000")

    this.sound.play("gameOverSfx", { volume: 0.8 })

    this.add.text(width / 2, height * 0.26, "GAME OVER", {
      fontSize: "58px", fontFamily: "minecraft", color: "#ff0000",
      stroke: "#440000", strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: "#ff0000", blur: 24, fill: true }
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.48, this.msg, {
      fontSize: "20px", fontFamily: "minecraft", color: "#ffffff",
      align: "center", lineSpacing: 12
    }).setOrigin(0.5)

    const retryBtn = this.add.text(width / 2 - 120, height * 0.68, "RETRY", {
      fontSize: "22px", fontFamily: "minecraft", color: "#00ff88"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    retryBtn.on("pointerover", () => retryBtn.setStyle({ color: "#ffffff" }))
    retryBtn.on("pointerout",  () => retryBtn.setStyle({ color: "#00ff88" }))
    retryBtn.on("pointerdown", () => {
      this.sound.play("clickSfx", { volume: 0.7 })
      DoorCheckManager.destroy()
      GameState.reset()
      this.stopAllScenes()
      this.goToScene("ClockScene")
    })

    const exitBtn = this.add.text(width / 2 + 120, height * 0.68, "EXIT", {
      fontSize: "22px", fontFamily: "minecraft", color: "#ff4444"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    exitBtn.on("pointerover", () => exitBtn.setStyle({ color: "#ffffff" }))
    exitBtn.on("pointerout",  () => exitBtn.setStyle({ color: "#ff4444" }))
    exitBtn.on("pointerdown", () => {
      this.sound.play("clickSfx", { volume: 0.7 })
      DoorCheckManager.destroy()
      GameState.reset()
      this.stopAllMusic()
      this.stopAllScenes()
      this.goToScene("MenuScene")
    })
  }

  stopAllScenes() {
    const overlayScenes = [
      "LMSScene", "GoputScene", "WIFIScene",
      "ComputerScene", "GameScene", "Scene2",
      "CekPintu", "ClockScene",
    ]
    overlayScenes.forEach(key => {
      try {
        if (this.scene.isActive(key) || this.scene.isPaused(key)) {
          this.scene.stop(key)
        }
      } catch (e) {}
    })
  }

  stopAllMusic() {
    const keys = ["gameBgm", "menuBgm", "lmsBgm"]
    keys.forEach(key => {
      const snd = this.sound.get(key)
      if (snd && snd.isPlaying) snd.stop()
    })
  }

  goToScene(key) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.scene.start(key)
  }
}