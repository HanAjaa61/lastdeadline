import Phaser from "phaser"
import GameState from "./GameState"
import DoorCheckManager from "./DoorCheckManager"

export default class CekPintu extends Phaser.Scene {
  constructor() {
    super("CekPintu")
  }

  init(data) {
    this.fromScene = data.from   || "Scene2"
    this.doorId    = data.doorId || "pintu_kiri"
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning  = false
    this.flashlightOn     = false
    this.anomaliVisible   = false
    this.anomaliHeldMs    = 0
    this.flashlightPlayed = false

    this.cameras.main.setBackgroundColor("#000000")
    this.cameras.main.fadeIn(150)

    this.bgOff = this.add.image(width / 2, height / 2, "cekpintuoff")
      .setOrigin(0.5).setDisplaySize(width, height)

    this.bgOn = this.add.image(width / 2, height / 2, "cekpintuon")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false)

    this.anomali1 = this.add.image(width / 2, height / 2, "anomali1")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false)
    this.anomali2 = this.add.image(width / 2, height / 2, "anomali2")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false)
    this.anomali3 = this.add.image(width / 2, height / 2, "anomali3")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false)

    this.glitchOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0)
      .setDepth(20)

    this.gameBgm  = this.playBgm("gameBgm",  0.4)
    this.ambience = this.playBgm("ambience", 0.4)

    this.clockHUD = this.add.text(16, 48, "", {
      fontSize: "22px", fontFamily: "minecraft",
      color: "#ffffff", stroke: "#000000", strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(10)
    this.refreshClock()

    this.checkHUD = this.add.text(16, 78, "", {
      fontSize: "15px", fontFamily: "minecraft",
      color: "#aaffaa", stroke: "#000000", strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(10)
    this.refreshCheckHUD()

    this.time.addEvent({
      delay: 2000, loop: true,
      callback: () => {
        if (!this.scene.isActive("CekPintu")) return
        GameState.gameMinute++
        if (GameState.gameMinute >= 60) {
          GameState.gameMinute = 0
          GameState.gameHour++
          if (GameState.gameHour >= 13) {
            GameState.gameHour = 1
          }
        }
        this.refreshClock()
        this.refreshCheckHUD()
        if (GameState.isAM && GameState.gameHour === 5 && GameState.gameMinute === 0) {
          this.handleFiveAM()
        }
      }
    })

    const hint = this.add.text(width / 2, height - 80,
      "Tekan dan tahan S untuk flashlight  |  Q untuk kembali", {
      fontSize: "16px", fontFamily: "minecraft",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10)

    this.time.addEvent({
      delay: 600, loop: true,
      callback: () => { if (hint) hint.setVisible(!hint.visible) }
    })

    this.input.keyboard.on("keydown-S", () => {
      if (this.isTransitioning) return
      if (this.flashlightOn) return
      if (!this.flashlightPlayed) {
        this.sound.play("flashlightSfx", { volume: 0.8 })
        this.flashlightPlayed = true
      }
      this.flashlightOn = true
      this.showFlashlight()
    })

    this.input.keyboard.on("keyup-S", () => {
      if (this.isTransitioning) return
      this.flashlightOn     = false
      this.flashlightPlayed = false
      this.anomaliVisible   = false
      this.anomaliHeldMs    = 0
      this.hideAllBg()
      this.bgOff.setVisible(true)
    })

    this.input.keyboard.on("keydown-Q", () => {
      if (this.isTransitioning) return
      this.sound.play("doorCloseSfx", { volume: 0.8 })
      this.fnaFPan(this.fromScene, "left")
    })

    this.time.addEvent({
      delay: 100, loop: true,
      callback: () => {
        if (!this.scene.isActive("CekPintu")) return
        if (this.flashlightOn && this.anomaliVisible) {
          this.anomaliHeldMs += 100
          if (this.anomaliHeldMs >= 2000) this.triggerJumpscare()
        }
        if (GameState.insanity >= 100) {
          this.goToGameOver("Kamu pingsan dan esoknya ditemukan\ndi depan pintu oleh tetangga kos mu!")
        }
      }
    })
  }

  handleFiveAM() {
    if (this.isTransitioning) return
    if (GameState.taskSelesai < GameState.nightTarget()) {
      this.isTransitioning = true
      this.stopAllBgm()
      this.cameras.main.fadeOut(500)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameOverScene", {
          msg: "Subuh tiba tapi tugasmu belum selesai !\nKamu kena skorsing karena deadline terlewat !"
        })
      })
      return
    }
    if (GameState.night >= 3) {
      this.fnaFPan("FinalScene", "right")
    } else {
      GameState.night++
      GameState.resetNight()
      DoorCheckManager.initNewNight(this)
      this.fnaFPan("ClockScene", "right")
    }
  }

  showFlashlight() {
    const chance = this.anomaliChance()
    this.hideAllBg()

    if (Math.random() < chance) {
      const idx = Phaser.Math.Between(1, 3)
      this["anomali" + idx].setVisible(true)
      this.anomaliVisible = true
      this.anomaliHeldMs  = 0
      GameState.insanity  = Math.min(100, GameState.insanity + 12)
      GameState.recordAnomaliFound()
      this.sound.play("anomaliSfx",  { volume: 0.9 })
      this.sound.play("insanitySfx", { volume: 0.6 })
      this.playGlitch()
      this.refreshCheckHUD()
    } else {
      this.bgOn.setVisible(true)
      this.anomaliVisible = false
      this.anomaliHeldMs  = 0
      DoorCheckManager.recordCheck(this.doorId)
      this.refreshCheckHUD()
    }
  }

  anomaliChance() {
    if (!GameState.isAM) return 0.01

    const h = GameState.gameHour === 12 ? 0 : GameState.gameHour
    const totalMin = h * 60 + GameState.gameMinute

    if (totalMin < 120) return 0.01
    if (totalMin < 180) return 0.03
    if (totalMin < 240) return 0.06
    return 0.10
  }

  playGlitch() {
    let count = 0
    const doGlitch = () => {
      if (count >= 6) { this.glitchOverlay.setAlpha(0); return }
      this.glitchOverlay.setAlpha(count % 2 === 0 ? 0.25 : 0)
      this.cameras.main.shake(80, 0.012)
      count++
      this.time.delayedCall(60, doGlitch)
    }
    doGlitch()
  }

  triggerJumpscare() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.stopAllBgm()
    this.cameras.main.flash(100, 255, 255, 255)
    this.time.delayedCall(120, () => {
      this.scene.start("JumpscareScene", { next: "GameOverScene", msg: "Kamu tertangkap oleh The Enggang !" })
    })
  }

  goToGameOver(msg) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.stopAllBgm()
    this.cameras.main.fadeOut(500)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameOverScene", { msg })
    })
  }

  playBgm(key, volume = 0.4) {
    if (this.sound.get(key)) {
      const s = this.sound.get(key)
      if (!s.isPlaying) s.play()
      return s
    }
    const s = this.sound.add(key, { loop: true, volume })
    s.play()
    return s
  }

  stopAllBgm() {
    if (this.gameBgm  && this.gameBgm.isPlaying)  this.gameBgm.stop()
    if (this.ambience && this.ambience.isPlaying)  this.ambience.stop()
  }

  hideAllBg() {
    this.bgOff.setVisible(false)
    this.bgOn.setVisible(false)
    this.anomali1.setVisible(false)
    this.anomali2.setVisible(false)
    this.anomali3.setVisible(false)
  }

  refreshCheckHUD() {
    const { kiri, kanan, quota } = DoorCheckManager.getProgress()
    const countdown = GameState.doorCheckCountdown || 0
    const total = kiri + kanan
    if (this.checkHUD) {
      this.checkHUD.setText(`Kiri: ${kiri}/${quota}  Kanan: ${kanan}/${quota}  |  ⏱ ${countdown}s`)
      this.checkHUD.setStyle({
        color: total >= 7 ? "#ff8888" : total >= 4 ? "#ffee88" : "#aaffaa",
        fontSize: "15px", fontFamily: "minecraft",
      })
    }
  }

  refreshClock() {
    const hh = String(GameState.gameHour).padStart(2, "0")
    const mm = String(GameState.gameMinute).padStart(2, "0")
    if (this.clockHUD) this.clockHUD.setText(`${hh}:${mm} ${GameState.isAM ? "AM" : "PM"}`)
  }

  fnaFPan(key, dir) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.stopAllBgm()
    const { width } = this.scale
    const cam = this.cameras.main
    const panDist = dir === "right" ? -width * 0.35 : width * 0.35
    cam.shake(80, 0.018)
    this.time.delayedCall(60, () => {
      this.tweens.add({
        targets: cam,
        scrollX: cam.scrollX + panDist,
        duration: 120,
        ease: "Cubic.easeIn",
        onComplete: () => {
          cam.flash(60, 255, 255, 255, false)
          cam.fadeOut(80)
          cam.once("camerafadeoutcomplete", () => {
            this.scene.start(key)
          })
        }
      })
    })
  }
}