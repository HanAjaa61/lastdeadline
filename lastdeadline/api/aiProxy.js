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
      const difficulty = ["mudah", "sedang", "sulit"][(night || 1) - 1]
      const topik = night === 1
        ? "pengenalan komputer, perangkat keras, perangkat lunak, atau pengertian dasar pemrograman"
        : night === 2
          ? "variabel, tipe data, perulangan, kondisional, atau fungsi dasar pemrograman"
          : "array, struktur data sederhana, algoritma dasar, atau jaringan komputer dasar"
      const seed = Math.floor(Math.random() * 99999)

      const result = await groqRequest([
        { role: "system", content: "Kamu dosen informatika. Buat soal esai singkat untuk mahasiswa semester 1-2. Balas HANYA JSON." },
        { role: "user",   content: `Seed:${seed}. Buat 1 soal esai SANGAT MUDAH tentang ${topik} untuk mahasiswa baru informatika. Soal harus bisa dijawab dengan 1 kalimat pendek. HANYA buat soal definisi atau perbedaan sederhana. Contoh: "Apa itu CPU?", "Apa perbedaan RAM dan ROM?", "Apa yang dimaksud variabel?", "Sebutkan contoh perangkat input!". JANGAN buat soal analisis, hitungan, atau teori rumit. Balas JSON: {"soal":"tulis soal disini","topik":"nama topik singkat"}` },
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
        { role: "system", content: "Kamu dosen penilai jawaban mahasiswa. Beri nilai objektif. Balas HANYA JSON." },
        { role: "user",   content: `Soal: "${soal}"\nJawaban mahasiswa: "${jawaban}"\n\nNilai jawaban ini dari 0-100 berdasarkan kebenaran dan kelengkapan. Balas JSON: {"nilai":75,"feedback":"penjelasan singkat 1 kalimat"}` },
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