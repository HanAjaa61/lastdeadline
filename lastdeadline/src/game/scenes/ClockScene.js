import Phaser from "phaser"
import GameState from "./GameState"

export default class ClockScene extends Phaser.Scene {
  constructor() {
    super("ClockScene")
  }

  create() {
    this.cameras.main.fadeIn(1000)
    const { width, height } = this.scale

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0)
    this.clockSound = this.sound.add("clockTick", { volume: 0.8 })

    this.clockText = this.add.text(width / 2, height / 2, "12:00 AM", {
      fontSize: "96px", fontFamily: "minecraft", color: "#00ff41",
      stroke: "#003b00", strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: "#00ff41", blur: 20, fill: true }
    }).setOrigin(0.5).setAlpha(0)

    this.nightText = this.add.text(width / 2, height / 2 + 80, `NIGHT ${GameState.night}`, {
      fontSize: "28px", fontFamily: "minecraft", color: "#ffffff"
    }).setOrigin(0.5).setAlpha(0)

    this.targetText = this.add.text(width / 2, height / 2 + 120,
      `Target: ${GameState.nightTarget()} soal`, {
      fontSize: "16px", fontFamily: "minecraft", color: "#aaaaaa"
    }).setOrigin(0.5).setAlpha(0)

    this.time.delayedCall(800, () => this.startClockSequence())
  }

  playClockSound() {
    this.clockSound.stop()
    this.clockSound.play({ seek: 0 })
  }

  startClockSequence() {
    this.tweens.add({
      targets: [this.clockText, this.nightText, this.targetText],
      alpha: 1, duration: 300,
      onComplete: () => this.blinkClock()
    })
  }

  blinkClock() {
    let blinkCount = 0
    const totalBlinks = 6
    const blinkTimer = this.time.addEvent({
      delay: 500, repeat: totalBlinks * 2,
      callback: () => {
        blinkCount++
        const isOn = blinkCount % 2 === 0
        if (isOn) {
          this.clockText.setText("12:00 AM").setAlpha(1)
          this.playClockSound()
        } else {
          this.clockText.setText("12 00 AM").setAlpha(0.85)
        }
        if (blinkCount >= totalBlinks * 2) {
          blinkTimer.remove()
          this.time.delayedCall(600, () => this.transitionToGame())
        }
      }
    })
  }

  transitionToGame() {
    this.clockSound.stop()
    this.cameras.main.fadeOut(500)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene")
    })
  }
}