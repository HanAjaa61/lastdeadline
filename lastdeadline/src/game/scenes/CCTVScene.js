import DoorCheckManager from "./DoorCheckManager"
import Phaser from "phaser"
import GameState from "./GameState"
import CCTVManager from "./CCTVManager"

const CAMS = [
  { id: "cam1", label: "CAM 1", normal: "cam1normal", dark: "cam1dark", anomali: "cam1anomali" },
  { id: "cam2", label: "CAM 2", normal: "cam2normal", dark: "cam2dark", anomali: "cam2anomali" },
  { id: "cam3", label: "CAM 3", normal: "cam3normal", dark: "cam3dark", anomali: "cam3anomali" },
]

const FLICKER_INTERVAL = 120
const PAN_RANGE = 60   // max pixel geser kiri/kanan
const CAM_ZOOM  = 1.18 // gambar lebih besar dari layar supaya pan bebas tanpa tepi hitam

export default class CCTVScene extends Phaser.Scene {
  constructor() {
    super("CCTVScene")
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.currentCam      = 0
    this.anomalyActive   = false
    this.anomalyOnCam    = -1
    this.anomalyHeldMs   = 0
    this.isGlitching     = false
    this.noiseVideoEl    = null
    this._cctvUnlisten   = null
    this._noiseTimeout   = null
    this._noiseActive    = false
    this._noiseLoopVideo = null
    this._noiseOverlay   = null
    this._noiseQText     = null

    this.cameras.main.setBackgroundColor("#000000")
    this.gameBgm = this._playBgm()

    // Gambar FULLSCREEN + zoom agar pan bebas tanpa sisa hitam
    const screenW = width
    const screenH = height
    const screenX = width  / 2
    const screenY = height / 2

    this.screenW = screenW
    this.screenH = screenH
    this.screenX = screenX
    this.screenY = screenY

    this.camContainer = this.add.container(0, 0).setDepth(1)

    // Semua gambar cam (normal, dark, anomali) di-zoom CAM_ZOOM dan masuk camContainer
    this.camImages = CAMS.map((cam) => {
      const imgW = screenW * CAM_ZOOM
      const imgH = screenH * CAM_ZOOM
      const make = (key, fallbackColor) => this.textures.exists(key)
        ? this.add.image(screenX, screenY, key).setDisplaySize(imgW, imgH).setVisible(false)
        : this.add.rectangle(screenX, screenY, imgW, imgH, fallbackColor).setVisible(false)
      const imgs = {
        normal:  make(cam.normal,  0x112211),
        dark:    make(cam.dark,    0x050505),
        anomali: make(cam.anomali, 0x221100),
      }
      this.camContainer.add([imgs.normal, imgs.dark, imgs.anomali])
      return imgs
    })

    this._startCamPan()

    // CRT scanlines
    const crt = this.add.graphics().setDepth(3)
    for (let y = 0; y < screenH; y += 4) {
      crt.fillStyle(0x000000, 0.18)
      crt.fillRect(0, y, screenW, 2)
    }

    // Vignette
    const vig = this.add.graphics().setDepth(3)
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0)
    vig.fillRect(0, 0, screenW, screenH * 0.18)
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7)
    vig.fillRect(0, screenH - screenH * 0.18, screenW, screenH * 0.18)

    // Noise grain
    this.noiseGfx = this.add.graphics().setDepth(4)
    this._noiseLineY = 0
    this.time.addEvent({
      delay: 40, loop: true,
      callback: () => {
        if (!this.scene.isActive("CCTVScene")) return
        this.noiseGfx.clear()
        this._noiseLineY = (this._noiseLineY + Phaser.Math.Between(3, 8)) % screenH
        this.noiseGfx.fillStyle(0xffffff, 0.25)
        this.noiseGfx.fillRect(0, this._noiseLineY, screenW, Phaser.Math.Between(1, 5))
        this.noiseGfx.fillStyle(0xffffff, 0.18)
        for (let i = 0; i < 180; i++) {
          this.noiseGfx.fillRect(
            Phaser.Math.Between(0, screenW), Phaser.Math.Between(0, screenH),
            Phaser.Math.Between(1, 5), Phaser.Math.Between(1, 5)
          )
        }
        this.noiseGfx.fillStyle(0x000000, 0.14)
        for (let i = 0; i < 80; i++) {
          this.noiseGfx.fillRect(
            Phaser.Math.Between(0, screenW), Phaser.Math.Between(0, screenH),
            Phaser.Math.Between(1, 4), Phaser.Math.Between(1, 4)
          )
        }
        if (Math.random() < 0.18) {
          const tearY = Phaser.Math.Between(0, screenH)
          const tearW = Phaser.Math.Between(screenW * 0.3, screenW * 0.95)
          const tearX = Phaser.Math.Between(0, screenW - tearW)
          this.noiseGfx.fillStyle(0xffffff, 0.28)
          this.noiseGfx.fillRect(tearX, tearY, tearW, Phaser.Math.Between(2, 9))
        }
        if (Math.random() < 0.07) {
          const bandY = Phaser.Math.Between(0, screenH)
          this.noiseGfx.fillStyle(0xffffff, 0.10)
          this.noiseGfx.fillRect(0, bandY, screenW, Phaser.Math.Between(10, 30))
        }
      }
    })

    // RGB aberration
    this.rgbRed  = this.add.graphics().setDepth(5).setAlpha(0.10)
    this.rgbBlue = this.add.graphics().setDepth(5).setAlpha(0.10)
    this.rgbRed.fillStyle(0xff0000, 1);  this.rgbRed.fillRect(-4, 0, screenW, screenH)
    this.rgbBlue.fillStyle(0x0000ff, 1); this.rgbBlue.fillRect(4, 0, screenW, screenH)

    // Flicker overlay
    this.flickerOverlay = this.add.rectangle(screenX, screenY, screenW, screenH, 0x000000, 0).setDepth(5)
    this.time.addEvent({
      delay: Phaser.Math.Between(3000, 8000), loop: false,
      callback: () => this._doRandomFlicker()
    })

    // Glitch overlay
    this.glitchOverlay = this.add.rectangle(screenX, screenY, screenW, screenH, 0xffffff, 0).setDepth(7)
    this.glitchLines   = this.add.graphics().setDepth(7)

    // HUD — label cam + timestamp (kiri atas)
    this.camLabel = this.add.text(14, 12, "CAM 1", {
      fontSize: "16px", fontFamily: "minecraft", color: "#00ff41",
      stroke: "#000000", strokeThickness: 3
    }).setDepth(10)

    this.tsText = this.add.text(14, 34, "", {
      fontSize: "13px", fontFamily: "minecraft", color: "#ffffff",
      stroke: "#000000", strokeThickness: 2
    }).setDepth(10)
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this._refreshTimestamp() })
    this._refreshTimestamp()

    this.time.addEvent({
      delay: 2000, loop: true,
      callback: () => {
        if (!this.scene.isActive("CCTVScene")) return
        GameState.gameMinute++
        if (GameState.gameMinute >= 60) {
          GameState.gameMinute = 0
          GameState.gameHour++
          if (GameState.gameHour >= 13) GameState.gameHour = 1
        }
        this._refreshTimestamp()
        if (GameState.isAM && GameState.gameHour === 5 && GameState.gameMinute === 0) {
          this._handleFiveAM()
        }
      }
    })

    // REC dot (kanan atas)
    this.recDot = this.add.circle(width - 80, 20, 6, 0xff2222).setDepth(10)
    this.add.text(width - 68, 12, "REC", {
      fontSize: "14px", fontFamily: "minecraft", color: "#ff2222",
      stroke: "#000000", strokeThickness: 2
    }).setDepth(10)
    this.time.addEvent({ delay: 800, loop: true, callback: () => { this.recDot.setVisible(!this.recDot.visible) } })

    // Tombol CAM (kiri bawah, overlay di atas gambar)
    const btnY      = height - 34
    const btnGap    = 120
    const btnStartX = 80

    this.camBtns = CAMS.map((cam, i) => {
      const bx  = btnStartX + i * btnGap
      const bg  = this.add.rectangle(bx, btnY, 100, 34, 0x000000, 0.55)
        .setDepth(10).setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x444444)
      const txt = this.add.text(bx, btnY, cam.label, {
        fontSize: "14px", fontFamily: "minecraft", color: "#aaaaaa"
      }).setOrigin(0.5).setDepth(11)
      bg.on("pointerover", () => { if (i !== this.currentCam) bg.setFillStyle(0x224422) })
      bg.on("pointerout",  () => { if (i !== this.currentCam) bg.setFillStyle(0x000000) })
      bg.on("pointerdown", () => {
        if (this.isGlitching) return
        if (i === this.currentCam) return
        this._switchCam(i)
      })
      return { bg, txt }
    })

    // Tombol SPECTA (kanan bawah, overlay)
    const spectaX = width - 90
    const spectaY = height - 34
    this.spectaBg = this.add.rectangle(spectaX, spectaY, 140, 44, 0x440000, 0.75)
      .setDepth(10).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xff2222)
    this.spectaTxt = this.add.text(spectaX, spectaY, "SPECTA", {
      fontSize: "17px", fontFamily: "minecraft", color: "#ff4444",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setDepth(11)
    this.spectaBg.on("pointerover", () => this.spectaBg.setFillStyle(0x660000))
    this.spectaBg.on("pointerout",  () => this.spectaBg.setFillStyle(this.anomalyActive ? 0x880000 : 0x440000))
    this.spectaBg.on("pointerdown", () => { if (this.isTransitioning) return; this._onSpecta() })

    // Tombol keluar (tengah bawah)
    this.add.text(width / 2, height - 34, "[ Q ] Keluar", {
      fontSize: "13px", fontFamily: "minecraft", color: "#555555",
      stroke: "#000000", strokeThickness: 2
    }).setOrigin(0.5).setDepth(10)

    this.input.keyboard.on("keydown-Q", () => {
      if (this.isTransitioning) return
      this._exit()
    })

    // Init
    this._hideAllCams()
    try { this.sound.play("cctvOpenSfx", { volume: 0.8 }) } catch (e) {}
    this._playNoise(() => {
      if (CCTVManager.isAnomalyActive()) this._onAnomalySpawn()
      this._applyCam(0)
      this._updateCamBtns()
      this._startFlicker()
    })

    this._cctvUnlisten = CCTVManager.on((event) => {
      if (!this.scene.isActive("CCTVScene")) return
      if (event === "spawn")     this._onAnomalySpawn()
      if (event === "clear")     this._onAnomalyClear()
      if (event === "jumpscare") this._triggerAnomalyJumpscare()
    })

    this._wifiWatcher = this.time.addEvent({
      delay: 3000, loop: true,
      callback: () => {
        if (!this.scene.isActive("CCTVScene")) return
        if (this.isTransitioning) return
        if (GameState.wifiGanggu && !this._noiseActive) {
          this._showNoiseInterrupt()
        } else if (!GameState.wifiGanggu && this._noiseActive) {
          this._hideNoiseInterrupt()
        }
      }
    })

    if (GameState.wifiGanggu) {
      this._showNoiseInterrupt()
    }
  }

  _startCamPan() {
    // Sinusoidal — gerak full kiri → kanan → kiri terus menerus, smooth tanpa patah
    // _panSpeed = seberapa cepat (radian per ms). Lebih kecil = lebih lambat.
    this._panTime = 0
    this._panSpeed = 0.00035  // sekitar 18 detik per siklus penuh

    this.time.addEvent({
      delay: 16, loop: true,
      callback: () => {
        if (!this.scene.isActive("CCTVScene")) return
        this._panTime += 16
        this.camContainer.x = Math.sin(this._panTime * this._panSpeed) * PAN_RANGE
      }
    })
  }

  _showNoiseInterrupt() {
    if (this._noiseActive) return
    this._noiseActive = true
    const { screenW, screenH, screenX, screenY } = this
    this._noiseOverlay = this.add.rectangle(screenX, screenY, screenW, screenH, 0x000000, 1).setDepth(8)
    if (this.cache.video && this.cache.video.has("cctvNoise")) {
      this._noiseLoopVideo = this.add.video(screenX, screenY, "cctvNoise")
        .setDisplaySize(screenW, screenH).setDepth(9)
      this._noiseLoopVideo.play(true)
    }
    this._noiseQText = this.add.text(screenX, screenY + screenH / 2 - 40, "[ Q ] Kembali", {
      fontSize: "16px", fontFamily: "minecraft", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setDepth(10)
    let vis = true
    this._noiseQBlink = this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { vis = !vis; if (this._noiseQText) this._noiseQText.setVisible(vis) }
    })
  }

  _hideNoiseInterrupt() {
    if (!this._noiseActive) return
    this._noiseActive = false
    if (this._noiseQBlink)    { this._noiseQBlink.remove();   this._noiseQBlink   = null }
    if (this._noiseLoopVideo) {
      try { this._noiseLoopVideo.stop(); this._noiseLoopVideo.destroy() } catch(e) {}
      this._noiseLoopVideo = null
    }
    if (this._noiseOverlay) { this._noiseOverlay.destroy(); this._noiseOverlay = null }
    if (this._noiseQText)   { this._noiseQText.destroy();   this._noiseQText   = null }
  }

  _handleFiveAM() {
    if (this.isTransitioning) return
    if (GameState.taskSelesai < GameState.nightTarget()) {
      this.isTransitioning = true
      this._stopAll()
      this.cameras.main.fadeOut(500)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameOverScene", {
          msg: "Subuh tiba tapi tugasmu belum selesai !\nKamu kena skorsing karena deadline terlewat !"
        })
      })
      return
    }
    this.isTransitioning = true
    this._stopAll()
    this.cameras.main.fadeOut(500)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (GameState.night >= 3) {
        this.scene.start("FinalScene")
      } else {
        GameState.night++
        GameState.resetNight()
        DoorCheckManager.initNewNight(this)
        this.scene.start("ClockScene")
      }
    })
  }

  _doRandomFlicker() {
    if (!this.scene.isActive("CCTVScene")) return
    const count = Phaser.Math.Between(2, 5)
    let i = 0
    const step = () => {
      if (i >= count * 2) {
        this.flickerOverlay.setAlpha(0)
        this.time.delayedCall(Phaser.Math.Between(3000, 9000), () => this._doRandomFlicker())
        return
      }
      this.flickerOverlay.setAlpha(i % 2 === 0 ? Phaser.Math.FloatBetween(0.15, 0.5) : 0)
      i++
      this.time.delayedCall(Phaser.Math.Between(40, 100), step)
    }
    step()
  }

  _hideAllCams() {
    if (!this.camImages) return
    this.camImages.forEach(imgs => {
      imgs.normal.setVisible(false)
      imgs.dark.setVisible(false)
      imgs.anomali.setVisible(false)
    })
  }

  _playNoise(onDone) {
    this.isGlitching = true
    this._killNoise()
    const hasVideo = this.cache.video && this.cache.video.has("cctvNoise")
    if (!hasVideo) { this._fallbackGlitch(onDone); return }
    const { screenW, screenH, screenX, screenY } = this
    const vid = this.add.video(screenX, screenY, "cctvNoise")
      .setDisplaySize(screenW, screenH).setDepth(9)
    this.noiseVideoEl = vid
    let done = false
    const finish = () => {
      if (done) return; done = true
      this._killNoise()
      this.isGlitching = false
      if (onDone) onDone()
    }
    vid.on("complete", finish)
    vid.on("error",    finish)
    this._noiseTimeout = this.time.delayedCall(3000, finish)
    vid.play(false)
  }

  _killNoise() {
    if (this._noiseTimeout) { this._noiseTimeout.remove(); this._noiseTimeout = null }
    if (this.noiseVideoEl)  {
      try { this.noiseVideoEl.stop(); this.noiseVideoEl.destroy() } catch (e) {}
      this.noiseVideoEl = null
    }
  }

  _fallbackGlitch(onDone) {
    let count = 0
    const step = () => {
      if (count >= 8) {
        this.glitchOverlay.setAlpha(0)
        this.glitchLines.clear()
        this.isGlitching = false
        if (onDone) onDone()
        return
      }
      this.glitchOverlay.setAlpha(count % 2 === 0 ? 0.35 : 0)
      this.glitchLines.clear()
      if (count % 2 === 0) {
        const { screenW, screenH, screenX, screenY } = this
        for (let i = 0; i < 6; i++) {
          const ly = screenY - screenH / 2 + Phaser.Math.Between(0, screenH)
          this.glitchLines.fillStyle(0xffffff, 0.18)
          this.glitchLines.fillRect(screenX - screenW / 2 + Phaser.Math.Between(-30, 30), ly, screenW, Phaser.Math.Between(2, 14))
        }
      }
      count++
      this.time.delayedCall(60, step)
    }
    step()
  }

  _playBgm() {
    if (this.sound.get("gameBgm")) {
      const s = this.sound.get("gameBgm")
      if (!s.isPlaying) s.play()
      return s
    }
    const s = this.sound.add("gameBgm", { loop: true, volume: 0.4 })
    s.play()
    return s
  }

  _refreshTimestamp() {
    const hh = String(GameState.gameHour).padStart(2, "0")
    const mm = String(GameState.gameMinute).padStart(2, "0")
    if (this.tsText) this.tsText.setText(`${hh}:${mm} ${GameState.isAM ? "AM" : "PM"}`)
  }

  _switchCam(idx) {
    if (this.isGlitching) return
    try { this.sound.play("cctvsfx", { volume: 0.5 }) } catch (e) {}
    this._playNoise(() => {
      this._applyCam(idx)
      this._updateCamBtns()
    })
  }

  _applyCam(idx) {
    this.camImages.forEach(imgs => {
      imgs.normal.setVisible(false)
      imgs.dark.setVisible(false)
      imgs.anomali.setVisible(false)
    })
    this.currentCam = idx
    const showAnomali = this.anomalyActive && this.anomalyOnCam === idx
    if (showAnomali) {
      this.camImages[idx].anomali.setVisible(true)
    } else {
      this.camImages[idx].normal.setVisible(true)
    }
    if (this.camLabel) this.camLabel.setText(CAMS[idx].label)
  }

  _updateCamBtns() {
    this.camBtns.forEach(({ bg, txt }, i) => {
      if (i === this.currentCam) {
        bg.setFillStyle(0x224422).setStrokeStyle(1, 0x44ff44)
        txt.setStyle({ color: "#44ff44", fontSize: "14px", fontFamily: "minecraft" })
      } else {
        bg.setFillStyle(0x000000).setStrokeStyle(1, 0x444444)
        txt.setStyle({ color: "#aaaaaa", fontSize: "14px", fontFamily: "minecraft" })
      }
    })
  }

  _startFlicker() {
    const doFlick = () => {
      if (!this.scene.isActive("CCTVScene")) return
      if (this.isGlitching) { this.time.delayedCall(600, doFlick); return }
      const idx  = this.currentCam
      const imgs = this.camImages[idx]
      if (this.anomalyActive && this.anomalyOnCam === idx) {
        this.time.delayedCall(Phaser.Math.Between(1500, 4000), doFlick)
        return
      }
      imgs.normal.setVisible(false)
      imgs.dark.setVisible(true)
      this.time.delayedCall(FLICKER_INTERVAL * Phaser.Math.Between(1, 3), () => {
        if (!this.scene.isActive("CCTVScene")) return
        if (this.isGlitching) { imgs.dark.setVisible(false); this.time.delayedCall(600, doFlick); return }
        imgs.dark.setVisible(false)
        if (this.currentCam === idx && !(this.anomalyActive && this.anomalyOnCam === idx)) {
          imgs.normal.setVisible(true)
        }
        this.time.delayedCall(Phaser.Math.Between(1500, 4000), doFlick)
      })
    }
    this.time.delayedCall(Phaser.Math.Between(2000, 5000), doFlick)
  }

  _onAnomalySpawn() {
    this.anomalyActive = true
    this.anomalyOnCam  = Phaser.Math.Between(0, 2)
    if (this.anomalyOnCam === this.currentCam && !this.isGlitching) {
      this.camImages[this.currentCam].normal.setVisible(false)
      this.camImages[this.currentCam].dark.setVisible(false)
      this.camImages[this.currentCam].anomali.setVisible(true)
    }
    this._spawnGlitch()
    this.spectaBg.setFillStyle(0x880000).setStrokeStyle(2, 0xff0000)
    this.spectaTxt.setStyle({ color: "#ff0000", fontSize: "17px", fontFamily: "minecraft" })
  }

  _spawnGlitch() {
    let c = 0
    const step = () => {
      if (c >= 4) { this.glitchOverlay.setAlpha(0); this.glitchLines.clear(); return }
      this.glitchOverlay.setFillStyle(0xff0000).setAlpha(c % 2 === 0 ? 0.2 : 0)
      this.glitchLines.clear()
      if (c % 2 === 0) {
        for (let i = 0; i < 4; i++) {
          const ly = Phaser.Math.Between(0, this.screenH)
          this.glitchLines.fillStyle(0xff0000, 0.3)
          this.glitchLines.fillRect(0, ly, this.screenW, Phaser.Math.Between(2, 8))
        }
      }
      c++
      this.time.delayedCall(55, step)
    }
    step()
    this.cameras.main.shake(120, 0.008)
  }

  _onAnomalyClear() {
    const camIdx = this.anomalyOnCam
    this.anomalyActive = false
    this.anomalyOnCam  = -1
    this.anomalyHeldMs = 0
    if (camIdx >= 0) {
      this.camImages[camIdx].anomali.setVisible(false)
      if (camIdx === this.currentCam && !this.isGlitching) {
        this.camImages[camIdx].normal.setVisible(true)
      }
    }
    this.spectaBg.setFillStyle(0x440000).setStrokeStyle(2, 0xff2222)
    this.spectaTxt.setStyle({ color: "#ff4444", fontSize: "17px", fontFamily: "minecraft" })
  }

  _onSpecta() {
    try { this.sound.play("spectaSfx", { volume: 1.0 }) } catch (e) {}
    if (!this.anomalyActive) return
    const camIdx = this.anomalyOnCam
    this.cameras.main.flash(200, 255, 255, 255)
    this.cameras.main.shake(300, 0.025)
    this.camImages[camIdx].anomali.setVisible(false)
    this.glitchOverlay.setFillStyle(0xffffff).setAlpha(1)
    this.time.delayedCall(80, () => {
      this.glitchOverlay.setAlpha(0)
      if (camIdx === this.currentCam && !this.isGlitching) {
        this.camImages[camIdx].normal.setVisible(true)
      }
      this.time.delayedCall(60, () => {
        this.glitchOverlay.setAlpha(0.5)
        this.cameras.main.shake(150, 0.015)
        this.time.delayedCall(80, () => {
          this.glitchOverlay.setAlpha(0.2)
          this.time.delayedCall(80, () => { this.glitchOverlay.setAlpha(0) })
        })
      })
    })
    CCTVManager.clearAnomaly()
    this.anomalyActive = false
    this.anomalyOnCam  = -1
    this.anomalyHeldMs = 0
    this.spectaBg.setFillStyle(0x440000).setStrokeStyle(2, 0xff2222)
    this.spectaTxt.setStyle({ color: "#ff4444", fontSize: "17px", fontFamily: "minecraft" })
  }

  _triggerAnomalyJumpscare() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this._stopAll()
    this.cameras.main.flash(120, 255, 255, 255)
    this.time.delayedCall(150, () => {
      this.scene.start("JumpscareScene", {
        next: "GameOverScene",
        msg: "The Enggang sangat rispek dengan teriakan specta\nsehingga jika dia muncul, segera teriakkan specta\ndan dia tidak akan menangkapmu !"
      })
    })
  }

  _exit() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this._stopAll()
    this.cameras.main.fadeOut(400)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("ComputerScene")
    })
  }

  _stopAll() {
    if (this._noiseTimeout) { this._noiseTimeout.remove();  this._noiseTimeout  = null }
    if (this._cctvUnlisten) { this._cctvUnlisten();          this._cctvUnlisten  = null }
    if (this._wifiWatcher)  { this._wifiWatcher.remove();    this._wifiWatcher   = null }
    if (this._noiseQBlink)  { this._noiseQBlink.remove();    this._noiseQBlink   = null }
    this._hideNoiseInterrupt()
    this._killNoise()
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
  }

  shutdown() { this._stopAll() }
}