import https from "https"
import crypto from "crypto"

const API_KEY    = process.env.GROQ_API_KEY
const SECRET_KEY = process.env.QUIZ_SECRET || "lastdeadline-secret-key-2024"

function encrypt(text) {
  const iv  = crypto.randomBytes(16)
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest()
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

function decrypt(token) {
  const [ivHex, encHex] = token.split(":")
  const iv  = Buffer.from(ivHex, "hex")
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest()
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()])
  return decrypted.toString("utf8")
}

function groqRequest(messages, maxTokens, model = "llama-3.3-70b-versatile") {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      max_tokens:      maxTokens,
      temperature:     0.9,
      response_format: { type: "json_object" },
      messages,
    })

    const options = {
      hostname: "api.groq.com",
      path:     "/openai/v1/chat/completions",
      method:   "POST",
      headers: {
        "content-type":   "application/json",
        "content-length": Buffer.byteLength(payload),
        "authorization":  `Bearer ${API_KEY}`,
      },
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          const text   = parsed.choices?.[0]?.message?.content || ""
          const clean  = text.replace(/```json|```/g, "").trim()
          resolve(JSON.parse(clean))
        } catch (e) {
          reject(new Error("Gagal parse response: " + e.message))
        }
      })
    })
    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}

const TOPIK_POOL = {
  1: [
    "fungsi organ tubuh manusia (jantung, paru-paru, ginjal, hati, otak)",
    "fakta hewan (mamalia, reptil, serangga, burung, ikan)",
    "fakta tumbuhan (fotosintesis, bagian tumbuhan, jenis tumbuhan)",
    "tata surya dan astronomi (planet, bintang, bulan, matahari)",
    "geografi negara (ibu kota, benua, samudra, negara terbesar/terkecil)",
    "fenomena alam (gempa bumi, gunung berapi, tsunami, hujan, angin)",
    "tubuh manusia dan kesehatan (vitamin, tulang, otot, darah)",
    "hewan langka dan habitat (komodo, harimau, panda, hiu paus)",
  ],
  2: [
    "tokoh penemu dunia (Edison, Newton, Einstein, Fleming, Darwin)",
    "sejarah Indonesia (kemerdekaan, pahlawan nasional, kerajaan kuno)",
    "peristiwa bersejarah dunia (Perang Dunia, revolusi, penjelajahan)",
    "matematika: perkalian dan pembagian angka dua digit",
    "matematika: pecahan, persentase, dan desimal",
    "matematika: luas dan keliling bangun datar (persegi, lingkaran, segitiga)",
    "tokoh ilmuwan Indonesia (Habibie, Soekarno, Ki Hajar Dewantara)",
    "penemuan penting (listrik, telepon, internet, pesawat, vaksin)",
  ],
  3: [
    "teknologi sehari-hari (cara kerja HP, internet, GPS, satelit)",
    "kimia dasar (unsur, senyawa, reaksi kimia sederhana, tabel periodik)",
    "fisika dasar (gaya, energi, cahaya, bunyi, listrik)",
    "budaya Indonesia (tarian daerah, rumah adat, bahasa daerah)",
    "ekonomi dasar (inflasi, pasar, supply demand, mata uang)",
    "lingkungan hidup (daur ulang, ekosistem, pemanasan global)",
    "bahasa dan sastra Indonesia (peribahasa, majas, arti kata)",
    "olahraga dan kesehatan (aturan olahraga, rekor dunia, olimpiade)",
  ],
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") { res.status(204).end(); return }
  if (req.method !== "POST")    { res.status(404).end(); return }

  const { url } = req
  const body = req.body

  try {

    if (url.includes("generate-soal")) {
      const { night, riwayat_soal } = body

      const pool  = TOPIK_POOL[night] || TOPIK_POOL[1]
      const topik = pool[Math.floor(Math.random() * pool.length)]

      const riwayatText = Array.isArray(riwayat_soal) && riwayat_soal.length > 0
        ? `\n\nSOAL YANG SUDAH PERNAH DIBUAT (JANGAN BUAT SOAL SERUPA INI):\n${riwayat_soal.slice(-8).map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        : ""

      const result = await groqRequest([
        {
          role: "system",
          content: `Kamu adalah pembuat soal kuis edukatif yang kreatif dan sangat teliti. Buat soal yang:
- Memiliki SATU jawaban yang pasti benar secara fakta dan tidak ambigu
- Mudah dipahami tapi tetap edukatif dan bermakna
- Tidak terlalu mudah (hindari soal seperti "apa warna langit", "berapa 2+2")
- Tidak terlalu teknis atau butuh keahlian profesional khusus
- BERBEDA dan BERVARIASI — jangan membuat soal yang mirip atau serupa dengan soal yang sudah ada

Contoh soal BAGUS:
- "Organ tubuh apa yang berfungsi menyaring darah dan menghasilkan urin?"
- "Siapa ilmuwan yang menemukan teori gravitasi dengan kisah apel jatuh?"
- "Apa nama ibu kota negara Brasil?"
- "Berapa hasil dari 15 persen dikali 200?"
- "Gas apa yang paling banyak menyusun atmosfer bumi?"
- "Pada tahun berapa Indonesia merdeka?"
- "Apa nama tarian tradisional yang berasal dari Jawa Tengah?"
- "Berapa jumlah tulang pada tubuh manusia dewasa?"

Setelah membuat soal, verifikasi sendiri bahwa jawaban yang kamu tulis di jawaban_benar memang BENAR secara fakta.
Balas HANYA dengan JSON.`,
        },
        {
          role: "user",
          content: `Buat 1 soal kuis tentang topik spesifik: ${topik}.${riwayatText}

Pastikan:
1. Soal BERBEDA dari semua soal di daftar riwayat di atas
2. Soal punya jawaban faktual yang jelas dan sudah diverifikasi
3. jawaban_benar diisi singkat dan tepat (1-5 kata)

Balas JSON: {"soal":"pertanyaannya disini","topik":"nama topik singkat","jawaban_benar":"jawaban singkat yang benar"}`,
        },
      ], 500)

      if (!result?.soal || !result?.jawaban_benar) {
        res.status(500).json({ ok: false, error: "Gagal generate soal" })
        return
      }

      const token = encrypt(result.jawaban_benar)

      res.status(200).json({
        ok:    true,
        soal:  result.soal,
        topik: result.topik || topik,
        token,
      })

    } else if (url.includes("nilai-jawaban")) {
      const { soal, jawaban, token } = body
      if (!soal || !jawaban || !token) {
        res.status(400).json({ ok: false, error: "soal, jawaban, dan token wajib diisi" })
        return
      }

      let jawaban_benar
      try {
        jawaban_benar = decrypt(token)
      } catch (e) {
        res.status(400).json({ ok: false, error: "Token tidak valid" })
        return
      }

      const result = await groqRequest([
        {
          role: "system",
          content: `Kamu adalah penilai jawaban kuis yang jujur dan teliti.
Jawaban benar sudah diberikan kepadamu — tugasmu HANYA membandingkan jawaban user dengan jawaban benar tersebut.
JANGAN menilai berdasarkan opinimu sendiri. Gunakan HANYA jawaban benar yang diberikan sebagai acuan.

Aturan penilaian:
- Soal MATEMATIKA/HITUNG: nilai 100 jika hasil perhitungan benar, nilai 0 jika salah. Tidak ada nilai tengah.
- Soal PENGETAHUAN: nilai 90-100 jika inti jawaban sama dengan jawaban benar (typo kecil atau kalimat berbeda tidak masalah). Nilai 40-70 jika mendekati benar tapi kurang lengkap. Nilai 0-30 jika salah atau tidak relevan.
- Jangan beri nilai tinggi untuk jawaban yang terdengar meyakinkan tapi faktanya berbeda dari jawaban benar.

Balas HANYA JSON.`,
        },
        {
          role: "user",
          content: `Soal: "${soal}"
Jawaban benar: "${jawaban_benar}"
Jawaban user: "${jawaban}"

Bandingkan jawaban user dengan jawaban benar. Beri nilai 0-100 sesuai aturan.
Tulis feedback 1 kalimat singkat berisi jawaban yang benar untuk soal ini.

Balas JSON: {"nilai":0,"feedback":"jawaban benar dalam 1 kalimat singkat"}`,
        },
      ], 300)

      if (result?.nilai === undefined) {
        res.status(500).json({ ok: false, error: "Gagal menilai jawaban" })
        return
      }

      const nilai = Math.max(0, Math.min(100, Math.round(Number(result.nilai))))
      res.status(200).json({ ok: true, nilai, feedback: result.feedback || "" })

    } else {
      res.status(404).end()
    }

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}