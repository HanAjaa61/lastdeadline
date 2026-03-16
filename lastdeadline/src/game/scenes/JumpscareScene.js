import Phaser from "phaser"
import GameState from "./GameState"

export default class JumpscareScene extends Phaser.Scene {
  constructor() {
    super("JumpscareScene")
  }

  init(data) {
    this.nextScene = data.next || "GameOverScene"
    this.nextMsg   = data.msg  || "Game Over!"
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor("#000000")

    this.sound.play("glitchSfx",      { volume: 1.0 })
    this.sound.play("jumpscareAudio", { volume: 1.0 })

    const maxZoom = 2.35
    const video = this.add.video(width / 2, height / 2, "jumpscareVideo")
    video.setOrigin(0.5)
    video.setDisplaySize(width * maxZoom * 1.1, height * maxZoom * 1.1)
    video.setDepth(5)
    video.play()

    // Zoom in mendadak dari kecil ke besar
    video.setScale(0.1)
    this.tweens.add({
      targets: video,
      scaleX: 1, scaleY: 1,
      duration: 120,
      ease: "Back.easeOut",
    })

    // Zoom in out loop cepat setelah masuk
    this.time.delayedCall(130, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.add({
        targets: video,
        scaleX: 1.06, scaleY: 1.06,
        duration: 80,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      })
    })

    // Camera zoom in mendadak lalu balik
    this.cameras.main.setZoom(1)
    this.tweens.add({
      targets: this.cameras.main,
      zoom: maxZoom,
      duration: 80,
      ease: "Expo.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 0.9,
          duration: 60,
          ease: "Expo.easeIn",
          onComplete: () => {
            this.tweens.add({
              targets: this.cameras.main,
              zoom: 1.1,
              duration: 200,
              ease: "Sine.easeInOut",
              yoyo: true,
              repeat: -1,
            })
          }
        })
      }
    })

    const scanlines = this.add.graphics().setDepth(8)
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x000000, 0.18)
      scanlines.fillRect(0, y, width, 2)
    }

    const noiseGfx = this.add.graphics().setDepth(7)
    this.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        noiseGfx.clear()
        noiseGfx.fillStyle(0xffffff, 0.08)
        for (let i = 0; i < 80; i++) {
          noiseGfx.fillRect(
            Phaser.Math.Between(0, width),
            Phaser.Math.Between(0, height),
            Phaser.Math.Between(2, 120),
            Phaser.Math.Between(1, 4)
          )
        }
      }
    })

    // Flash merah lebih kuat
    const flashRed = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0).setDepth(9)
    this.tweens.add({
      targets: flashRed,
      alpha: { from: 0.85, to: 0 },
      duration: 400,
      ease: "Expo.easeOut",
    })

    // Flash putih di awal biar kaget
    const flashWhite = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 1).setDepth(10)
    this.tweens.add({
      targets: flashWhite,
      alpha: 0,
      duration: 150,
      ease: "Expo.easeOut",
    })

    // Shake sangat kencang di awal
    this.cameras.main.shake(1000, 0.08)

    this.time.delayedCall(200, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.cameras.main.shake(500, 0.12)
    })

    this.time.delayedCall(700, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.cameras.main.shake(800, 0.06)
    })

    // Video geser random cepat
    this.time.addEvent({
      delay: 35, repeat: 40,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        const sx = Phaser.Math.Between(-40, 40)
        const sy = Phaser.Math.Between(-25, 25)
        video.setX(width / 2 + sx)
        video.setY(height / 2 + sy)
      }
    })

    // Setelah geser random, kembali ke tengah
    this.time.delayedCall(1500, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.add({
        targets: video,
        x: width / 2,
        y: height / 2,
        duration: 200,
        ease: "Sine.easeOut",
      })
    })

    // Kedip alpha cepat
    this.time.addEvent({
      delay: 45, loop: true,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        video.setAlpha(Math.random() < 0.15 ? 0.2 : 1)
      }
    })

    // Chromatic aberration simulasi
    const rgbRed  = this.add.rectangle(width / 2 - 6, height / 2, width * maxZoom * 1.1, height * maxZoom * 1.1, 0xff0000, 0.12).setDepth(6).setBlendMode(Phaser.BlendModes.ADD)
    const rgbBlue = this.add.rectangle(width / 2 + 6, height / 2, width * maxZoom * 1.1, height * maxZoom * 1.1, 0x0000ff, 0.12).setDepth(6).setBlendMode(Phaser.BlendModes.ADD)
    this.tweens.add({
      targets: [rgbRed, rgbBlue],
      alpha: 0,
      duration: 800,
      ease: "Expo.easeOut",
      delay: 200,
    })

    const goNext = () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.killAll()
      this.cameras.main.flash(300, 255, 255, 255)
      this.time.delayedCall(300, () => {
        this.scene.start(this.nextScene, { msg: this.nextMsg })
      })
    }

    video.on("complete", goNext)
    this.time.delayedCall(6000, goNext)
  }
}