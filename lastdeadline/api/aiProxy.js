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
      temperature:     0.7,
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
      const { night } = body
      const seed = Math.floor(Math.random() * 999999)

      const topikMap = {
        1: "sains dasar (fungsi organ tubuh manusia, fakta hewan/tumbuhan, fenomena alam, planet) atau geografi (ibu kota negara, benua, samudra, negara)",
        2: "sejarah (tokoh penemu, peristiwa bersejarah dunia, pahlawan Indonesia) atau matematika (perkalian, pembagian, pecahan, persentase, luas bangun)",
        3: "teknologi dan sains (cara kerja teknologi sehari-hari, kimia dasar, fisika dasar) atau budaya dan bahasa (arti kata, peribahasa, tradisi Indonesia)",
      }
      const topik = topikMap[night] || topikMap[1]

      const result = await groqRequest([
        {
          role: "system",
          content: `Kamu adalah pembuat soal kuis edukatif yang sangat teliti. Buat soal yang:
- Memiliki SATU jawaban yang pasti benar secara fakta dan tidak ambigu
- Mudah dipahami tapi tetap edukatif dan bermakna
- Tidak terlalu mudah (hindari soal seperti "apa warna langit", "berapa 2+2")
- Tidak terlalu teknis atau butuh keahlian profesional khusus

Contoh soal BAGUS:
- "Organ tubuh apa yang berfungsi menyaring darah dan menghasilkan urin?"
- "Siapa ilmuwan yang menemukan teori gravitasi dengan kisah apel jatuh?"
- "Apa nama ibu kota negara Brasil?"
- "Berapa hasil dari 15 persen dikali 200?"
- "Gas apa yang paling banyak menyusun atmosfer bumi?"
- "Pada tahun berapa Indonesia merdeka?"

Setelah membuat soal, verifikasi sendiri bahwa jawaban yang kamu tulis di jawaban_benar memang BENAR secara fakta.
Balas HANYA dengan JSON.`,
        },
        {
          role: "user",
          content: `Seed: ${seed}. Buat 1 soal kuis tentang topik: ${topik}.

Pastikan:
1. Soal punya jawaban faktual yang jelas
2. Jawaban benar sudah kamu verifikasi kebenarannya
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