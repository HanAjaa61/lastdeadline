import Phaser from "phaser"
import GameState from "./GameState"

const MENU = [
  { key: "mieAyam",    label: "Mie Ayam",    harga: 80,  lapar: 40, insanity: -30, desc: "Lapar +40  Insanity -30" },
  { key: "ayamGeprek", label: "Ayam Geprek", harga: 60,  lapar: 25, insanity: -15, desc: "Lapar +25  Insanity -15" },
  { key: "kopi",       label: "Kopi",        harga: 35,  lapar: 10, insanity: -8,  desc: "Lapar +10  Insanity -8"  },
]

export default class GoputScene extends Phaser.Scene {
  constructor() {
    super("GoputScene")
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.gameBgm = this.playBgm()

    this.add.rectangle(0, 0, width, height, 0x0a1a0a).setOrigin(0)

    const formW = 780
    const formH = 560
    const formX = width  / 2
    const formY = height / 2 + 20

    this.add.rectangle(formX + 6, formY + 6, formW, formH, 0x000000, 0.5)
    this.add.rectangle(formX, formY, formW, formH, 0xeef5ee)
    this.add.rectangle(formX, formY - formH / 2,     formW, 4, 0xbbddbb).setOrigin(0.5, 0)
    this.add.rectangle(formX, formY + formH / 2 - 4, formW, 4, 0x557755).setOrigin(0.5, 0)
    this.add.rectangle(formX - formW / 2, formY,     4, formH, 0xbbddbb).setOrigin(0, 0.5)
    this.add.rectangle(formX + formW / 2 - 4, formY, 4, formH, 0x557755).setOrigin(0, 0.5)

    const tby = formY - formH / 2
    this.add.rectangle(formX, tby + 26, formW, 52, 0x1a4d1a)
    this.add.rectangle(formX, tby + 52, formW, 3, 0x0d2e0d)

    this.add.text(formX, tby + 26, "Goput", {
      fontSize: "28px", fontFamily: "minecraft", color: "#ffffff",
      stroke: "#0d2e0d", strokeThickness: 3
    }).setOrigin(0.5)

    this.poinText = this.add.text(formX + formW / 2 - 20, tby + 26, `POIN: ${GameState.poin}`, {
      fontSize: "16px", fontFamily: "minecraft", color: "#ffff88"
    }).setOrigin(1, 0.5)

    const cardW  = 210
    const cardH  = 340
    const cardY  = formY + 20
    const cardXs = [formX - 240, formX, formX + 240]

    MENU.forEach((item, i) => {
      const cx = cardXs[i]
      const cy = cardY

      this.add.rectangle(cx + 4, cy + 4, cardW, cardH, 0x000000, 0.4)
      this.add.rectangle(cx, cy, cardW, cardH, 0xddeedd)
      this.add.rectangle(cx, cy - cardH / 2,     cardW, 3, 0xaaccaa).setOrigin(0.5, 0)
      this.add.rectangle(cx, cy + cardH / 2 - 3, cardW, 3, 0x557755).setOrigin(0.5, 0)
      this.add.rectangle(cx - cardW / 2, cy,     3, cardH, 0xaaccaa).setOrigin(0, 0.5)
      this.add.rectangle(cx + cardW / 2 - 3, cy, 3, cardH, 0x557755).setOrigin(0, 0.5)

      this.add.rectangle(cx, cy - 88, 150, 120, 0xbbddbb)
      if (this.textures.exists(item.key)) {
        this.add.image(cx, cy - 88, item.key).setDisplaySize(140, 110)
      } else {
        this.add.text(cx, cy - 88, item.label[0], {
          fontSize: "42px", fontFamily: "minecraft", color: "#336633"
        }).setOrigin(0.5)
      }

      this.add.text(cx, cy + 12, item.label, {
        fontSize: "17px", fontFamily: "minecraft", color: "#1a3d1a",
        stroke: "#000000", strokeThickness: 1
      }).setOrigin(0.5)

      this.add.text(cx, cy + 40, `${item.harga} POIN`, {
        fontSize: "15px", fontFamily: "minecraft", color: "#336600"
      }).setOrigin(0.5)

      this.add.text(cx, cy + 68, item.desc, {
        fontSize: "11px", fontFamily: "minecraft", color: "#446644", align: "center"
      }).setOrigin(0.5)

      const btnY = cy + 118
      this.add.rectangle(cx + 3, btnY + 3, 160, 36, 0x000000, 0.5)
      const btn    = this.add.rectangle(cx, btnY, 160, 36, 0x1a5c1a).setInteractive({ useHandCursor: true })
      const btnTxt = this.add.text(cx, btnY, "BELI", {
        fontSize: "16px", fontFamily: "minecraft", color: "#ffffff",
        stroke: "#0d2e0d", strokeThickness: 2
      }).setOrigin(0.5)

      btn.on("pointerover", () => { btn.setFillStyle(0x267326); btnTxt.setStyle({ color: "#ffffff" }) })
      btn.on("pointerout",  () => { btn.setFillStyle(0x1a5c1a); btnTxt.setStyle({ color: "#ffffff" }) })
      btn.on("pointerdown", () => {
        if (GameState.wifiGanggu) {
          this.sound.play("notifErrorSfx", { volume: 0.8 })
          this.showNotif("Koneksi bermasalah!\nPerbaiki WiFi dulu !", "#ff4444")
          return
        }
        this.sound.play("buySfx", { volume: 0.7 })
        this.beliMenu(item)
      })
    })

    const backY = formY + formH / 2 - 30
    this.add.rectangle(formX + 3, backY + 3, 180, 38, 0x000000, 0.4)
    const backBtn = this.add.rectangle(formX, backY, 180, 38, 0x1a4d1a)
      .setStrokeStyle(2, 0x44aa44).setInteractive({ useHandCursor: true })
    const backTxt = this.add.text(formX, backY, "KEMBALI", {
      fontSize: "16px", fontFamily: "minecraft", color: "#aaffaa",
      stroke: "#0d2e0d", strokeThickness: 2
    }).setOrigin(0.5)

    backBtn.on("pointerover", () => { backBtn.setFillStyle(0x267326); backTxt.setStyle({ color: "#ffffff" }) })
    backBtn.on("pointerout",  () => { backBtn.setFillStyle(0x1a4d1a); backTxt.setStyle({ color: "#aaffaa" }) })
    backBtn.on("pointerdown", () => {
      this.sound.play("appClickSfx", { volume: 0.6 })
      this.goToScene("ComputerScene")
    })

    this.input.keyboard.on("keydown-Q", (e) => { e.stopPropagation() })

    this.notifBg   = this.add.rectangle(width / 2, height * 0.08, 580, 68, 0x000000, 0.92).setVisible(false).setDepth(20)
    this.notifText = this.add.text(width / 2, height * 0.08, "", {
      fontSize: "15px", fontFamily: "minecraft", color: "#ffffff", align: "center"
    }).setOrigin(0.5).setVisible(false).setDepth(21)

    this.wifiWatcher = this.time.addEvent({
      delay: 3000, loop: true,
      callback: () => {
        if (!this.scene.isActive("GoputScene")) return
        if (GameState.wifiGanggu) this.triggerWifiInterrupt()
      }
    })
  }

