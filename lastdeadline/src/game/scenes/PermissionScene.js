import Phaser from "phaser"

export default class PermissionScene extends Phaser.Scene {
  constructor() {
    super("PermissionScene")
  }

  create() {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2

    this.cameras.main.setBackgroundColor("#000000")
    this.cameras.main.fadeIn(400)

    const panelW = 580
    const panelH = 220

    this._drawPixelPanel(cx, cy - 30, panelW, panelH)

    this.add.text(cx, cy - 100, "IZIN DIPERLUKAN", {
      fontSize: "20px", fontFamily: "minecraft",
      color: "#ffff00", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(5)

    this.add.text(cx, cy - 55, "Game ini membutuhkan izin penggunaan audio\nuntuk dapat berjalan dengan baik.", {
      fontSize: "14px", fontFamily: "minecraft",
      color: "#cccccc", stroke: "#000000", strokeThickness: 3,
      align: "center", lineSpacing: 6
    }).setOrigin(0.5).setDepth(5)

    this._makeBtn(cx - 90, cy + 40, "IZINKAN", "#00ff88", "#003322", () => this._onAllow())
    this._makeBtn(cx + 90, cy + 40, "TOLAK",   "#ff4444", "#330000", () => this._onDeny())
  }

  _drawPixelPanel(cx, cy, w, h) {
    const g = this.add.graphics().setDepth(3)
    const px = 4

    g.fillStyle(0x0a0a0a, 1)
    g.fillRect(cx - w/2, cy - h/2, w, h)

    g.fillStyle(0x444444, 1)
    g.fillRect(cx - w/2,        cy - h/2,        w,  px)
    g.fillRect(cx - w/2,        cy + h/2 - px,   w,  px)
    g.fillRect(cx - w/2,        cy - h/2,        px, h)
    g.fillRect(cx + w/2 - px,   cy - h/2,        px, h)

    g.fillStyle(0x222222, 1)
    g.fillRect(cx - w/2 + px,   cy - h/2 + px,   w - px*2, px)
    g.fillRect(cx - w/2 + px,   cy + h/2 - px*2, w - px*2, px)
    g.fillRect(cx - w/2 + px,   cy - h/2 + px,   px, h - px*2)
    g.fillRect(cx + w/2 - px*2, cy - h/2 + px,   px, h - px*2)

    g.fillStyle(0x888888, 1)
    g.fillRect(cx - w/2,      cy - h/2,      px, px)
    g.fillRect(cx + w/2 - px, cy - h/2,      px, px)
    g.fillRect(cx - w/2,      cy + h/2 - px, px, px)
    g.fillRect(cx + w/2 - px, cy + h/2 - px, px, px)
  }

  _makeBtn(cx, cy, label, color, bgHex, onClick) {
    const bg = parseInt(bgHex.replace("#", ""), 16)
    const btnW = 160
    const btnH = 40
    const px   = 3

    const g = this.add.graphics().setDepth(4)
    g.fillStyle(bg, 1)
    g.fillRect(cx - btnW/2, cy - btnH/2, btnW, btnH)
    g.fillStyle(0x555555, 1)
    g.fillRect(cx - btnW/2,          cy - btnH/2,          btnW, px)
    g.fillRect(cx - btnW/2,          cy + btnH/2 - px,     btnW, px)
    g.fillRect(cx - btnW/2,          cy - btnH/2,          px,   btnH)
    g.fillRect(cx + btnW/2 - px,     cy - btnH/2,          px,   btnH)

    const txt = this.add.text(cx, cy, label, {
      fontSize: "14px", fontFamily: "minecraft",
      color, stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setDepth(5)

    const hit = this.add.rectangle(cx, cy, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(6)

    hit.on("pointerover",  () => { txt.setAlpha(0.7) })
    hit.on("pointerout",   () => { txt.setAlpha(1) })
    hit.on("pointerdown",  () => {
      txt.setAlpha(0.4)
      this.time.delayedCall(80, onClick)
    })
  }

  _onAllow() {
    if (this.sound.context && this.sound.context.state === "suspended") {
      this.sound.context.resume()
    }
    this.cameras.main.fadeOut(300)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("HeadphoneScene")
    })
  }

  _onDeny() {
    this.cameras.main.fadeOut(400)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      window.close()
      this.add.text(this.scale.width / 2, this.scale.height / 2,
        "Tutup tab ini untuk keluar.", {
        fontSize: "14px", fontFamily: "minecraft",
        color: "#555555"
      }).setOrigin(0.5)
    })
  }
}