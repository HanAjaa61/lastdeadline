import Phaser from "phaser"

export default class GuideScene extends Phaser.Scene {
  constructor() {
    super("GuideScene")
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor("#000000")
    this.cameras.main.fadeIn(500)

    // ── SLIDE DATA ────────────────────────────────────────
    this.slides = [
      {
        title: "TENTANG GAME",
        color: "#00ff41",
        icon: "🎮",
        sections: [
          {
            heading: null,
            items: [
              { text: "Kamu adalah mahasiswa informatika yang harus bertahan selama 3 malam mengerjakan tugas dengan deadline mepet.", color: "#77bb77" },
              { text: "The Enggang mengintai lewat CCTV dari luar. Jaga kondisi dirimu dan pantau sekitar!", color: "#77bb77" },
            ]
          },
          {
            heading: "TUJUAN TIAP MALAM",
            items: [
              { text: "Malam 1 — selesaikan 15 soal LMS", color: "#ffff88" },
              { text: "Malam 2 — selesaikan 20 soal LMS", color: "#ffff88" },
              { text: "Malam 3 — selesaikan 25 soal LMS", color: "#ffff88" },
              { text: "Bertahan hingga 05:00 AM tanpa pingsan atau tertangkap!", color: "#ff9944" },
            ]
          }
        ]
      },
      {
        title: "APLIKASI KOMPUTER",
        color: "#00ddff",
        icon: "💻",
        sections: [
          {
            heading: "LMS ITK",
            items: [
              { text: "Kerjakan soal esai yang dibuat oleh AI secara acak setiap sesi.", color: "#77bb77" },
              { text: "Nilai ≥ 60 = jawaban benar. Nilai < 60 = jawaban salah.", color: "#77bb77" },
              { text: "Jawaban salah akan menaikkan bar STRESS kamu!", color: "#ff5555" },
            ]
          },
          {
            heading: "WIFI",
            items: [
              { text: "Perbaiki jaringan internet dengan mini-game labirin klik.", color: "#77bb77" },
            ]
          },
          {
            heading: "GOPUT",
            items: [
              { text: "Pesan makanan untuk mengisi bar LAPAR sebelum pingsan.", color: "#77bb77" },
            ]
          },
          {
            heading: "CCTV",
            items: [
              { text: "Pantau kamera keamanan dan tangkis anomali SPECTA sebelum terlambat.", color: "#77bb77" },
            ]
          }
        ]
      },
      {
        title: "TOMBOL KONTROL",
        color: "#ffdd00",
        icon: "⌨️",
        sections: [
          {
            heading: null,
            items: [
              { key: "SHIFT",     desc: "Buka / tutup komputer" },
              { key: "Q",         desc: "Kembali ke scene sebelumnya" },
              { key: "S",         desc: "Nyalakan flashlight saat Cek Pintu" },
              { key: "ENTER",     desc: "Submit jawaban di LMS" },
              { key: "BACKSPACE", desc: "Hapus huruf terakhir di LMS" },
              { key: "KLIK",      desc: "Interaksi dengan aplikasi & objek" },
            ]
          }
        ]
      },
      {
        title: "MEKANIK CCTV",
        color: "#ff44aa",
        icon: "📷",
        sections: [
          {
            heading: "CARA MAIN",
            items: [
              { text: "Anomali muncul secara acak di salah satu kamera CCTV.", color: "#77bb77" },
              { text: "Buka aplikasi CCTV, lalu pindah ke kamera yang terdapat anomali.", color: "#77bb77" },
              { text: "Klik tombol SPECTA untuk mengusir anomali tersebut.", color: "#77bb77" },
            ]
          },
          {
            heading: "PERINGATAN",
            items: [
              { text: "Semakin larut malam, anomali akan semakin sering muncul!", color: "#ff5555" },
              { text: "Mengabaikan CCTV terlalu lama akan memicu jumpscare dan game over!", color: "#ff5555" },
            ]
          }
        ]
      },
      {
        title: "CEK PINTU",
        color: "#ff8800",
        icon: "🚪",
        sections: [
          {
            heading: "CARA MAIN",
            items: [
              { text: "Cek pintu kiri dan kanan kamarmu secara bergantian.", color: "#77bb77" },
              { text: "Tahan tombol S untuk menyalakan flashlight saat memeriksa pintu.", color: "#77bb77" },
              { text: "Pastikan tidak ada anomali atau sosok mencurigakan di depan pintu!", color: "#77bb77" },
            ]
          },
          {
            heading: "PERINGATAN",
            items: [
              { text: "Timer habis tanpa melakukan cek pintu = jumpscare, game over!", color: "#ff5555" },
              { text: "The Enggang bisa masuk jika pintu tidak dijaga dengan baik!", color: "#ff5555" },
            ]
          }
        ]
      },
      {
        title: "SEMBUNYI DI LEMARI",
        color: "#bb88ff",
        icon: "🚪",
        sections: [
          {
            heading: "CARA MAIN",
            items: [
              { text: "Ketika bahaya datang, kamu bisa sembunyi di dalam lemari.", color: "#77bb77" },
              { text: "Di dalam lemari, drag kotak PUTIH ke zona HIJAU yang bergerak untuk menahan napas.", color: "#77bb77" },
              { text: "Jaga bar 'Tahan Napas' tetap penuh agar tidak ketahuan!", color: "#77bb77" },
            ]
          },
          {
            heading: "ZONA HIJAU",
            items: [
              { text: "Zona hijau bergerak terus dengan kecepatan berubah-ubah — ikuti gerakannya!", color: "#ffff88" },
              { text: "Selama kotak putih ada di zona hijau, bar napas akan naik.", color: "#ffff88" },
              { text: "Jika kotak putih keluar dari zona hijau, bar napas akan turun cepat!", color: "#ff5555" },
            ]
          },
          {
            heading: "KONDISI AMAN & BAHAYA",
            items: [
              { text: "Bar napas penuh 100% = aman! Tekan Q untuk keluar dari lemari.", color: "#00ff88" },
              { text: "Bar napas habis = suaramu terdengar, The Enggang menemukanmu!", color: "#ff5555" },
              { text: "Menekan Q sebelum aman = langsung tertangkap!", color: "#ff5555" },
            ]
          }
        ]
      },
      {
        title: "BAHAYA & GAME OVER",
        color: "#ff3333",
        icon: "💀",
        sections: [
          {
            heading: "KONDISI GAME OVER",
            items: [
              { text: "Bar LAPAR habis → kamu pingsan karena kelaparan.", color: "#ff5555" },
              { text: "Bar STRESS mencapai 100% → kamu menggila dan tidak bisa lanjut.", color: "#ff5555" },
              { text: "Tidak cek pintu tepat waktu → The Enggang masuk!", color: "#ff5555" },
              { text: "Mengabaikan anomali CCTV terlalu lama → jumpscare fatal!", color: "#ff5555" },
            ]
          },
          {
            heading: "TIPS BERTAHAN",
            items: [
              { text: "Beli makanan di Goput secara rutin untuk menjaga bar LAPAR.", color: "#ffff88" },
              { text: "Cek pintu secara konsisten agar bar cek tidak habis.", color: "#ffff88" },
              { text: "Pantau CCTV sebelum mulai mengerjakan soal LMS.", color: "#ffff88" },
              { text: "Jawab soal LMS dengan benar untuk menghindari naiknya STRESS.", color: "#ffff88" },
            ]
          }
        ]
      },
    ]

    this.currentSlide = 0
    this.slideGroup = this.add.group()

    // ── SCANLINES ─────────────────────────────────────────
    const scanlines = this.add.graphics()
    for (let y = 0; y < height; y += 4) {
      scanlines.fillStyle(0x001100, 0.2)
      scanlines.fillRect(0, y, width, 2)
    }
    scanlines.setDepth(10)

    // ── HEADER ────────────────────────────────────────────
    this.add.text(width / 2, 64, "[ PANDUAN BERMAIN ]", {
      fontSize: "24px", fontFamily: "minecraft", color: "#00ff41",
      stroke: "#003300", strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: "#00ff41", blur: 10, fill: true }
    }).setOrigin(0.5).setDepth(5)

