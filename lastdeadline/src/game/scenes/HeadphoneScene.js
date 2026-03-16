import Phaser from "phaser"

export default class HeadphoneScene extends Phaser.Scene {
  constructor() {
    super("HeadphoneScene")
  }

  create() {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2

    this.cameras.main.setBackgroundColor("#000000")
    this.cameras.main.fadeIn(500)

    this._drawPixelFrame(cx, cy)

    this.add.text(cx, cy - 30, "🎧", {
      fontSize: "48px"
    }).setOrigin(0.5).setDepth(5)

    const msg = this.add.text(cx, cy + 40,
      "Penggunaan headphone atau sejenisnya\nsangat dianjurkan untuk pengalaman\nbermain yang lebih baik !", {
      fontSize: "16px", fontFamily: "minecraft",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3,
      align: "center", lineSpacing: 8
    }).setOrigin(0.5).setDepth(5)

    this.time.addEvent({
      delay: 550, loop: true,
      callback: () => { msg.setVisible(!msg.visible) }
    })

    this.time.delayedCall(3200, () => {
      this.cameras.main.fadeOut(600)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("BootScene")
      })
    })
  }

  _drawPixelFrame(cx, cy) {
    const w  = 560
    const h  = 200
    const px = 4
    const g  = this.add.graphics().setDepth(3)

    g.fillStyle(0x0a0a0a, 1)
    g.fillRect(cx - w/2, cy - h/2, w, h)

    const corners = [
      [cx - w/2,      cy - h/2],
      [cx + w/2 - 16, cy - h/2],
      [cx - w/2,      cy + h/2 - 16],
      [cx + w/2 - 16, cy + h/2 - 16],
    ]

    g.fillStyle(0x555555, 1)
    g.fillRect(cx - w/2,      cy - h/2,       w,  px)
    g.fillRect(cx - w/2,      cy + h/2 - px,  w,  px)
    g.fillRect(cx - w/2,      cy - h/2,       px, h)
    g.fillRect(cx + w/2 - px, cy - h/2,       px, h)

    g.fillStyle(0x222222, 1)
    g.fillRect(cx - w/2 + px,   cy - h/2 + px,   w - px*2, px)
    g.fillRect(cx - w/2 + px,   cy + h/2 - px*2, w - px*2, px)
    g.fillRect(cx - w/2 + px,   cy - h/2 + px,   px, h - px*2)
    g.fillRect(cx + w/2 - px*2, cy - h/2 + px,   px, h - px*2)

    corners.forEach(([x, y]) => {
      g.fillStyle(0x888888, 1)
      g.fillRect(x, y, 8, 8)
    })

    for (let i = 0; i < w; i += 24) {
      g.fillStyle(0x1a1a1a, 1)
      g.fillRect(cx - w/2 + i, cy - h/2, 12, px)
    }
  }
}