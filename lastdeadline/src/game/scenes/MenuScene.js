import Phaser from "phaser"

// Ukuran target tombol dan judul dalam pixel (di canvas 1280x720)
const TITLE_W  = 580
const TITLE_H  = 260
const BTN_W    = 260
const BTN_H    = 180

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene")
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.fadeIn(1000)

    this.hoverSound = this.sound.add("hoverSfx", { volume: 0.6 })
    this.clickSound = this.sound.add("clickSfx", { volume: 0.7 })

    // ── Background video ──────────────────────────────────────────
    this.bg = this.add.video(width / 2, height / 2, "menuVideo")
    this.bg.setOrigin(0.5)
    this.bg.play(true, true)

    if (this.bg.video && this.bg.video.readyState >= 1) {
      this.fitVideoToScreen()
    } else if (this.bg.video) {
      this.bg.video.addEventListener("loadedmetadata", () => this.fitVideoToScreen())
    }
    this.time.delayedCall(500, () => this.fitVideoToScreen())

    this.startMusic()

    // ── Judul ─────────────────────────────────────────────────────
    this.add.image(width / 2, height * 0.28, "menuTitle")
      .setOrigin(0.5)
      .setDisplaySize(TITLE_W, TITLE_H)

    // ── Tombol START ──────────────────────────────────────────────
    const startBtn = this.add.image(width / 2, height * 0.57, "btnPlay")
      .setOrigin(0.5)
      .setDisplaySize(BTN_W, BTN_H)
      .setInteractive({ useHandCursor: true })

    // ── Tombol EXIT ───────────────────────────────────────────────
    const exitBtn = this.add.image(width / 2, height * 0.72, "btnExit")
      .setOrigin(0.5)
      .setDisplaySize(BTN_W, BTN_H)
      .setInteractive({ useHandCursor: true })

    // ── Hover / press effect ──────────────────────────────────────
    const BASE_W = BTN_W
    const BASE_H = BTN_H
    const HOVER_W = BTN_W * 1.08
    const HOVER_H = BTN_H * 1.08
    const PRESS_W = BTN_W * 0.94
    const PRESS_H = BTN_H * 0.94

    ;[startBtn, exitBtn].forEach(btn => {
      btn.on("pointerover", () => {
        this.hoverSound.play()
        this.tweens.add({ targets: btn, displayWidth: HOVER_W, displayHeight: HOVER_H, duration: 80, ease: "Sine.easeOut" })
      })
      btn.on("pointerout", () => {
        this.tweens.add({ targets: btn, displayWidth: BASE_W, displayHeight: BASE_H, duration: 80, ease: "Sine.easeOut" })
      })
      btn.on("pointerdown", () => {
        this.tweens.add({ targets: btn, displayWidth: PRESS_W, displayHeight: PRESS_H, duration: 60, ease: "Sine.easeOut" })
      })
      btn.on("pointerup", () => {
        this.tweens.add({ targets: btn, displayWidth: HOVER_W, displayHeight: HOVER_H, duration: 60, ease: "Sine.easeOut" })
      })
    })

    // ── Aksi START ────────────────────────────────────────────────
    startBtn.on("pointerdown", () => {
      this.clickSound.play()
      this._stopAndFade(() => this.scene.start("ClockScene"))
    })

    // ── Aksi EXIT ─────────────────────────────────────────────────
    exitBtn.on("pointerdown", () => {
      this.clickSound.play()
      this._stopAndFade(() => window.close())
    })

    this.scale.on("resize", this.handleResize, this)
  }

  // Fade out dulu, baru jalankan callback — dipakai startBtn & exitBtn
  _stopAndFade(callback) {
    if (this._transitioning) return
    this._transitioning = true

    if (this.menuMusic) this.menuMusic.stop()
    if (this.bg) this.bg.stop()

    this.cameras.main.fadeOut(600)

    let done = false
    const go = () => { if (done) return; done = true; callback() }
    this.cameras.main.once("camerafadeoutcomplete", go)
    this.time.delayedCall(700, go)
  }

  startMusic() {
    const existing = this.sound.get("menuBgm")
    if (existing) {
      if (!existing.isPlaying) existing.play()
      this.menuMusic = existing
      return
    }

    const tryPlay = () => {
      this.menuMusic = this.sound.add("menuBgm", { loop: true, volume: 0.35 })
      this.menuMusic.play()
    }

    if (this.sound.context.state === "running") {
      tryPlay()
    } else {
      this.sound.context.resume()
        .then(() => tryPlay())
        .catch(() => {
          this.input.once("pointerdown", () => {
            this.sound.context.resume().then(() => tryPlay())
          })
        })
    }
  }

  fitVideoToScreen() {
    if (!this.bg || !this.bg.video) return
    const { width, height } = this.scale
    const video = this.bg.video
    const vidW  = video.videoWidth  || 1920
    const vidH  = video.videoHeight || 1080
    const scale = Math.max(width / vidW, height / vidH)
    this.bg.setPosition(width / 2, height / 2)
    this.bg.setScale(scale)
  }

  handleResize() {
    this.fitVideoToScreen()
  }
}