    // Slide indicator dots — built inside _buildSlide, below slide title
    this.dotGroup = this.add.group()

    // ── SLIDE CONTENT AREA ────────────────────────────────
    this.contentContainer = this.add.container(0, 0)
    this._buildSlide(this.currentSlide)

    // ── NAVIGATION ARROWS ─────────────────────────────────
    const arrowY = height / 2 + 20

    // Left arrow
    this.leftArrowBg = this.add.rectangle(22, arrowY, 36, 60, 0x001800)
      .setStrokeStyle(1, 0x00ff41).setInteractive({ useHandCursor: true }).setDepth(20)
    this.leftArrowTxt = this.add.text(22, arrowY, "◀", {
      fontSize: "18px", fontFamily: "minecraft", color: "#00ff41"
    }).setOrigin(0.5).setDepth(20)

    // Right arrow
    this.rightArrowBg = this.add.rectangle(width - 22, arrowY, 36, 60, 0x001800)
      .setStrokeStyle(1, 0x00ff41).setInteractive({ useHandCursor: true }).setDepth(20)
    this.rightArrowTxt = this.add.text(width - 22, arrowY, "▶", {
      fontSize: "18px", fontFamily: "minecraft", color: "#00ff41"
    }).setOrigin(0.5).setDepth(20)

