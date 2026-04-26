export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authKey = req.headers["x-auth-key"];
  if (authKey !== process.env.AUTH_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const response = await fetch("http://130.61.149.246:25400/oauth/guest/registrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": req.headers["user-agent"] || ""
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();
    res.status(200).send(data);

  } catch (err) {
    res.status(500).json({ error: "Proxy error" });
  }
}
