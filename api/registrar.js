import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  try {
    console.log("API HIT");

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    await client.connect();

    const db = client.db("n4taza");
    const devices = db.collection("devices");

    const deviceId = req.headers["x-device-id"];

    if (!deviceId) {
      return res.status(400).json({ error: "No device id" });
    }

    const device = await devices.findOne({ device_id: deviceId });

    if (!device || device.used) {
      return res.status(403).json({ error: "Device invalid / used" });
    }

    await devices.updateOne(
      { device_id: deviceId },
      { $set: { used: true } }
    );

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

    const data = await response.text();

    return res.status(200).send(data);

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
