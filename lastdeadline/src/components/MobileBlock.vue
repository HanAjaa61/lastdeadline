<template>
  <div v-if="isBlocked" class="mobile-block">
    <div class="scanlines" />
    <div class="vignette" />

    <div class="panel-wrap">
      <div class="corner tl" />
      <div class="corner tr" />
      <div class="corner bl" />
      <div class="corner br" />

      <div class="panel-inner">

        <div class="header-bar">
          <span class="blink">▮</span>
          <span>PERINGATAN SISTEM</span>
          <span class="blink" style="animation-delay:.4s">▮</span>
        </div>

        <!-- Phone + X icon -->
        <div class="icon-wrap">
          <svg width="72" height="72" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" class="pixel-icon">
            <!-- phone body -->
            <rect x="5" y="1" width="10" height="18" fill="#001a00" stroke="#00ff41" stroke-width="1"/>
            <!-- screen -->
            <rect x="6" y="3" width="8" height="11" fill="#002200"/>
            <!-- home button -->
            <rect x="9" y="15" width="2" height="2" fill="#00aa2a"/>
            <!-- screen glow -->
            <rect x="7" y="4" width="6" height="9" fill="#00ff41" opacity="0.05"/>
            <!-- X merah diagonal kiri-kanan -->
            <rect x="6"  y="4"  width="2" height="2" fill="#ff3333"/>
            <rect x="8"  y="6"  width="2" height="2" fill="#ff3333"/>
            <rect x="10" y="8"  width="2" height="2" fill="#ff3333"/>
            <rect x="12" y="10" width="2" height="2" fill="#ff3333"/>
            <!-- X merah diagonal kanan-kiri -->
            <rect x="12" y="4"  width="2" height="2" fill="#ff3333"/>
            <rect x="10" y="6"  width="2" height="2" fill="#ff3333"/>
            <rect x="8"  y="8"  width="2" height="2" fill="#ff3333"/>
            <rect x="6"  y="10" width="2" height="2" fill="#ff3333"/>
          </svg>
        </div>

        <div class="title-text">PERANGKAT TIDAK DIDUKUNG</div>

        <div class="divider" />

        <div class="body-text">
          Game ini hanya dapat diakses melalui
          <span class="highlight">komputer</span> atau
          <span class="highlight">laptop</span> untuk
          pengalaman bermain yang optimal.
        </div>

        <div class="sub-text">
          [ Lebar layar minimum: 1024px ]
        </div>

        <button class="exit-btn" @click="handleExit">KELUAR</button>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MobileBlock",

  data() {
    return {
      isBlocked: false,
    }
  },

  mounted() {
    this.checkDevice()
    window.addEventListener("resize", this.checkDevice)
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.checkDevice)
  },

  methods: {
    checkDevice() {
      this.isBlocked = window.innerWidth < 1024
    },

    handleExit() {
      window.close()
      document.body.innerHTML = `
        <div style="
          display:flex; align-items:center; justify-content:center;
          height:100vh; background:#000;
          font-family:'Courier New',monospace; color:#00aa2a;
          font-size:14px; text-align:center; line-height:2;
        ">
          Silakan tutup tab ini secara manual.<br>
          <span style="color:#005500;">[ Terima kasih telah mencoba Last Deadline ]</span>
        </div>
      `
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.mobile-block {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'VT323', 'Courier New', monospace;
}

.scanlines {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0,255,65,0.03) 3px,
    rgba(0,255,65,0.03) 4px
  );
  pointer-events: none;
  z-index: 1;
}

.vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.9) 100%);
  pointer-events: none;
  z-index: 1;
}

.panel-wrap {
  position: relative;
  z-index: 2;
  max-width: 360px;
  width: 100%;
  animation: fadeSlideIn 0.5s ease forwards;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #00ff41;
  border-style: solid;
  z-index: 3;
}
.corner.tl { top: -1px;  left: -1px;  border-width: 2px 0 0 2px; }
.corner.tr { top: -1px;  right: -1px; border-width: 2px 2px 0 0; }
.corner.bl { bottom: -1px; left: -1px;  border-width: 0 0 2px 2px; }
.corner.br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

.panel-inner {
  border: 1px solid #004400;
  background: rgba(0, 12, 0, 0.97);
  padding: 20px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow:
    0 0 0 1px #001200,
    0 0 40px rgba(0,255,65,0.06),
    inset 0 0 60px rgba(0,0,0,0.5);
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  color: #004400;
  letter-spacing: 3px;
  text-transform: uppercase;
  align-self: stretch;
}

.blink {
  color: #00ff41;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.icon-wrap {
  margin: 4px 0 0;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 10px rgba(255,50,50,0.35)) drop-shadow(0 0 6px rgba(0,255,65,0.2));
}
.pixel-icon {
  image-rendering: pixelated;
  width: 72px;
  height: 72px;
}

.title-text {
  font-size: 22px;
  color: #ff4444;
  letter-spacing: 2px;
  text-align: center;
  text-shadow: 0 0 10px rgba(255,60,60,0.5);
}

.divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #003300, #00ff41, #003300, transparent);
  opacity: 0.6;
}

.body-text {
  font-size: 18px;
  color: #77bb77;
  text-align: center;
  line-height: 1.6;
}
.highlight {
  color: #00ff41;
  text-shadow: 0 0 6px rgba(0,255,65,0.4);
}

.sub-text {
  font-size: 13px;
  color: #224422;
  letter-spacing: 1px;
  text-align: center;
}

.exit-btn {
  margin-top: 6px;
  background: #001a00;
  border: 1px solid #00ff41;
  color: #00ff41;
  font-family: 'VT323', monospace;
  font-size: 18px;
  letter-spacing: 3px;
  padding: 8px 40px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  box-shadow: 0 0 10px rgba(0,255,65,0.1);
}
.exit-btn:hover {
  background: #003300;
  color: #ffffff;
  box-shadow: 0 0 16px rgba(0,255,65,0.25);
}
.exit-btn:active {
  transform: translateY(1px);
}
</style>