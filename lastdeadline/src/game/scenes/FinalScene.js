import Phaser from "phaser"
import GameState from "./GameState"

export default class FinalScene extends Phaser.Scene {
  constructor() {
    super("FinalScene")
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#000000")
    this.cameras.main.fadeIn(1000)

    this.clockSound = this.sound.add("clockTick", { volume: 0.8 })

    this.clockText = this.add.text(width / 2, height / 2 - 60, "05:00 AM", {
      fontSize: "96px", fontFamily: "minecraft", color: "#ffaa00",
      stroke: "#3b2000", strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: "#ffaa00", blur: 20, fill: true }
    }).setOrigin(0.5).setAlpha(0)

    this.nightText = this.add.text(width / 2, height / 2 + 30, "SUBUH TIBA", {
      fontSize: "28px", fontFamily: "minecraft", color: "#ffdd88"
    }).setOrigin(0.5).setAlpha(0)

    this.time.delayedCall(800, () => this.startSequence())
  }

  startSequence() {
    this.tweens.add({
      targets: [this.clockText, this.nightText],
      alpha: 1, duration: 400,
      onComplete: () => this.blinkClock()
    })
  }

  blinkClock() {
    try {
      const adzan = this.sound.get("adzan") || this.sound.add("adzan", { volume: 0.7 })
      if (!adzan.isPlaying) adzan.play()
    } catch (e) {}

    let count = 0
    const timer = this.time.addEvent({
      delay: 500, repeat: 12,
      callback: () => {
        count++
        const isOn = count % 2 === 0
        this.clockText.setText(isOn ? "05:00 AM" : "05 00 AM").setAlpha(isOn ? 1 : 0.85)
        if (isOn) { this.clockSound.stop(); this.clockSound.play({ seek: 0 }) }
        if (count >= 12) {
          timer.remove()
          this.clockSound.stop()
          this.time.delayedCall(400, () => this.showEnding())
        }
      }
    })
  }

  showEnding() {
    const { width, height } = this.scale

    this.tweens.add({
      targets: [this.clockText, this.nightText],
      alpha: 0, duration: 600,
      onComplete: () => {
        this.add.text(width / 2, height * 0.28, "SELAMAT !", {
          fontSize: "40px", fontFamily: "minecraft", color: "#ffdd00"
        }).setOrigin(0.5)

        this.add.text(width / 2, height * 0.44,
          "Kamu berhasil bertahan selama 3 malam\nmenyelesaikan semua tugas deadline\ndan siap berangkat kuliah !", {
          fontSize: "20px", fontFamily: "minecraft", color: "#ffffff",
          align: "center", lineSpacing: 10
        }).setOrigin(0.5)

        this.add.text(width / 2, height * 0.64, `Total Poin: ${GameState.poin}`, {
          fontSize: "18px", fontFamily: "minecraft", color: "#ffff00"
        }).setOrigin(0.5)

        const exitBtn = this.add.text(width / 2, height * 0.78, "EXIT KE MENU", {
          fontSize: "20px", fontFamily: "minecraft", color: "#aaaaaa"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })

        exitBtn.on("pointerover", () => exitBtn.setStyle({ color: "#ffffff" }))
        exitBtn.on("pointerout",  () => exitBtn.setStyle({ color: "#aaaaaa" }))
        exitBtn.on("pointerdown", () => {
          this.sound.play("clickSfx", { volume: 0.7 })
          GameState.reset()
          this.goToScene("MenuScene")
        })
      }
    })
  }

  goToScene(key) {
    this.cameras.main.fadeOut(500)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(key)
    })
  }
}