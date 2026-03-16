import http from "http"
import https from "https"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  try {
    const env = readFileSync(join(__dirname, ".env"), "utf-8")
    for (const line of env.split("\n")) {
      const [key, ...val] = line.split("=")
      if (key && val.length) process.env[key.trim()] = val.join("=").trim()
    }
  } catch (e) {}
}

loadEnv()

const API_KEY = process.env.GROQ_API_KEY
const PORT    = 3001

function groqRequest(messages, maxTokens, onDone) {
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
        onDone(null, JSON.parse(clean))
      } catch (e) {
        onDone(e, null)
      }
    })
  })
  req.on("error", e => onDone(e, null))
  req.write(payload)
  req.end()
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return }
  if (req.method !== "POST")    { res.writeHead(404); res.end(); return }

  let body = ""
  req.on("data", chunk => { body += chunk })
  req.on("end", () => {
    console.log("REQUEST:", req.method, req.url)
    const parsed = JSON.parse(body)

    if (req.url === "/generate-soal" || req.url.startsWith("/generate-soal")) {
      const { night } = parsed
      const difficulty = ["mudah", "sedang", "sulit"][(night||1)-1]
      const topik = night === 1
        ? "pengenalan komputer, perangkat keras, perangkat lunak, atau pengertian dasar pemrograman"
        : night === 2
          ? "variabel, tipe data, perulangan, kondisional, atau fungsi dasar pemrograman"
          : "array, struktur data sederhana, algoritma dasar, atau jaringan komputer dasar"
      const seed = Math.floor(Math.random() * 99999)

      groqRequest([
        { role: "system", content: "Kamu dosen informatika. Buat soal esai singkat untuk mahasiswa semester 1-2. Balas HANYA JSON." },
        { role: "user",   content: `Seed:${seed}. Buat 1 soal esai SANGAT MUDAH tentang ${topik} untuk mahasiswa baru informatika. Soal harus bisa dijawab dengan 1 kalimat pendek. HANYA buat soal definisi atau perbedaan sederhana. Contoh: "Apa itu CPU?", "Apa perbedaan RAM dan ROM?", "Apa yang dimaksud variabel?", "Sebutkan contoh perangkat input!". JANGAN buat soal analisis, hitungan, atau teori rumit. Balas JSON: {"soal":"tulis soal disini","topik":"nama topik singkat"}` },
      ], 300, (err, result) => {
        if (err || !result?.soal) {
          res.writeHead(500, { "content-type": "application/json" })
          res.end(JSON.stringify({ ok: false, error: "Gagal generate soal" }))
          return
        }
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ ok: true, soal: result.soal, topik: result.topik || topik }))
      })

    } else if (req.url === "/nilai-jawaban" || req.url.startsWith("/nilai-jawaban")) {
      const { soal, jawaban } = parsed
      if (!soal || !jawaban) {
        res.writeHead(400, { "content-type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: "soal dan jawaban wajib diisi" }))
        return
      }

      groqRequest([
        { role: "system", content: "Kamu dosen penilai jawaban mahasiswa. Beri nilai objektif. Balas HANYA JSON." },
        { role: "user",   content: `Soal: "${soal}"\nJawaban mahasiswa: "${jawaban}"\n\nNilai jawaban ini dari 0-100 berdasarkan kebenaran dan kelengkapan. Balas JSON: {"nilai":75,"feedback":"penjelasan singkat 1 kalimat"}` },
      ], 200, (err, result) => {
        if (err || result?.nilai === undefined) {
          res.writeHead(500, { "content-type": "application/json" })
          res.end(JSON.stringify({ ok: false, error: "Gagal nilai jawaban" }))
          return
        }
        const nilai = Math.max(0, Math.min(100, Math.round(Number(result.nilai))))
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ ok: true, nilai, feedback: result.feedback || "" }))
      })

    } else {
      res.writeHead(404); res.end()
    }
  })
})

server.listen(PORT, () => {
  console.log(`AI proxy jalan di http://localhost:${PORT}`)
})