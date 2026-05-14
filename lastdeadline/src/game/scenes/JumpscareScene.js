import Phaser from "phaser"

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

    this.sound.stopAll()
    this.sound.play("glitchSfx",      { volume: 1.5 })
    this.sound.play("jumpscareAudio", { volume: 2.0 })
    this.sound.play("jumpscare2Sfx",  { volume: 1.8 })

    const video = this.add.video(width / 2, height / 2, "jumpscareVideo")
    video.setOrigin(0.5)
    video.setDepth(5)
    video.play()

    const fitVideo = () => {
      const vw = video.width  || width
      const vh = video.height || height
      const scale = Math.max(width / vw, height / vh) * 1.08
      video.setScale(scale)
    }
    fitVideo()
    video.on("created", fitVideo)

    const savedScale = { x: video.scaleX, y: video.scaleY }
    video.setScale(0.05)
    this.tweens.add({
      targets: video,
      scaleX: savedScale.x,
      scaleY: savedScale.y,
      duration: 100,
      ease: "Expo.easeOut",
      onComplete: fitVideo,
    })

    this.time.delayedCall(150, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      fitVideo()
      this.tweens.add({
        targets: video,
        scaleX: video.scaleX * 1.04,
        scaleY: video.scaleY * 1.04,
        duration: 70,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      })
    })

    this.cameras.main.setZoom(0.75)

    this.cameras.main.shake(120,  0.018)
    this.time.delayedCall(120,  () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(200, 0.012) })
    this.time.delayedCall(320,  () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(300, 0.008) })
    this.time.delayedCall(620,  () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(400, 0.005) })
    this.time.delayedCall(1020, () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(600, 0.003) })
    this.time.delayedCall(1620, () => { if (!this.scene.isActive("JumpscareScene")) return; this.cameras.main.shake(800, 0.0015) })

    const flashWhite = this.add.rectangle(width/2, height/2, width*3, height*3, 0xffffff, 1).setDepth(20)
    this.tweens.add({
      targets: flashWhite,
      alpha: 0,
      duration: 180,
      ease: "Expo.easeOut",
    })

    const flashRed = this.add.rectangle(width/2, height/2, width*3, height*3, 0xff0000, 0.9).setDepth(19)
    this.tweens.add({
      targets: flashRed,
      alpha: 0,
      duration: 500,
      ease: "Expo.easeOut",
      delay: 80,
    })

    const rgbRed  = this.add.rectangle(width/2 - 10, height/2, width*3, height*3, 0xff0000, 0.22).setDepth(6).setBlendMode(Phaser.BlendModes.ADD)
    const rgbBlue = this.add.rectangle(width/2 + 10, height/2, width*3, height*3, 0x0000ff, 0.22).setDepth(6).setBlendMode(Phaser.BlendModes.ADD)

    this.time.addEvent({
      delay: 30, repeat: 60,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        rgbRed.setX(width/2  + Phaser.Math.Between(-15, -5))
        rgbBlue.setX(width/2 + Phaser.Math.Between(5,   15))
      }
    })

    this.tweens.add({
      targets: [rgbRed, rgbBlue],
      alpha: 0,
      duration: 1200,
      ease: "Expo.easeOut",
      delay: 300,
    })

    const scanlines = this.add.graphics().setDepth(8)
    for (let y = 0; y < height * 2; y += 4) {
      scanlines.fillStyle(0x000000, 0.2)
      scanlines.fillRect(0, y, width, 2)
    }

    const noiseGfx = this.add.graphics().setDepth(7)
    let noiseTimer = this.time.addEvent({
      delay: 25, loop: true,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        noiseGfx.clear()
        const barCount = Phaser.Math.Between(3, 10)
        for (let i = 0; i < barCount; i++) {
          noiseGfx.fillStyle(Math.random() > 0.5 ? 0xffffff : 0xff0000, Math.random() * 0.35)
          noiseGfx.fillRect(
            Phaser.Math.Between(-50, 0),
            Phaser.Math.Between(0, height),
            width + Phaser.Math.Between(0, 100),
            Phaser.Math.Between(1, 8)
          )
        }
        for (let i = 0; i < 60; i++) {
          noiseGfx.fillStyle(0xffffff, Math.random() * 0.12)
          noiseGfx.fillRect(
            Phaser.Math.Between(0, width),
            Phaser.Math.Between(0, height),
            Phaser.Math.Between(2, 80),
            Phaser.Math.Between(1, 3)
          )
        }
      }
    })

    let flickerCount = 0
    let flickerTimer = this.time.addEvent({
      delay: 40, loop: true,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        flickerCount++
        const chance = flickerCount < 20 ? 0.3 : flickerCount < 50 ? 0.15 : 0.05
        video.setAlpha(Math.random() < chance ? 0.1 : 1)
      }
    })

    this.time.addEvent({
      delay: 30, repeat: 60,
      callback: () => {
        if (!this.scene.isActive("JumpscareScene")) return
        video.setX(width/2  + Phaser.Math.Between(-50, 50))
        video.setY(height/2 + Phaser.Math.Between(-30, 30))
      }
    })

    this.time.delayedCall(1900, () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.add({
        targets: video,
        x: width/2, y: height/2,
        duration: 300,
        ease: "Sine.easeOut",
      })
    })

    const goNext = () => {
      if (!this.scene.isActive("JumpscareScene")) return
      this.tweens.killAll()
      noiseTimer.remove()
      flickerTimer.remove()
      this.sound.stopAll()
      if (this.jumpscare2 && this.jumpscare2.isPlaying) this.jumpscare2.stop()
      this.cameras.main.flash(80, 0, 0, 0)
      this.time.delayedCall(80, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0)
      })
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(this.nextScene, { msg: this.nextMsg })
      })
    }

    video.on("complete", goNext)
    this.time.delayedCall(6000, goNext)
  }
}