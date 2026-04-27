export default async function handler(req, res) {
  try {
    // hanya POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ambil auth key
    const authKey = req.headers["x-auth-key"];

    // validasi
    if (authKey !== process.env.AUTH_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // proxy ke API asli
    const response = await fetch(
      "",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": req.headers["user-agent"] || ""
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.text();

    return res.status(200).send(data);

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Proxy error" });
  }
}
