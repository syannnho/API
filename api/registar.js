// ============================================
// PROXY UNTUK SEMBUNYIKAN LINK REGISTRAR
// ============================================

// TARGET URL YANG DISEMBUNYIKAN (hanya ada di sini)
const REGISTRAR_URL = "http://130.61.149.246:25400/oauth/guest/registrar";

export default async function handler(req, res) {
    // ========== KILL SWITCH ==========
    // Matikan semua request dalam 1 detik
    const KILL_SWITCH = process.env.KILL_SWITCH === "true";
    
    if (KILL_SWITCH) {
        console.log(`[KILLED] Request ditolak pada ${new Date().toISOString()}`);
        return res.status(503).json({
            success: false,
            error: "Service temporarily disabled",
            code: "KILL_SWITCH_ACTIVE"
        });
    }
    // =================================

    // ========== AUTHENTIKASI ==========
    const PROXY_KEY = process.env.PROXY_KEY || "default_key_ganti_ini";
    const clientKey = req.headers["x-proxy-key"] || req.headers["x-auth-key"];
    
    if (!clientKey || clientKey !== PROXY_KEY) {
        console.log(`[UNAUTH] Attempt dari ${req.headers["x-forwarded-for"] || req.socket.remoteAddress}`);
        return res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "Invalid or missing x-proxy-key header"
        });
    }
    // =================================

    // ========== VALIDASI METHOD ==========
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed",
            message: "Only POST method is accepted"
        });
    }
    // =================================

    // ========== VALIDASI BODY ==========
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            error: "Bad request",
            message: "Request body is required"
        });
    }
    // =================================

    try {
        console.log(`[PROXY] Forwarding request ke target...`);
        
        // Forward request ke target API
        const response = await fetch(REGISTRAR_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
                "Accept-Encoding": "gzip",
                "Connection": "Keep-Alive"
            },
            body: JSON.stringify(req.body),
            timeout: 30000 // 30 detik timeout
        });

        // Baca response dari target
        const data = await response.json();
        
        console.log(`[PROXY] Response status: ${response.status}`);
        
        // Kirim balik ke client
        return res.status(response.status).json(data);
        
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        
        // Cek jenis error
        if (error.code === "FETCH_TIMEOUT" || error.name === "TimeoutError") {
            return res.status(504).json({
                success: false,
                error: "Gateway timeout",
                message: "Target server did not respond in time"
            });
        }
        
        if (error.code === "ECONNREFUSED") {
            return res.status(502).json({
                success: false,
                error: "Bad gateway",
                message: "Target server is unreachable"
            });
        }
        
        return res.status(500).json({
            success: false,
            error: "Internal proxy error",
            message: error.message
        });
    }
}

// ========== OPTIONAL: HANDLE CORS ==========
export const config = {
    api: {
        bodyParser: true,
        externalResolver: true,
    },
};
