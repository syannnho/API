import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    console.log("API HIT");

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // === AUTH KEY CHECK ===
    const authKey = req.headers["x-auth-key"] || req.headers["authorization"];
    const validKey = process.env.API_SECRET_KEY || "rahasia123";

    if (!authKey || authKey !== validKey) {
      return res.status(401).json({ 
        error: "Invalid auth key",
        hint: "Send 'X-Auth-Key: your_key' header"
      });
    }

    // === PROXY KE ENDPOINT ASLI ===
    const response = await fetch(
      "http://130.61.149.246:25400/oauth/guest/registrar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      }
    );

    const result = await response.json();

    return res.status(200).json(result);

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
