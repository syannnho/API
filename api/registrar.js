export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authKey = req.headers["x-auth-key"];
  if (authKey !== process.env.AUTH_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const dbPath = path.join(process.cwd(), "api", "device-db.json");
    const dbContent = fs.readFileSync(dbPath, "utf8");
    const deviceDb = JSON.parse(dbContent);

    let deviceId = req.headers["x-device-id"] || req.body?.device_id;
    
    if (!deviceId) {
      return res.status(400).json({ 
        error: "Device ID required",
        message: "Harus kirim device_id"
      });
    }

    const device = deviceDb.devices.find(d => d.device_id === deviceId);

    if (!device || !device.is_verified) {
      return res.status(403).json({ 
        error: "Access Denied",
        message: "Device ID tidak dikenali atau tidak aktif"
      });
    }

    // CEK APAKAH HANYA VERIFIKASI?
    if (req.body?.verify_only === true) {
      return res.status(200).json({ 
        device_verified: true,
        device_id: deviceId
      });
    }

    // ========== LANJUT CREATE ACCOUNT ==========
    const payload = {
      ...req.body,
      device_id: deviceId,
      verified: true,
      timestamp: new Date().toISOString()
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
    console.error("Error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
