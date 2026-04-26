import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authKey = req.headers["x-auth-key"];
  if (authKey !== process.env.AUTH_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Baca database device
    const dbPath = path.join(process.cwd(), "api", "device-db.json");
    const dbContent = fs.readFileSync(dbPath, "utf8");
    const deviceDb = JSON.parse(dbContent);

    // Ambil device_id dari header atau body
    let deviceId = req.headers["x-device-id"] || req.body?.device_id;
    
    if (!deviceId) {
      return res.status(400).json({ 
        error: "Device ID required", 
        message: "Kirim x-device-id di header atau device_id di body" 
      });
    }

    // Cari device di database
    const device = deviceDb.devices.find(d => d.device_id === deviceId);

    if (!device) {
      return res.status(403).json({ 
        error: "Device not registered",
        message: `Device '${deviceId}' tidak terdaftar`
      });
    }

    if (!device.is_verified) {
      return res.status(403).json({ 
        error: "Device not verified",
        message: `Device '${deviceId}' belum diverifikasi atau dinonaktifkan`
      });
    }

    // Jika device terverifikasi, lanjutkan proses
    const payload = {
      ...req.body,
      device_id: deviceId,
      device_verified: true,
      verified_at: new Date().toISOString()
    };

    const response = await fetch("http://130.61.149.246:25400/oauth/guest/registrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": req.headers["user-agent"] || ""
      },
      body: JSON.stringify(payload)
    });

    const data = await response.text();
    res.status(200).send(data);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy error", detail: err.message });
  }
}
