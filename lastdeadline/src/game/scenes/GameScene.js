import Phaser from "phaser"
import GameState from "./GameState"
import DoorCheckManager from "./DoorCheckManager"
import CCTVManager from "./CCTVManager"

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  create() {
    const { width, height } = this.scale

    DoorCheckManager.init(this)
    CCTVManager.init(this)

    this.isTransitioning = false
    this.cameras.main.setZoom(1)
    this.cameras.main.setScroll(0, 0)

    this.bgOff = this.add.image(width / 2, height / 2, "scene1off")
      .setOrigin(0.5)
      .setDisplaySize(width, height)

    this.bgOn = this.add.image(width / 2, height / 2, "scene1on")
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setVisible(false)

    this.clockHUD = this.add.text(16, 48, "", {
      fontSize: "22px",
      fontFamily: "minecraft",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(5)

    this.refreshClock()

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (!this.scene.isActive("GameScene")) return
        if (this.scene.isActive("ComputerScene")) return
        if (this.scene.isActive("CCTVScene")) return
        GameState.gameMinute++
        if (GameState.gameMinute >= 60) {
          GameState.gameMinute = 0
          GameState.gameHour++
          if (GameState.gameHour >= 13) {
            GameState.gameHour = 1
          }
        }
        this.refreshClock()
        if (GameState.isAM && GameState.gameHour === 5 && GameState.gameMinute === 0) {
          this.handleFiveAM()
        }
      }
    })

    this.promptText = this.add.text(width / 2, height * 0.88, "Tekan Shift untuk akses komputer", {
      fontSize: "20px",
      fontFamily: "minecraft",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    this.startPromptBlink()

    this.gameBgm = this.playBgm()

    this.laparWarned = false

    this.time.delayedCall(1000, () => this.startFlicker())

    this.input.keyboard.on("keydown-SHIFT", () => {
      this.sound.play("chairdragSfx", { volume: 0.7 })
      this.goToScene("ComputerScene")
    })

    this.addPixelArrow(width - 48, height / 2, "right", () => {
      this.sound.play("appClickSfx", { volume: 0.7 })
      this.fnaFPan("Scene2", "right")
    })
  }

  update(time, delta) {
    if (!this.scene.isActive("GameScene")) return
    if (this.isTransitioning) return

    const drain = (2 / 8000) * delta
    GameState.lapar = Math.max(0, GameState.lapar - drain)

    if (GameState.lapar < 60 && !this.laparWarned) {
      this.laparWarned = true
      this.sound.play("laparSfx", { volume: 0.8 })
    }
    if (GameState.lapar >= 60) this.laparWarned = false
    if (GameState.lapar <= 0) {
      this.goToScene("GameOverScene", {
        msg: "Asam lambungmu naik dan kamu\nditemukan dalam keadaan kritis\nesoknya oleh penjaga kosan !"
      })
    }
  }

  handleFiveAM() {
    if (this.isTransitioning) return
    if (GameState.taskSelesai < GameState.nightTarget()) {
      this.goToScene("GameOverScene", {
        msg: "Subuh tiba tapi tugasmu belum selesai !\nKamu kena skorsing karena deadline terlewat !"
      })
      return
    }
    if (GameState.night >= 3) {
      this.goToScene("FinalScene")
    } else {
      GameState.night++
      GameState.resetNight()
      DoorCheckManager.initNewNight(this)
      this.goToScene("ClockScene")
    }
  }

  shutdown() {
    DoorCheckManager.destroy()
  }

  addPixelArrow(cx, cy, dir, onClick) {
    const px = 10
    const color = 0xffffff
    const hoverColor = 0xffff88
    const pixels = dir === "right"
      ? [[0,0,1,0,0],[0,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,1,0,0]]
      : [[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1],[0,1,0,0,0],[0,0,1,0,0]]
    const cols = pixels[0].length
    const rows = pixels.length
    const totalW = cols * px
    const totalH = rows * px
    const ox = cx - totalW / 2
    const oy = cy - totalH / 2
    const rects = []
    pixels.forEach((row, r) => {
      row.forEach((on, c) => {
        if (!on) return
        const rect = this.add.rectangle(
          ox + c * px + px / 2,
          oy + r * px + px / 2,
          px - 1, px - 1, color
        ).setDepth(10)
        rects.push(rect)
      })
    })
    const hitArea = this.add.rectangle(cx, cy, totalW + 20, totalH + 20, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(11)
    hitArea.on("pointerover", () => rects.forEach(r => r.setFillStyle(hoverColor)))
    hitArea.on("pointerout",  () => rects.forEach(r => r.setFillStyle(color)))
    hitArea.on("pointerdown", onClick)
  }

  fnaFPan(key, dir) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()

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

  playBgm() {
    const all = this.sound.getAll("gameBgm")
    all.forEach((s, i) => { if (i > 0) { s.stop(); s.destroy() } })
    const bgm = all[0] || this.sound.add("gameBgm", { loop: true, volume: 0.4 })
    bgm.setVolume(0.4)
    if (!bgm.isPlaying) bgm.play()
    return bgm
  }

  refreshClock() {
    const hh = String(GameState.gameHour).padStart(2, "0")
    const mm = String(GameState.gameMinute).padStart(2, "0")
    if (this.clockHUD) this.clockHUD.setText(`${hh}:${mm} ${GameState.isAM ? "AM" : "PM"}`)
  }

  startPromptBlink() {
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        if (this.promptText) this.promptText.setVisible(!this.promptText.visible)
      }
    })
  }

  startFlicker() {
    const doFlicker = () => {
      if (!this.scene.isActive("GameScene")) return
      const flickerCount = Phaser.Math.Between(2, 5)
      const flickerDelay = Phaser.Math.Between(40, 80)
      let count = 0
      const timer = this.time.addEvent({
        delay: flickerDelay,
        repeat: flickerCount * 2,
        callback: () => {
          if (!this.scene.isActive("GameScene")) { timer.remove(); return }
          count++
          const isOn = count % 2 === 0
          this.bgOn.setVisible(isOn)
          this.bgOff.setVisible(!isOn)
          if (count >= flickerCount * 2) {
            timer.remove()
            const stayOn = Phaser.Math.Between(0, 1) === 1
            this.bgOn.setVisible(stayOn)
            this.bgOff.setVisible(!stayOn)
            this.time.delayedCall(Phaser.Math.Between(2000, 6000), doFlicker)
          }
        }
      })
    }
    doFlicker()
  }

  goToScene(key, data = {}) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
    this.cameras.main.fadeOut(500)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(key, data)
    })
  }
}