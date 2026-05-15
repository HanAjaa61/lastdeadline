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
    this.cameras.main.setZoom(1)

    this.sound.play("glitchSfx",      { volume: 1.2 })
    this.sound.play("jumpscareAudio", { volume: 1.5 })

    // ── Video jumpscare ───────────────────────────────────────────
    const video = this.add.video(width / 2, height / 2, "jumpscareVideo")
    video.setOrigin(0.5)
    video.setDepth(5)

    const applySize = () => {
      video.setDisplaySize(width * 0.42, height * 0.42)
    }
    applySize()
    if (video.video) {
      video.video.addEventListener("loadedmetadata", applySize, { once: true })
    }
    video.play()

    // ── Layer glitch di belakang video ────────────────────────────
    const glitchBg = this.add.graphics().setDepth(2)
    const drawGlitchBg = () => {
      glitchBg.clear()
      // Horizontal bars merah/putih acak FNAF-style
      const barCount = Phaser.Math.Between(6, 14)
      for (let i = 0; i < barCount; i++) {
        const y     = Phaser.Math.Between(0, height)
        const barH  = Phaser.Math.Between(2, 18)
        const r     = Math.random()
        const col   = r < 0.5 ? 0xff0000 : r < 0.75 ? 0xffffff : 0x000000
        const alpha = Phaser.Math.FloatBetween(0.15, 0.55)
        glitchBg.fillStyle(col, alpha)
        glitchBg.fillRect(0, y, width, barH)
      }
    }

    // ── Noise grain layer ─────────────────────────────────────────
    const noiseGfx = this.add.graphics().setDepth(7)
    const drawNoise = () => {
      noiseGfx.clear()
      for (let i = 0; i < 120; i++) {
        const col   = Math.random() > 0.5 ? 0xffffff : 0xff0000
        const alpha = Phaser.Math.FloatBetween(0.05, 0.22)
        noiseGfx.fillStyle(col, alpha)
        noiseGfx.fillRect(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height),
          Phaser.Math.Between(2, 90),
          Phaser.Math.Between(1, 5)
        )
      }
      // Scanlines berjalan ke bawah
      const scanY = (Date.now() / 4) % height
      noiseGfx.fillStyle(0xffffff, 0.06)
      noiseGfx.fillRect(0, scanY, width, 3)
      noiseGfx.fillRect(0, (scanY + height / 2) % height, width, 2)
    }

    // ── CRT scanlines statis ──────────────────────────────────────
    const scanlines = this.add.graphics().setDepth(8)
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x000000, 0.22)
      scanlines.fillRect(0, y, width, 2)
    }

    // ── Chromatic aberration ──────────────────────────────────────
    const rgbRed  = this.add.rectangle(width / 2 - 8, height / 2, width * 1.3, height * 1.3, 0xff0000, 0.18)
      .setDepth(6).setBlendMode(Phaser.BlendModes.ADD)
    const rgbBlue = this.add.rectangle(width / 2 + 8, height / 2, width * 1.3, height * 1.3, 0x0000ff, 0.18)
      .setDepth(6).setBlendMode(Phaser.BlendModes.ADD)

    // Aberration gerak acak
    this.time.addEvent({
      delay: 25, repeat: 80,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        rgbRed.setX(width / 2  + Phaser.Math.Between(-14, -4))
        rgbBlue.setX(width / 2 + Phaser.Math.Between(4,   14))
      }
    })
    this.tweens.add({
      targets: [rgbRed, rgbBlue], alpha: 0,
      duration: 1000, ease: "Expo.easeOut", delay: 400
    })

    // ── Flash putih + merah di awal ───────────────────────────────
    const flashWhite = this.add.rectangle(width/2, height/2, width, height, 0xffffff, 1).setDepth(10)
    this.tweens.add({ targets: flashWhite, alpha: 0, duration: 120, ease: "Expo.easeOut" })

    const flashRed = this.add.rectangle(width/2, height/2, width, height, 0xff0000, 0.9).setDepth(9)
    this.tweens.add({ targets: flashRed, alpha: 0, duration: 500, ease: "Expo.easeOut", delay: 60 })

    // ── Vignette hitam di tepi ────────────────────────────────────
    const vig = this.add.graphics().setDepth(9).setAlpha(0.7)
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.9, 0.9, 0, 0)
    vig.fillRect(0, 0, width, height * 0.22)
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9)
    vig.fillRect(0, height - height * 0.22, width, height * 0.22)

    // ── Camera shake FNAF-style — kencang di awal lalu meluruh ───
    this.cameras.main.shake(200, 0.06)
    this.time.delayedCall(200, () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(300, 0.10) })
    this.time.delayedCall(500, () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(400, 0.07) })
    this.time.delayedCall(900, () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(600, 0.04) })
    this.time.delayedCall(1500,() => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(800, 0.02) })

    // ── Video geser random cepat di awal ──────────────────────────
    this.time.addEvent({
      delay: 30, repeat: 45,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        video.setX(width / 2  + Phaser.Math.Between(-35, 35))
        video.setY(height / 2 + Phaser.Math.Between(-20, 20))
      }
    })
    this.time.delayedCall(1400, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.add({ targets: video, x: width / 2, y: height / 2, duration: 180, ease: "Sine.easeOut" })
    })

    // ── Kedip alpha video ─────────────────────────────────────────
    let flickerCount = 0
    const flickerTimer = this.time.addEvent({
      delay: 35, loop: true,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        flickerCount++
        const chance = flickerCount < 15 ? 0.35 : flickerCount < 40 ? 0.15 : 0.05
        video.setAlpha(Math.random() < chance ? 0.1 : 1)
      }
    })

    // ── Loop utama glitch — update setiap 30ms ────────────────────
    let glitchFrame = 0
    const glitchTimer = this.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        glitchFrame++
        drawNoise()

        // Glitch bg bars hanya di awal (60 frame pertama ~1.8 detik)
        if (glitchFrame < 60) {
          if (glitchFrame % 3 === 0) drawGlitchBg()
        } else {
          glitchBg.clear()
        }

        // Occasional horizontal tear pada video
        if (Math.random() < 0.12) {
          const offsetY = Phaser.Math.Between(-8, 8)
          video.setY(height / 2 + offsetY)
        }
      }
    })

    // ── goNext ────────────────────────────────────────────────────
    const goNext = () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.killAll()
      glitchTimer.remove()
      flickerTimer.remove()
      // Stop semua suara jumpscare sebelum pindah
      this.sound.stopAll()

      this.cameras.main.flash(80, 0, 0, 0)
      this.time.delayedCall(80, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0)
      })
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(this.nextScene, { msg: this.nextMsg })
      })
    }

    video.on("complete", goNext)
    this.time.delayedCall(5000, goNext)
  }
}