  triggerWifiInterrupt() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    if (this.wifiWatcher) this.wifiWatcher.remove()
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(50)
    this.add.text(width / 2, height / 2 - 40, "ERROR 404", {
      fontSize: "52px", fontFamily: "minecraft", color: "#ff2200",
      stroke: "#440000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(51)
    this.add.text(width / 2, height / 2 + 20, "Koneksi terputus !\nGoput tidak dapat diakses.", {
      fontSize: "18px", fontFamily: "minecraft", color: "#ffffff",
      align: "center", lineSpacing: 8
    }).setOrigin(0.5).setDepth(51)
    this.add.text(width / 2, height / 2 + 80, "Perbaiki WiFi terlebih dahulu...", {
      fontSize: "13px", fontFamily: "minecraft", color: "#ffaa00"
    }).setOrigin(0.5).setDepth(51)
    this.sound.play("insanitySfx", { volume: 0.5 })
    this.time.delayedCall(2500, () => { this.goToScene("ComputerScene") })
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

  beliMenu(item) {
    if (GameState.poin < item.harga) {
      this.showNotif("Poin tidak cukup.\nSelesaikan beberapa tugas terlebih dahulu !", "#ff4444")
      return
    }
    GameState.poin    -= item.harga
    GameState.lapar    = Math.min(100, GameState.lapar    + item.lapar)
    GameState.insanity = Math.max(0,   GameState.insanity + item.insanity)
    this.poinText.setText(`POIN: ${GameState.poin}`)
    this.showNotif(`${item.label} dipesan! Lapar +${item.lapar}`, "#88ff00")
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
    if (key === "ComputerScene") {
      this.scene.stop()
      const cs = this.scene.get("ComputerScene")
      if (cs) cs.resumeFromOverlay()
      return
    }
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
    this.scene.stop("ComputerScene")
    this.scene.start(key, data)
  }

  shutdown() {
    if (this.wifiWatcher) { this.wifiWatcher.remove(); this.wifiWatcher = null }
  }
}