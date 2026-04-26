import crypto from "crypto";
import { MongoClient } from "mongodb";

const SECRET = process.env.SECRET_KEY;
const AUTH_KEY = process.env.AUTH_KEY;
const TARGET_URL = "http://130.61.149.246:25400/oauth/guest/registrar";

let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db("n4taza");
  }
  return db;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ================= HEADER =================
  const did = req.headers["x-device-id"];
  const ts  = req.headers["x-timestamp"];
  const sig = req.headers["x-signature"];
  const authKey = req.headers["x-auth-key"];

  // ================= BASIC VALIDATION =================
  if (!did || !ts || !sig) {
    return res.status(403).json({ error: "Missing headers" });
  }

  // ================= AUTH KEY (OPTIONAL) =================
  if (AUTH_KEY && authKey !== AUTH_KEY) {
    return res.status(403).json({ error: "Forbidden (auth key)" });
  }

  // ================= TIMESTAMP CHECK =================
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(ts)) > 60) {
    return res.status(403).json({ error: "Expired request" });
  }

  // ================= HMAC VERIFY =================
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${did}:${ts}`)
    .digest("hex");

  if (sig !== expected) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  try {
    const db = await connectDB();
    const devices = db.collection("devices");

    // 🔥 1x activate (atomic)
    const result = await devices.findOneAndUpdate(
      { device_id: did, used: false },
      { $set: { used: true, used_at: new Date() } }
    );

    if (!result.value) {
      return res.status(403).json({
        error: "Device invalid or already used"
      });
    }

    // ================= PROXY KE API ASLI =================
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": req.headers["user-agent"] || ""
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();

    return res.status(200).send(data);

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
