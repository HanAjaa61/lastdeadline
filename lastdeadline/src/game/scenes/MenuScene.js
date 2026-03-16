import Phaser from "phaser"

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene")
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.fadeIn(1000)

    this.hoverSound = this.sound.add("hoverSfx", { volume: 0.6 })
    this.clickSound = this.sound.add("clickSfx", { volume: 0.7 })

    this.bg = this.add.video(width / 2, height / 2, "menuVideo")
    this.bg.setOrigin(0.5)
    this.bg.play(true, true)

    if (this.bg.video && this.bg.video.readyState >= 1) {
      this.fitVideoToScreen()
    } else if (this.bg.video) {
      this.bg.video.addEventListener("loadedmetadata", () => {
        this.fitVideoToScreen()
      })
    }

    this.time.delayedCall(500, () => {
      this.fitVideoToScreen()
    })

    this.startMusic()

    this.add.text(width / 2, height * 0.2, "LAST DEADLINE", {
      fontSize: "48px",
      color: "#ffffff",
      fontFamily: "minecraft"
    }).setOrigin(0.5)

    const startBtn = this.add.text(width / 2, height * 0.55, "START", {
      fontSize: "36px",
      color: "#ffffff",
      fontFamily: "minecraft"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const guideBtn = this.add.text(width / 2, height * 0.65, "GUIDE", {
      fontSize: "36px",
      color: "#ffffff",
      fontFamily: "minecraft"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const exitBtn = this.add.text(width / 2, height * 0.75, "EXIT", {
      fontSize: "36px",
      color: "#ff4444",
      fontFamily: "minecraft"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    ;[startBtn, guideBtn, exitBtn].forEach(btn => {
      btn.on("pointerover", () => {
        this.hoverSound.play()
        btn.setStyle({ color: "#ff0000" })
      })
      btn.on("pointerout", () => {
        btn.setStyle({ color: btn === exitBtn ? "#ff4444" : "#ffffff" })
      })
    })

    startBtn.on("pointerdown", () => {
      this.clickSound.play()
      if (this.menuMusic) this.menuMusic.stop()
      if (this.bg) this.bg.stop()

      this.cameras.main.fadeOut(1000)

      let transitioned = false
      const goNext = () => {
        if (transitioned) return
        transitioned = true
        this.scene.start("ClockScene")
      }

      this.cameras.main.once("camerafadeoutcomplete", goNext)
      this.time.delayedCall(1100, goNext)
    })

    guideBtn.on("pointerdown", () => {
      this.clickSound.play()
      if (this.menuMusic) this.menuMusic.stop()
      if (this.bg) this.bg.stop()
      this.cameras.main.fadeOut(400)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GuideScene")
      })
    })

    exitBtn.on("pointerdown", () => {
      this.clickSound.play()
      if (this.menuMusic) this.menuMusic.stop()
      window.close()
    })

    this.scale.on("resize", this.handleResize, this)
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
      this.sound.context.resume().then(() => tryPlay()).catch(() => {
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

    const vidW = video.videoWidth || 1920
    const vidH = video.videoHeight || 1080

    const scaleX = width / vidW
    const scaleY = height / vidH
    const scale = Math.max(scaleX, scaleY)

    this.bg.setPosition(width / 2, height / 2)
    this.bg.setScale(scale)
  }

  handleResize() {
    this.fitVideoToScreen()
  }
}