    this._updateArrows()

    this.leftArrowBg.on("pointerover", () => { this.leftArrowBg.setFillStyle(0x003300); this.leftArrowTxt.setStyle({ color: "#ffffff" }) })
    this.leftArrowBg.on("pointerout",  () => { this.leftArrowBg.setFillStyle(0x001800); this.leftArrowTxt.setStyle({ color: "#00ff41" }) })
    this.leftArrowBg.on("pointerdown", () => this._goSlide(-1))

    this.rightArrowBg.on("pointerover", () => { this.rightArrowBg.setFillStyle(0x003300); this.rightArrowTxt.setStyle({ color: "#ffffff" }) })
    this.rightArrowBg.on("pointerout",  () => { this.rightArrowBg.setFillStyle(0x001800); this.rightArrowTxt.setStyle({ color: "#ffffff" }) })
    this.rightArrowBg.on("pointerdown", () => this._goSlide(1))

    // Keyboard nav
    this.input.keyboard.on("keydown-LEFT",  () => this._goSlide(-1))
    this.input.keyboard.on("keydown-RIGHT", () => this._goSlide(1))

    // ── FOOTER BUTTON ─────────────────────────────────────
    const btnY = height - 62
    this.add.rectangle(width / 2, btnY, 1, 1, 0x000000, 0).setDepth(5) // spacer

    const backBg = this.add.rectangle(width / 2, btnY, 260, 28, 0x001a00)
      .setStrokeStyle(1, 0x00ff41).setInteractive({ useHandCursor: true }).setDepth(20)
    const backTxt = this.add.text(width / 2, btnY, "KEMBALI KE MENU", {
      fontSize: "14px", fontFamily: "minecraft", color: "#00ff41"
    }).setOrigin(0.5).setDepth(20)

