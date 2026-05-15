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

      // Topik umum berdasarkan malam — makin susah tapi tetap universal
      const topikMap = {
        1: "pengetahuan umum sehari-hari seperti sains dasar, geografi, atau fakta umum yang semua orang tahu",
        2: "ilmu pengetahuan umum seperti biologi dasar, sejarah singkat, atau matematika sederhana",
        3: "wawasan umum seperti ekonomi dasar, budaya, teknologi sehari-hari, atau logika sederhana",
      }
      const topik = topikMap[night] || topikMap[1]

      const result = await groqRequest([
        {
          role: "system",
          content: "Kamu pembuat soal kuis. Buat soal pertanyaan singkat yang mudah dipahami semua orang. Balas HANYA JSON.",
        },
        {
          role: "user",
          content: `Seed:${seed}. Buat 1 soal pertanyaan singkat tentang ${topik}. Soal harus bisa dijawab dengan 1-2 kalimat pendek oleh siapapun tanpa keahlian khusus. Contoh soal yang bagus: "Apa fungsi utama jantung dalam tubuh manusia?", "Sebutkan 3 negara di Asia Tenggara!", "Apa yang dimaksud dengan inflasi?", "Berapa hasil dari 15 dikali 8?". JANGAN buat soal yang terlalu teknis atau butuh keahlian profesional. Balas JSON: {"soal":"tulis soal disini","topik":"nama topik singkat"}`,
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
          content: "Kamu penilai jawaban kuis yang adil. Aturan: (1) Soal PERHITUNGAN/MATEMATIKA — cek kebenarannya secara matematis, jika benar beri 100, jika salah beri 0, tidak ada nilai tengah. (2) Soal PENGETAHUAN UMUM — beri 85-100 jika inti jawaban benar walau singkat, beri 50-70 jika mendekati benar tapi kurang tepat, beri 0-40 jika salah. Jawaban singkat tapi benar = nilai penuh. Field feedback WAJIB berisi jawaban yang benar secara singkat, bukan komentar tentang jawaban user. Balas HANYA JSON.",
        },
        {
          role: "user",
          content: `Soal: "${soal}"\nJawaban user: "${jawaban}"\n\nNilai jawaban ini. Untuk soal matematika hanya boleh nilai 0 atau 100. Untuk soal lain jawaban singkat tapi benar tetap dapat nilai penuh. Isi feedback dengan jawaban yang benar secara singkat dalam bahasa Indonesia, contoh format feedback: "Jawaban: Tokyo", "2 (hasil 4-2=2)", "Jantung berfungsi memompa darah". Balas JSON: {"nilai":100,"feedback":"jawaban benar singkat"}`,
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