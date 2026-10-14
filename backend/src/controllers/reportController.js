const { query } = require('../config/db');
const { uploadImageToAzure } = require('../config/azureBlob');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are CityLense, an AI vision gateway for municipal e-governance. 
Analyze the image and return a strictly formatted JSON object. 
Do not include markdown blocks, just the raw JSON.
{
  "category": "Must be exactly one of: 'Roads & Infra', 'Water & Drainage', 'Health & SWM', 'Electricity', 'Environment & Gardens', 'Encroachment & Estate', 'Revenue & Property Tax', 'Other'",
  "confidence": <float between 0 and 1>,
  "summary": "1-2 sentence technical summary of the civic defect",
  "is_valid": true or false
}`;

let schemaInitialized = false;
const ensureDatabaseSchema = async () => {
    if (schemaInitialized) return;
    try {
        await query(`
            ALTER TABLE complaints 
            ADD COLUMN IF NOT EXISTS title TEXT,
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS location_name TEXT,
            ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(150),
            ADD COLUMN IF NOT EXISTS reporter_email VARCHAR(150),
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'verified',
            ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS social_post TEXT,
            ADD COLUMN IF NOT EXISTS social_posted BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT
            );
        `);

        schemaInitialized = true;
    } catch (err) {
        console.error('Schema migration warning:', err.message);
    }
};

const generateAutomatedSocialPost = ({ refId, city, category, title, summary, lat, lng }) => {
    const cleanCityTag = (city || 'Maharashtra').split(' ')[0].replace(/[^a-zA-Z]/g, '');
    const cleanCatTag = (category || 'Civic').split(' ')[0].replace(/[^a-zA-Z]/g, '');
    const mapsLink = `https://www.google.com/maps?q=${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;

    return `🚨 [AI-VERIFIED CIVIC DOCKET #${refId}]\n📍 Jurisdiction: ${city}\n🛠 Wing: ${category}\n📌 Issue: ${title || category}\n\n📋 AI Inspection: ${summary}\n\n🗺 Telemetry Pin: ${mapsLink}\n\ncc: Official Nodal Officer — Requesting time-bound rectification.\n#${cleanCityTag} #${cleanCatTag} #CityLense #CivicAccountability`;
};

const postToXApiV2 = async (text) => {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) return false;

    const url = 'https://api.x.com/2/tweets';
    const oauth = {
        oauth_consumer_key: X_API_KEY,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: X_ACCESS_TOKEN,
        oauth_version: '1.0'
    };

    const paramString = Object.keys(oauth)
        .sort()
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauth[k])}`)
        .join('&');

    const baseString = `POST&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(X_API_SECRET)}&${encodeURIComponent(X_ACCESS_SECRET)}`;
    oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

    const authHeader =
        'OAuth ' +
        Object.keys(oauth)
            .sort()
            .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauth[k])}"`)
            .join(', ');

    await axios.post(url, { text }, { headers: { Authorization: authHeader, 'Content-Type': 'application/json' } });
    return true;
};

const autoBroadcastSocial = async ({ socialPost, imageUrl, refId, city, category }) => {
    let posted = false;
    let webhookUrl = process.env.SOCIAL_WEBHOOK_URL || '';

    if (!webhookUrl) {
        try {
            const res = await query(`SELECT setting_value FROM system_settings WHERE setting_key = 'webhook_url'`);
            if (res.rows.length > 0) webhookUrl = res.rows[0].setting_value;
        } catch {}
    }

    if (webhookUrl) {
        try {
            await axios.post(webhookUrl, {
                content: socialPost,
                username: 'CityLense AI Dispatch',
                embeds: imageUrl ? [{ title: `Docket #${refId} — ${city} (${category})`, image: { url: imageUrl } }] : []
            });
            posted = true;
        } catch (err) {
            console.error('Webhook auto-post warning:', err.message);
        }
    }

    try {
        const xSuccess = await postToXApiV2(socialPost);
        if (xSuccess) posted = true;
    } catch (err) {
        console.error('X API auto-post warning:', err.message);
    }

    return posted;
};

