const REGISTRAR_URL = "http://130.61.149.246:25400/oauth/guest/registrar";

export default async function handler(req, res) {
    // KILL SWITCH sederhana (opsional)
    if (process.env.KILL_SWITCH === "true") {
        return res.status(503).json({ error: "Killed" });
    }

    try {
        const response = await fetch(REGISTRAR_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
            },
            body: JSON.stringify(req.body),
        });
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