    backBg.on("pointerover", () => { backBg.setFillStyle(0x003300); backTxt.setStyle({ color: "#ffffff" }) })
    backBg.on("pointerout",  () => { backBg.setFillStyle(0x001a00); backTxt.setStyle({ color: "#00ff41" }) })
    backBg.on("pointerdown", () => {
      this.cameras.main.fadeOut(400)
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("MenuScene"))
    })

    // Flicker
    this.time.addEvent({
      delay: Phaser.Math.Between(5000, 12000), loop: false,
      callback: () => this._flicker()
    })
  }

  _buildSlide(index) {
    // Clear previous
    this.contentContainer.removeAll(true)

    const { width, height } = this.scale
    const slide = this.slides[index]
    const slideColor = Phaser.Display.Color.HexStringToColor(slide.color.replace("#", ""))
    const colorInt = Phaser.Display.Color.GetColor(slideColor.r, slideColor.g, slideColor.b)

    const padX = 60
    const contentW = width - padX * 2
    let y = 116

    // Slide title
    const titleTxt = this.add.text(width / 2, y, slide.icon + "  " + slide.title, {
      fontSize: "24px", fontFamily: "minecraft", color: slide.color,
      stroke: "#000000", strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: slide.color, blur: 12, fill: true }
    }).setOrigin(0.5).setDepth(5)
    this.contentContainer.add(titleTxt)
    y += 36

    // Dots below slide title
    this.dotGroup.clear(true, true)
    const total = this.slides.length
    const dotSpacing = 20
    const dotsStartX = width / 2 - ((total - 1) * dotSpacing) / 2
    for (let i = 0; i < total; i++) {
      const active = i === index
      const dot = this.add.circle(dotsStartX + i * dotSpacing, y, active ? 5 : 3, active ? 0x00ff41 : 0x224422)
      if (active) dot.setStrokeStyle(1, 0x00ff41)
      dot.setDepth(5)
      this.dotGroup.add(dot)
      this.contentContainer.add(dot)
    }
    y += 22

    // Divider
    const divider = this.add.rectangle(width / 2, y, contentW, 1, colorInt, 0.5).setDepth(5)
    this.contentContainer.add(divider)
    y += 20

    // Sections
    for (const section of slide.sections) {
      if (section.heading) {
        const headTxt = this.add.text(padX, y, "◆ " + section.heading, {
          fontSize: "16px", fontFamily: "minecraft", color: slide.color,
          stroke: "#000000", strokeThickness: 2
        }).setDepth(5)
        this.contentContainer.add(headTxt)
        y += 26
      }

      for (const item of section.items) {
        if (item.key !== undefined) {
          // Key binding row
          const kw = Math.min(90, Math.max(40, item.key.length * 8 + 14))
          const keyBg = this.add.rectangle(padX + kw / 2, y + 9, kw, 18, 0x001800)
            .setStrokeStyle(1, 0x00aa44).setOrigin(0.5).setDepth(5)
          const keyTxt = this.add.text(padX + kw / 2, y + 9, item.key, {
            fontSize: "11px", fontFamily: "minecraft", color: "#00ff41"
          }).setOrigin(0.5).setDepth(5)
          const descTxt = this.add.text(padX + kw + 10, y + 2, item.desc, {
            fontSize: "15px", fontFamily: "minecraft", color: "#77bb77",
            wordWrap: { width: contentW - kw - 14 }
          }).setDepth(5)
          this.contentContainer.add([keyBg, keyTxt, descTxt])
          y += 26
        } else {
          // Regular text row
          const textObj = this.add.text(padX + 10, y, "▸  " + item.text, {
            fontSize: "15px", fontFamily: "minecraft", color: item.color || "#77bb77",
            wordWrap: { width: contentW - 10 }
          }).setDepth(5)
          this.contentContainer.add(textObj)
          const lines = textObj.getWrappedText ? textObj.getWrappedText(item.text).length : Math.ceil((item.text.length + 3) / 52)
          y += 22 * Math.max(1, lines)
        }
      }
      y += 16 // spacing between sections
    }

    // Slide counter bottom
    const counterTxt = this.add.text(width / 2, height - 88, (index + 1) + " / " + this.slides.length, {
      fontSize: "13px", fontFamily: "minecraft", color: "#224422"
    }).setOrigin(0.5).setDepth(5)
    this.contentContainer.add(counterTxt)

    // Fade in
    this.contentContainer.setAlpha(0)
    this.tweens.add({
      targets: this.contentContainer,
      alpha: 1,
      duration: 200,
      ease: "Linear"
    })
  }

  _goSlide(dir) {
    const next = this.currentSlide + dir
    if (next < 0 || next >= this.slides.length) return

    this.tweens.add({
      targets: this.contentContainer,
      alpha: 0,
      duration: 150,
      ease: "Linear",
      onComplete: () => {
        this.currentSlide = next
        this._buildSlide(this.currentSlide)
        this._updateArrows()
      }
    })
  }

  _updateArrows() {
    const atStart = this.currentSlide === 0
    const atEnd   = this.currentSlide === this.slides.length - 1

    this.leftArrowBg.setAlpha(atStart ? 0.2 : 1)
    this.leftArrowTxt.setAlpha(atStart ? 0.2 : 1)
    this.leftArrowBg.disableInteractive()
    if (!atStart) this.leftArrowBg.setInteractive({ useHandCursor: true })

    this.rightArrowBg.setAlpha(atEnd ? 0.2 : 1)
    this.rightArrowTxt.setAlpha(atEnd ? 0.2 : 1)
    this.rightArrowBg.disableInteractive()
    if (!atEnd) this.rightArrowBg.setInteractive({ useHandCursor: true })
  }

  _flicker() {
    if (!this.scene.isActive("GuideScene")) return
    const o = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0x000000, 0
    ).setDepth(50)
    let i = 0
    const s = () => {
      if (i >= 4) {
        o.destroy()
        this.time.delayedCall(Phaser.Math.Between(6000, 14000), () => this._flicker())
        return
      }
      o.setAlpha(i % 2 === 0 ? 0.2 : 0); i++
      this.time.delayedCall(45, s)
    }
    s()
  }
}