const handleIncomingReport = async (req, res) => {
    try {
        await ensureDatabaseSchema();

        const { latitude, longitude, title, description, locationName, reporterName, reporterEmail } = req.body;
        
        if (!req.file || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing image or GPS coordinates.' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        const fileName = `civic-report-${Date.now()}.jpg`;
        const imageUrl = await uploadImageToAzure(req.file.buffer, fileName);

        const base64Image = req.file.buffer.toString('base64');
        const aiResponse = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/free",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: SYSTEM_PROMPT },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const rawContent = aiResponse.data.choices[0].message.content.trim();
        const startIndex = rawContent.indexOf('{');
        const endIndex = rawContent.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI did not return a valid JSON object.");
        }
        
        const jsonString = rawContent.substring(startIndex, endIndex + 1);
        const aiData = JSON.parse(jsonString);

        if (!aiData.is_valid || aiData.confidence < 0.60) {
            return res.status(422).json({ error: 'Image rejected. Not a valid civic defect.', aiData });
        }

        const routeQuery = `
            SELECT id, name, 
                   email_roads, email_water, email_health_swm, email_electricity, 
                   email_encroachment, email_environment, email_revenue, email_nodal,
                   ST_DistanceSphere(center_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters
            FROM municipalities
            ORDER BY distance_meters ASC
            LIMIT 1;
        `;
        const routeResult = await query(routeQuery, [lng, lat]);
        const nearestCity = routeResult.rows[0];

        let targetEmail = nearestCity.email_nodal;
        if (aiData.category === 'Roads & Infra') targetEmail = nearestCity.email_roads;
        else if (aiData.category === 'Water & Drainage') targetEmail = nearestCity.email_water;
        else if (aiData.category === 'Health & SWM') targetEmail = nearestCity.email_health_swm;
        else if (aiData.category === 'Electricity') targetEmail = nearestCity.email_electricity;
        else if (aiData.category === 'Environment & Gardens') targetEmail = nearestCity.email_environment;
        else if (aiData.category === 'Encroachment & Estate') targetEmail = nearestCity.email_encroachment;
        else if (aiData.category === 'Revenue & Property Tax') targetEmail = nearestCity.email_revenue;

        const refId = `CL-${Math.floor(Math.random() * 900000) + 100000}`;
        const finalTitle = title || `${aiData.category} Defect — ${nearestCity.name}`;
        const finalDesc = description || aiData.summary;

        const autoSocialPost = generateAutomatedSocialPost({
            refId,
            city: nearestCity.name,
            category: aiData.category,
            title: finalTitle,
            summary: aiData.summary,
            lat,
            lng
        });

        const wasAutoPosted = await autoBroadcastSocial({
            socialPost: autoSocialPost,
            imageUrl,
            refId,
            city: nearestCity.name,
            category: aiData.category
        });

        const insertQuery = `
            INSERT INTO complaints (
                municipality_id, reference_id, category, confidence, ai_summary, 
                image_url, latitude, longitude, location_geom, 
                title, description, location_name, reporter_name, reporter_email,
                status, upvotes, social_post, social_posted
            )
            VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, $8, ST_SetSRID(ST_MakePoint($9, $10), 4326),
                $11, $12, $13, $14, $15,
                'verified', 1, $16, $17
            )
            RETURNING *;
        `;
        
        await query(insertQuery, [
            nearestCity.id, refId, aiData.category, aiData.confidence, aiData.summary,
            imageUrl, lat, lng, lng, lat,
            finalTitle, finalDesc, locationName || nearestCity.name, reporterName || 'Citizen Reporter', reporterEmail || '',
            autoSocialPost, wasAutoPosted
        ]);

        res.status(200).json({
            success: true,
            reference_id: refId,
            jurisdiction: nearestCity.name,
            distance_meters: Math.round(nearestCity.distance_meters),
            department_email: targetEmail,
            image_url: imageUrl,
            latitude: lat,
            longitude: lng,
            title: finalTitle,
            description: finalDesc,
            social_post: autoSocialPost,
            social_posted: wasAutoPosted,
            ai_classification: aiData
        });

    } catch (error) {
        console.error('Intake error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'System processing failed. Please try again.' });
    }
};

const getReports = async (req, res) => {
    try {
        await ensureDatabaseSchema();

        const result = await query(`
            SELECT 
                c.*,
                m.name AS jurisdiction,
                m.email_roads,
                m.email_water,
                m.email_health_swm,
                m.email_electricity,
                m.email_environment,
                m.email_encroachment,
                m.email_revenue,
                m.email_nodal
            FROM complaints c
            LEFT JOIN municipalities m ON c.municipality_id = m.id
            ORDER BY c.id DESC
            LIMIT 200;
        `);

        const rows = result.rows.map((row) => {
            let deptEmail = row.email_nodal;
            if (row.category === 'Roads & Infra') deptEmail = row.email_roads;
            else if (row.category === 'Water & Drainage') deptEmail = row.email_water;
            else if (row.category === 'Health & SWM') deptEmail = row.email_health_swm;
            else if (row.category === 'Electricity') deptEmail = row.email_electricity;
            else if (row.category === 'Environment & Gardens') deptEmail = row.email_environment;
            else if (row.category === 'Encroachment & Estate') deptEmail = row.email_encroachment;
            else if (row.category === 'Revenue & Property Tax') deptEmail = row.email_revenue;

            const lat = parseFloat(row.latitude) || 16.7050;
            const lng = parseFloat(row.longitude) || 74.2433;

            const socialText = row.social_post || generateAutomatedSocialPost({
                refId: row.reference_id,
                city: row.jurisdiction || 'Maharashtra',
                category: row.category || 'Civic Defect',
                title: row.title,
                summary: row.ai_summary || '',
                lat,
                lng
            });

            return {
                ...row,
                latitude: lat,
                longitude: lng,
                jurisdiction: row.jurisdiction || 'Kolhapur (KMC)',
                department_email: deptEmail,
                social_post: socialText
            };
        });

        res.status(200).json(rows);
    } catch (error) {
        console.error('getReports error:', error.message);
        res.status(500).json({ error: 'Failed to fetch reports.' });
    }
};

const updateReportStatus = async (req, res) => {
    try {
        await ensureDatabaseSchema();
        const { refId } = req.params;
        const { status, social_posted } = req.body;

        const result = await query(
            `UPDATE complaints 
             SET status = COALESCE($1, status),
                 social_posted = COALESCE($2, social_posted)
             WHERE reference_id = $3
             RETURNING *;`,
            [status, social_posted, refId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Docket not found in PostgreSQL.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status.' });
    }
};

const upvoteReport = async (req, res) => {
    try {
        await ensureDatabaseSchema();
        const { refId } = req.params;

        const result = await query(
            `UPDATE complaints 
             SET upvotes = COALESCE(upvotes, 1) + 1 
             WHERE reference_id = $1 
             RETURNING *;`,
            [refId]
        );

        res.status(200).json(result.rows[0] || { reference_id: refId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upvote.' });
    }
};

const registerUser = async (req, res) => {
    try {
        await ensureDatabaseSchema();
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const hash = crypto.createHash('sha256').update(password).digest('hex');
        const result = await query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
             RETURNING id, name, email;`,
            [name, email.toLowerCase(), hash]
        );

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Registration failed.' });
    }
};

const loginUser = async (req, res) => {
    try {
        await ensureDatabaseSchema();
        const { email, password } = req.body;
        const hash = crypto.createHash('sha256').update(password || '').digest('hex');

        const result = await query(
            `SELECT id, name, email, password_hash FROM users WHERE email = $1;`,
            [(email || '').toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Account not found. Please register first.' });
        }

        const user = result.rows[0];
        if (user.password_hash !== hash) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        res.status(200).json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
        res.status(500).json({ error: 'Login failed.' });
    }
};

const getSettings = async (req, res) => {
    try {
        await ensureDatabaseSchema();
        const result = await query(`SELECT setting_key, setting_value FROM system_settings;`);
        const settings = {};
        result.rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load settings.' });
    }
};

const updateSettings = async (req, res) => {
    try {
        await ensureDatabaseSchema();
        const { webhook_url } = req.body;
        await query(
            `INSERT INTO system_settings (setting_key, setting_value)
             VALUES ('webhook_url', $1)
             ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;`,
            [webhook_url || '']
        );
        res.status(200).json({ success: true, webhook_url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings.' });
    }
};

module.exports = { 
    handleIncomingReport, 
    getReports, 
    updateReportStatus, 
    upvoteReport,
    registerUser,
    loginUser,
    getSettings,
    updateSettings
};