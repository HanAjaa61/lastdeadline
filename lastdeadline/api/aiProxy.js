import https from "https"

const API_KEY = process.env.GROQ_API_KEY

function groqRequest(messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model:           "llama-3.1-8b-instant",
      max_tokens:      maxTokens,
      temperature:     0.8,
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
          reject(e)
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
      const seed = Math.floor(Math.random() * 99999)

      const topikMap = {
        1: "pilih SALAH SATU secara acak: (1) pengetahuan umum seperti ibu kota negara, nama benua, atau fakta alam sederhana, ATAU (2) matematika dasar seperti penjumlahan, pengurangan, perkalian, atau pembagian bilangan 1-50",
        2: "pilih SALAH SATU secara acak: (1) sains dasar seperti fungsi organ tubuh, siklus air, atau nama planet, ATAU (2) matematika sedang seperti pecahan sederhana, persen, atau kelipatan bilangan",
        3: "pilih SALAH SATU secara acak: (1) wawasan umum seperti sejarah singkat, geografi, atau budaya Indonesia, ATAU (2) matematika menengah seperti luas bangun datar sederhana, rata-rata, atau konversi satuan",
      }
      const topik = topikMap[night] || topikMap[1]

      const result = await groqRequest([
        {
          role: "system",
          content: "Kamu pembuat soal kuis harian. Buat soal yang bisa dijawab semua orang tanpa keahlian khusus. Soal matematika harus punya jawaban angka yang pasti. Balas HANYA JSON.",
        },
        {
          role: "user",
          content: `Seed:${seed}. Buat 1 soal tentang ${topik}. Aturan: soal harus singkat (1 kalimat), bisa dijawab dengan 1-2 kalimat atau 1 angka, JANGAN soal yang butuh keahlian profesional. Contoh soal bagus: "Berapa hasil 24 dikali 7?", "Apa ibu kota negara Jepang?", "Sebutkan 3 planet dalam tata surya!", "Berapa 15% dari 200?", "Organ apa yang memompa darah dalam tubuh manusia?". Balas JSON: {"soal":"tulis soal disini","topik":"nama topik singkat"}`,
        },
      ], 300)

      if (!result?.soal) {
        res.status(500).json({ ok: false, error: "Gagal generate soal" })
        return
      }
      res.status(200).json({ ok: true, soal: result.soal, topik: result.topik || topik })

    } else if (url.includes("nilai-jawaban")) {
      const { soal, jawaban } = body
      if (!soal || !jawaban) {
        res.status(400).json({ ok: false, error: "soal dan jawaban wajib diisi" })
        return
      }

      const result = await groqRequest([
        {
          role: "system",
          content: "Kamu penilai jawaban kuis. Nilai secara objektif tapi murah hati — jawaban yang mendekati benar tetap diberi nilai tinggi. Untuk soal matematika, nilai 100 jika jawaban benar, 0 jika salah. Balas HANYA JSON.",
        },
        {
          role: "user",
          content: `Soal: "${soal}"\nJawaban: "${jawaban}"\n\nNilai dari 0-100. Untuk soal pengetahuan umum, beri 70+ kalau mendekati benar. Untuk soal matematika, beri 100 kalau benar persis, 0 kalau salah. Balas JSON: {"nilai":75,"feedback":"penjelasan singkat 1 kalimat dalam bahasa Indonesia"}`,
        },
      ], 200)

      if (result?.nilai === undefined) {
        res.status(500).json({ ok: false, error: "Gagal nilai jawaban" })
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