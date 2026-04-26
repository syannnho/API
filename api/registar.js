const REGISTRAR_URL = "http://130.61.149.246:25400/oauth/guest/registrar";

export default async function handler(req, res) {
    // KILL SWITCH via environment variable
    if (process.env.KILL_SWITCH === "true") {
        return res.status(503).json({ error: "Killed" });
    }

    // Hanya terima method POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
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
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
