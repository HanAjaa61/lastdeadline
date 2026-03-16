import DoorCheckManager from "./DoorCheckManager"
import Phaser from "phaser"
import GameState from "./GameState"

function getAnomalyChance() {
  let h    = GameState.gameHour
  let isAM = GameState.isAM
  let minutesFromMidnight
  if (isAM) {
    minutesFromMidnight = h === 12 ? 0 : h * 60
  } else {
    minutesFromMidnight = h === 12 ? 720 : (h + 12) * 60
  }
  minutesFromMidnight += GameState.gameMinute
  const t = Math.min(1, minutesFromMidnight / 300)
  return 0.15 + t * 0.50
}

export default class Scene2 extends Phaser.Scene {
  constructor() {
    super("Scene2")
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.anomalyActive   = false
    this.anomalyTimer    = null
    this.anomalyType     = null

    this.cameras.main.setZoom(1)
    this.cameras.main.setScroll(0, 0)
    this.cameras.main.fadeIn(200)

    this.bgOff = this.add.image(width / 2, height / 2, "scene2off")
      .setOrigin(0.5).setDisplaySize(width, height).setDepth(0)

    this.bgOn = this.add.image(width / 2, height / 2, "scene2on")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false).setDepth(0)

    this.bgAnomaliKiri = this.add.image(width / 2, height / 2, "anomalikiri")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false).setDepth(1)

    this.bgAnomaliKanan = this.add.image(width / 2, height / 2, "anomalikanan")
      .setOrigin(0.5).setDisplaySize(width, height).setVisible(false).setDepth(1)

    this.clockHUD = this.add.text(16, 48, "", {
      fontSize: "22px", fontFamily: "minecraft",
      color: "#ffffff", stroke: "#000000", strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(5)
    this.refreshClock()

    this.time.addEvent({
      delay: 2000, loop: true,
      callback: () => {
        if (!this.scene.isActive("Scene2")) return
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

    this.addPixelArrow(48, height / 2, "left", () => {
      if (this.anomalyActive) return
      this.sound.play("appClickSfx", { volume: 0.7 })
      this.fnaFPan("GameScene", "left")
    })

    this.addPointingArrow(205, 540, "up-right", () => {
      if (this.anomalyActive) return
      this.sound.play("appClickSfx", { volume: 0.7 })
      this.fnaFPan("CekPintu", "right", { from: "Scene2", doorId: "pintu_kiri" })
    })

    this.addPointingArrow(1075, 540, "up-left", () => {
      if (this.anomalyActive) return
      this.sound.play("appClickSfx", { volume: 0.7 })
      this.fnaFPan("CekPintu", "right", { from: "Scene2", doorId: "pintu_kanan" })
    })

    this._lemariArrow = this._buildLemariArrow(640, 480)

    this.gameBgm = this.playBgm()

    this.time.delayedCall(1000, () => this.startFlicker())
  }

  handleFiveAM() {
    if (this.isTransitioning) return
    if (GameState.taskSelesai < GameState.nightTarget()) {
      if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
      this.cameras.main.fadeOut(500)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameOverScene", {
          msg: "Subuh tiba tapi tugasmu belum selesai !\nKamu kena skorsing karena deadline terlewat !"
        })
      })
      this.isTransitioning = true
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

  _buildLemariArrow(cx, cy) {
    const gfx = this.add.graphics().setDepth(12)
    const drawArrow = (color) => {
      gfx.clear()
      gfx.fillStyle(color, 1)
      const p = 5
      gfx.fillRect(cx - p/2, cy - 24, p, 22)
      gfx.fillTriangle(cx, cy - 36, cx - 14, cy - 20, cx + 14, cy - 20)
    }
    drawArrow(0xffff00)

    const label = this.add.text(cx, cy + 8, "SEMBUNYI!", {
      fontSize: "13px", fontFamily: "minecraft",
      color: "#ffff00", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setDepth(12)

    const hitArea = this.add.rectangle(cx, cy - 10, 80, 70, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(13)

    hitArea.on("pointerover", () => drawArrow(0xffffff))
    hitArea.on("pointerout",  () => drawArrow(0xffff00))
    hitArea.on("pointerdown", () => {
      if (!this.anomalyActive || this.isTransitioning) return
      this._clearAnomalyTimer()
      this.fnaFPan("LemariScene", "right", { from: "Scene2", anomalyType: this.anomalyType })
    })

    const tween = this.tweens.add({
      targets: [gfx, label, hitArea],
      y: "-=8",
      duration: 400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      paused: true,
    })

    gfx.setVisible(false)
    label.setVisible(false)
    hitArea.setVisible(false)

    return { gfx, label, hitArea, tween, drawArrow }
  }

  _showLemariArrow() {
    const o = this._lemariArrow
    o.gfx.setVisible(true)
    o.label.setVisible(true)
    o.hitArea.setVisible(true)
    o.tween.resume()
  }

  _hideLemariArrow() {
    const o = this._lemariArrow
    o.gfx.setVisible(false)
    o.label.setVisible(false)
    o.hitArea.setVisible(false)
    o.tween.pause()
  }

  _trySpawnAnomaly() {
    if (this.anomalyActive || this.isTransitioning) return
    const chance = getAnomalyChance()
    if (Math.random() > chance) return

    this.anomalyType   = Math.random() < 0.5 ? "kiri" : "kanan"
    this.anomalyActive = true

    this.bgOff.setVisible(false)
    this.bgOn.setVisible(false)
    if (this.anomalyType === "kiri") {
      this.bgAnomaliKiri.setVisible(true)
      this.bgAnomaliKanan.setVisible(false)
    } else {
      this.bgAnomaliKanan.setVisible(true)
      this.bgAnomaliKiri.setVisible(false)
    }

    this._showLemariArrow()

    this.anomalyTimer = this.time.delayedCall(3000, () => {
      if (!this.anomalyActive) return
      this._triggerAnomalyJumpscare()
    })
  }

  _clearAnomalyTimer() {
    if (this.anomalyTimer) { this.anomalyTimer.remove(); this.anomalyTimer = null }
    this.anomalyActive = false
    this.anomalyType   = null
    this.bgAnomaliKiri.setVisible(false)
    this.bgAnomaliKanan.setVisible(false)
    this._hideLemariArrow()
  }

  _triggerAnomalyJumpscare() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this._hideLemariArrow()
    this.anomalyActive = false
    if (this.anomalyTimer) { this.anomalyTimer.remove(); this.anomalyTimer = null }
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()

    this.cameras.main.flash(100, 255, 255, 255)
    this.time.delayedCall(120, () => {
      this.scene.start("JumpscareScene", {
        next: "GameOverScene",
        msg: "Kamu terlambat bersembunyi...\nThe Enggang menemukanmu !"
      })
    })
  }

  startFlicker() {
    const doFlicker = () => {
      if (!this.scene.isActive("Scene2")) return
      if (this.isTransitioning) return

      this._trySpawnAnomaly()

      if (this.anomalyActive) {
        this.time.delayedCall(3100, () => {
          if (!this.scene.isActive("Scene2")) return
          if (!this.anomalyActive) doFlicker()
        })
        return
      }

      const flickerCount = Phaser.Math.Between(2, 5)
      const flickerDelay = Phaser.Math.Between(40, 80)
      let count = 0
      const timer = this.time.addEvent({
        delay: flickerDelay,
        repeat: flickerCount * 2,
        callback: () => {
          if (!this.scene.isActive("Scene2")) { timer.remove(); return }
          if (this.anomalyActive) { timer.remove(); return }
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

  addPointingArrow(cx, cy, dir, onClick) {
    const col = 0xffff88
    const container = this.add.container(cx, cy).setDepth(8)
    const gfx = this.add.graphics()
    gfx.fillStyle(col, 1)
    const p = 4
    if (dir === "up-right") {
      for (let i = 0; i < 5; i++) gfx.fillRect(-14 + i*5 - p/2, 14 - i*5 - p/2, p, p)
      gfx.fillTriangle(14, -14, 0, -10, 10, 0)
    } else if (dir === "up-left") {
      for (let i = 0; i < 5; i++) gfx.fillRect(14 - i*5 - p/2, 14 - i*5 - p/2, p, p)
      gfx.fillTriangle(-14, -14, 0, -10, -10, 0)
    }
    container.add(gfx)
    this.tweens.add({
      targets: container, y: cy - 7, duration: 420,
      ease: "Sine.easeInOut", yoyo: true, repeat: -1,
    })
    if (onClick) {
      const hitArea = this.add.rectangle(cx, cy, 52, 52, 0x000000, 0)
        .setInteractive({ useHandCursor: true }).setDepth(9)
      hitArea.on("pointerover", () => { gfx.clear(); gfx.fillStyle(0xffffff, 1); this._redrawArrow(gfx, dir) })
      hitArea.on("pointerout",  () => { gfx.clear(); gfx.fillStyle(col, 1);      this._redrawArrow(gfx, dir) })
      hitArea.on("pointerdown", onClick)
    }
  }

  _redrawArrow(gfx, dir) {
    const p = 4
    if (dir === "up-right") {
      for (let i = 0; i < 5; i++) gfx.fillRect(-14 + i*5 - p/2, 14 - i*5 - p/2, p, p)
      gfx.fillTriangle(14, -14, 0, -10, 10, 0)
    } else if (dir === "up-left") {
      for (let i = 0; i < 5; i++) gfx.fillRect(14 - i*5 - p/2, 14 - i*5 - p/2, p, p)
      gfx.fillTriangle(-14, -14, 0, -10, -10, 0)
    }
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
          ox + c * px + px / 2, oy + r * px + px / 2,
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

  fnaFPan(key, dir, data = {}) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()

    const { width } = this.scale
    const cam = this.cameras.main
    const panDist = dir === "right" ? -width * 0.35 : width * 0.35

    cam.shake(80, 0.018)
    this.time.delayedCall(60, () => {
      this.tweens.add({
        targets: cam, scrollX: cam.scrollX + panDist,
        duration: 120, ease: "Cubic.easeIn",
        onComplete: () => {
          cam.flash(60, 255, 255, 255, false)
          cam.fadeOut(80)
          cam.once("camerafadeoutcomplete", () => {
            this.scene.start(key, data)
          })
        }
      })
    })
  }

  playBgm() {
    if (this.sound.get("gameBgm")) {
      const existing = this.sound.get("gameBgm")
      if (!existing.isPlaying) existing.play()
      return existing
    }
    const bgm = this.sound.add("gameBgm", { loop: true, volume: 0.4 })
    bgm.play()
    return bgm
  }

  refreshClock() {
    const hh = String(GameState.gameHour).padStart(2, "0")
    const mm = String(GameState.gameMinute).padStart(2, "0")
    if (this.clockHUD) this.clockHUD.setText(`${hh}:${mm} ${GameState.isAM ? "AM" : "PM"}`)
  }

  shutdown() {
    this._clearAnomalyTimer()
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
  }
}