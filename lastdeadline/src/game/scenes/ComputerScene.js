import DoorCheckManager from "./DoorCheckManager"
import Phaser from "phaser"
import GameState from "./GameState"

export default class ComputerScene extends Phaser.Scene {
  constructor() {
    super("ComputerScene")
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.cameras.main.setZoom(1)

    this.add.image(width / 2, height / 2, "computerBg")
      .setOrigin(0.5)
      .setDisplaySize(width, height)

    this.gameBgm = this.playBgm()

    const iconSize   = 80
    const iconStartX = 130
    const iconStartY = 160
    const iconGap    = 140

    const apps = [
      { key: "icon1", label: "LMS",   scene: "LMSScene"   },
      { key: "icon2", label: "WiFi",  scene: "WIFIScene"  },
      { key: "icon3", label: "Goput", scene: "GoputScene" },
      { key: "cctv",  label: "CCTV",  scene: "CCTVScene"  },
    ]

    apps.forEach((app, i) => {
      const ix = iconStartX
      const iy = iconStartY + i * iconGap

      const selectBox = this.add.rectangle(ix, iy, iconSize + 14, iconSize + 14, 0x4488ff, 0)
        .setStrokeStyle(0)

      const icon = this.add.image(ix, iy, app.key)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ useHandCursor: true })

      const label = this.add.text(ix, iy + iconSize / 2 + 14, app.label, {
        fontSize: "15px",
        fontFamily: "minecraft",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      }).setOrigin(0.5)

      icon.on("pointerover", () => {
        this.sound.play("hoverSfx", { volume: 0.3 })
        icon.setTint(0xbbddff)
        selectBox.setFillStyle(0x4488ff, 0.2).setStrokeStyle(1, 0x88aaff)
        label.setStyle({ color: "#aaddff" })
      })

      icon.on("pointerout", () => {
        icon.clearTint()
        selectBox.setFillStyle(0x000000, 0).setStrokeStyle(0)
        label.setStyle({ color: "#ffffff" })
      })

      icon.on("pointerdown", () => {
        this.sound.play("appClickSfx", { volume: 0.7 })
        if ((app.scene === "LMSScene" || app.scene === "GoputScene") && GameState.wifiGanggu) {
          this.sound.play("notifErrorSfx", { volume: 0.8 })
          this.showNotif("404 Not Found\nCoba perbaiki dahulu jaringanmu !", "#ff4444")
          return
        }
        this.goToScene(app.scene)
      })
    })

    this.add.rectangle(width / 2, height - 24, width, 48, 0x111122, 0.96).setOrigin(0.5)
    this.add.rectangle(width / 2, height - 48, width, 2, 0x3333aa, 0.6).setOrigin(0.5)

    this.clockText = this.add.text(width / 2, height - 24, "", {
      fontSize: "18px",
      fontFamily: "minecraft",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.wifiIndicator = this.add.text(160, height - 24, "● WiFi: ON", {
      fontSize: "15px",
      fontFamily: "minecraft",
      color: "#00ff41",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5)

    this.promptBack = this.add.text(width / 2, height - 76, "Pencet Q untuk kembali", {
      fontSize: "16px",
      fontFamily: "minecraft",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5)

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.promptBack) this.promptBack.setVisible(!this.promptBack.visible)
      }
    })

    this.input.keyboard.on("keydown-Q", () => {
      if (this.scene.isActive("LMSScene"))   return
      if (this.scene.isActive("WIFIScene"))  return
      if (this.scene.isActive("GoputScene")) return
      this.sound.play("chairdragSfx", { volume: 0.7 })
      this.goToScene("GameScene")
    })

    this.buildHUD(width, height)

    this.refreshClock()

    this.time.addEvent({ delay: 2000, loop: true, callback: this.tickClock, callbackScope: this })

    this.laparWarned = false

    this.scheduleWifiEvent()

    this.notifBg = this.add.rectangle(width / 2, height * 0.12, 600, 80, 0x111111, 0.95)
      .setStrokeStyle(2, 0x4455ff)
      .setVisible(false)
      .setDepth(20)

    this.notifText = this.add.text(width / 2, height * 0.12, "", {
      fontSize: "16px",
      fontFamily: "minecraft",
      color: "#ffffff",
      align: "center",
    }).setOrigin(0.5).setVisible(false).setDepth(21)
  }

  update(time, delta) {
    if (!this.scene.isActive("ComputerScene")) return
    if (this.isTransitioning) return

    const drain = (2 / 8000) * delta
    GameState.lapar = Math.max(0, GameState.lapar - drain)
    this.updateHUD()

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

  buildHUD(width, height) {
    const pw   = 320
    const ph   = 200
    const px   = width - 60
    const py   = 85
    const gap  = 36
    const lx   = px - pw + 14
    const barX = px - pw + 110
    const barW = 192

    this.add.rectangle(px - pw / 2, py + ph / 2, pw, ph, 0xffffff, 0.12)
      .setStrokeStyle(1, 0xffffff, 0.2)

    this.hudClock = this.add.text(lx, py + gap * 1, "", {
      fontSize: "15px",
      fontFamily: "minecraft",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5)

    this.poinText = this.add.text(lx, py + gap * 2, "POIN: 0", {
      fontSize: "15px",
      fontFamily: "minecraft",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5)

    this.add.text(lx, py + gap * 3, "INSANITY", {
      fontSize: "13px",
      fontFamily: "minecraft",
      color: "#ff5555",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5)

    this.add.rectangle(barX, py + gap * 3, barW, 12, 0x330000).setOrigin(0, 0.5)
    this.insanityBar = this.add.rectangle(barX, py + gap * 3, 0, 12, 0xff2222).setOrigin(0, 0.5)

    this.add.text(lx, py + gap * 4, "LAPAR", {
      fontSize: "13px",
      fontFamily: "minecraft",
      color: "#ffaa00",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5)

    this.add.rectangle(barX, py + gap * 4, barW, 12, 0x332200).setOrigin(0, 0.5)
    this.laparBar = this.add.rectangle(barX, py + gap * 4, barW, 12, 0xff8800).setOrigin(0, 0.5)

    this.wifiStatusHUD = this.add.text(lx, py + gap * 5, "● WiFi: ON", {
      fontSize: "13px",
      fontFamily: "minecraft",
      color: "#00ff41",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0, 0.5)

    this.updateHUD()
  }

  updateHUD() {
    if (this.insanityBar) this.insanityBar.width = (GameState.insanity / 100) * 192
    if (this.laparBar)    this.laparBar.width    = (GameState.lapar    / 100) * 192
    if (this.poinText)    this.poinText.setText("POIN: " + GameState.poin)

    const wifiOn    = !GameState.wifiGanggu
    const wifiLabel = wifiOn ? "● WiFi: ON" : "● WiFi: OFF"
    const wifiColor = wifiOn ? "#00ff41" : "#ff3333"

    if (this.wifiStatusHUD) this.wifiStatusHUD.setText(wifiLabel).setStyle({ color: wifiColor })
    if (this.wifiIndicator) this.wifiIndicator.setText(wifiLabel).setStyle({ color: wifiColor })
  }

  refreshClock() {
    const hh = String(GameState.gameHour).padStart(2, "0")
    const mm = String(GameState.gameMinute).padStart(2, "0")
    const label = `${hh}:${mm} ${GameState.isAM ? "AM" : "PM"}`
    if (this.clockText) this.clockText.setText(label)
    if (this.hudClock)  this.hudClock.setText(label)
  }

  tickClock() {
    if (!this.scene.isActive("ComputerScene")) return
    GameState.gameMinute++
    if (GameState.gameMinute >= 60) {
      GameState.gameMinute = 0
      GameState.gameHour++
      if (GameState.gameHour >= 13) {
        GameState.gameHour = 1
      }
    }
    if (GameState.isAM && GameState.gameHour === 5 && GameState.gameMinute === 0) {
      this.handleFiveAM()
      return
    }
    this.refreshClock()
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

  scheduleWifiEvent() {
    const delay = Phaser.Math.Between(90000, 180000)
    this.time.delayedCall(delay, () => {
      if (!this.scene.isActive("ComputerScene")) return
      if (!GameState.wifiGanggu && Math.random() < 0.20) {
        GameState.wifiGanggu = true
        this.updateHUD()
        this.showNotif("Gangguan jaringan terdeteksi !", "#ff4444")
      }
      this.scheduleWifiEvent()
    })
  }

  showNotif(msg, color = "#ffffff") {
    if (!this.notifBg || !this.notifText) return
    this.notifBg.setVisible(true)
    this.notifText.setText(msg).setStyle({ color }).setVisible(true)
    this.time.delayedCall(3000, () => {
      if (this.notifBg)   this.notifBg.setVisible(false)
      if (this.notifText) this.notifText.setVisible(false)
    })
  }

  goToScene(key, data = {}) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    const OVERLAY_SCENES = ["LMSScene", "WIFIScene", "GoputScene"]
    if (OVERLAY_SCENES.includes(key)) {
      this.cameras.main.setVisible(false)
      this.scene.launch(key, data)
      this.isTransitioning = false
      return
    }
    if (key === "CCTVScene") {
      if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
      this.scene.start(key, data)
      return
    }
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
    this.cameras.main.fadeOut(500)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(key, data)
    })
  }

  resumeFromOverlay() {
    this.isTransitioning = false
    this.cameras.main.setVisible(true)
    this.refreshClock()
    this.updateHUD()
    if (this.gameBgm && !this.gameBgm.isPlaying) this.gameBgm.play()
  }
}