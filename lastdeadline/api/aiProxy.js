import https from "https"

const API_KEY = process.env.GROQ_API_KEY

function groqRequest(messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model:           "llama-3.1-8b-instant",
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
        1: "sains dasar (tubuh manusia, hewan, tumbuhan, cuaca, bumi) atau geografi (negara, ibu kota, benua, samudra)",
        2: "sejarah singkat (peristiwa penting, tokoh terkenal, penemuan ilmiah) atau matematika sederhana (perkalian, pecahan, persentase)",
        3: "ekonomi dasar, teknologi sehari-hari, logika, atau budaya Indonesia dan dunia",
      }
      const topik = topikMap[night] || topikMap[1]

      const result = await groqRequest([
        {
          role: "system",
          content: `Kamu adalah pembuat soal kuis edukatif. Tugasmu membuat soal yang:
- Mudah dipahami semua kalangan tapi tetap edukatif dan bermakna
- Memiliki jawaban yang PASTI BENAR dan tidak ambigu
- Bukan soal receh (hindari soal seperti "apa warna langit" atau "berapa 1+1")
- Bukan soal terlalu teknis atau butuh keahlian profesional
Contoh soal BAGUS: "Organ tubuh manusia apa yang berfungsi memompa darah ke seluruh tubuh?", "Apa ibu kota negara Jepang?", "Berapa hasil perkalian 12 x 15?", "Gas apa yang paling banyak di atmosfer bumi?", "Siapa penemu bola lampu listrik?"
Contoh soal BURUK (hindari): "Apa warna langit?", "Berapa 2+2?", "Apa warna daun?", soal yang jawabannya subjektif atau bisa benar/salah tergantung konteks.
Balas HANYA JSON.`,
        },
        {
          role: "user",
          content: `Seed:${seed}. Buat 1 soal kuis tentang ${topik}. Soal harus memiliki jawaban faktual yang jelas dan pasti. Sertakan juga jawaban benarnya agar kamu yakin soalnya valid. Balas JSON: {"soal":"tulis soal disini","topik":"nama topik singkat","jawaban_benar":"jawaban yang benar untuk soal ini"}`,
        },
      ], 400)

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
          content: `Kamu adalah penilai jawaban kuis yang sangat teliti dan jujur. Ikuti langkah ini dengan KETAT:

LANGKAH 1 - TENTUKAN JAWABAN BENAR:
Pikirkan sendiri jawaban yang benar untuk soal tersebut berdasarkan fakta yang kamu tahu. Jangan terpengaruh oleh jawaban user.

LANGKAH 2 - BANDINGKAN:
Bandingkan jawaban user dengan jawaban yang benar dari langkah 1.

LANGKAH 3 - BERI NILAI:
- Soal MATEMATIKA/HITUNG: Nilai 100 jika benar persis, nilai 0 jika salah. TIDAK ada nilai tengah.
- Soal PENGETAHUAN: Nilai 90-100 jika inti jawaban benar (typo kecil boleh). Nilai 50-70 jika mendekati benar tapi kurang tepat. Nilai 0-30 jika salah.
- JANGAN beri nilai tinggi hanya karena jawaban terdengar masuk akal. Harus BENAR secara fakta.

LANGKAH 4 - TULIS FEEDBACK:
Tulis jawaban yang benar untuk SOAL INI SAJA dalam 1 kalimat pendek. JANGAN menulis jawaban dari soal lain.

PENTING: Kamu harus jujur. Jika jawaban user salah, beri nilai rendah walaupun jawaban user terdengar percaya diri.
Balas HANYA JSON.`,
        },
        {
          role: "user",
          content: `Soal: "${soal}"
Jawaban user: "${jawaban}"

Ikuti 4 langkah yang diperintahkan:
1. Tulis jawaban benar untuk soal ini (dalam pikiranmu)
2. Bandingkan dengan jawaban user
3. Tentukan nilai 0-100
4. Tulis feedback berisi jawaban benar untuk soal ini

Balas JSON: {"jawaban_benar_internal":"[jawaban benar menurut kamu]","analisis":"[apakah jawaban user benar atau salah dan kenapa]","nilai":0,"feedback":"[jawaban benar untuk soal ini dalam 1 kalimat]"}`,
        },
      ], 400)

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