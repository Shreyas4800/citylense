const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DB_PASSWORD) {
  console.error("DB_PASSWORD is missing or undefined in your .env file.");
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

const schemaSQL = `
  DROP TABLE IF EXISTS complaints CASCADE;
  DROP TABLE IF EXISTS municipalities CASCADE;

  CREATE EXTENSION IF NOT EXISTS postgis;

  CREATE TABLE municipalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    center_geom GEOMETRY(Point, 4326) NOT NULL,
    email_roads VARCHAR(255),
    email_water VARCHAR(255),
    email_health_swm VARCHAR(255),
    email_electricity VARCHAR(255),
    email_encroachment VARCHAR(255),
    email_environment VARCHAR(255),
    email_revenue VARCHAR(255),
    email_nodal VARCHAR(255)
  );

  CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id INT REFERENCES municipalities(id),
    reference_id VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    ai_summary TEXT NOT NULL,
    image_url TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    status VARCHAR(50) DEFAULT 'AI_VERIFIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_municipalities_geom ON municipalities USING GIST(center_geom);
  CREATE INDEX idx_complaints_geom ON complaints USING GIST(location_geom);

  INSERT INTO municipalities (
    name, center_geom, 
    email_roads, email_water, email_health_swm, email_electricity, 
    email_encroachment, email_environment, email_revenue, email_nodal
  )
  VALUES 
    (
      'Brihanmumbai (BMC)', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326),
      'dmc.engg@mcgm.gov.in', 'ca.wssd@mcgm.gov.in', 'dmc.swm@mcgm.gov.in', 'dmc.engg@mcgm.gov.in',
      'dmc.re@mcgm.gov.in', 'dmc.env@mcgm.gov.in', 'dmc.aac@mcgm.gov.in', 'dmc.mc@mcgm.gov.in'
    ),
    (
      'Pune (PMC)', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326),
      'road@punecorporation.org', 'ceproject@punecorporation.org', 'dmcspecial@punecorporation.org', 'itsupport@punecorporation.org',
      'estatemgmt@punecorporation.org', 'treeauthority@punecorporation.org', 'propertytax@punecorporation.org', 'info@punecorporation.org'
    ),
    (
      'Pimpri-Chinchwad (PCMC)', ST_SetSRID(ST_MakePoint(73.7997, 18.6298), 4326),
      'm.nikam@pcmcindia.gov.in', 'p.ombhase@pcmcindia.gov.in', 'l.gophane@pcmcindia.gov.in', 'm.chavan@pcmcindia.gov.in',
      's.bahure@pcmcindia.gov.in', 'egov@pcmcindia.gov.in', 'pb.patil@pcmcindia.gov.in', 'commissioner@pcmcindia.gov.in'
    ),
    (
      'Navi Mumbai (NMMC)', ST_SetSRID(ST_MakePoint(73.0297, 19.0330), 4326),
      'addlcommcity@nmmc.gov.in', 'commissioner@nmmc.gov.in', 'dmc_swm@nmmc.gov.in', 'addlcommcity@nmmc.gov.in',
      'dmc_encr@nmmc.gov.in', 'dmc_swm@nmmc.gov.in', 'dmc_revenue@nmmc.gov.in', 'commissioner@nmmc.gov.in'
    ),
    (
      'Kalyan-Dombivli (KDMC)', ST_SetSRID(ST_MakePoint(73.1461, 19.2354), 4326),
      'ce.kdmc@gmail.com', 'eews.kdmc@gmail.com', 'kdmcswm@gmail.com', 'ce.kdmc@gmail.com',
      'commissionerkdmc@gmail.com', 'kdmcgarden@gmail.com', 'kdmctaxhq@gmail.com', 'commissionerkdmc@gmail.com'
    ),
    (
      'Thane (TMC)', ST_SetSRID(ST_MakePoint(72.9781, 19.2183), 4326),
      'ce@thanecity.gov.in', 'ce@thanecity.gov.in', 'mho@thanecity.gov.in', 'ce@thanecity.gov.in',
      'dmc3@thanecity.gov.in', 'dmc3@thanecity.gov.in', 'tmchelpdesk@ascentechindia.com', 'dmc3@thanecity.gov.in'
    ),
    (
      'Nashik (NMC)', ST_SetSRID(ST_MakePoint(73.7898, 20.0110), 4326),
      'ce_pwd@nmc.gov.in', 'se_ws@nmc.gov.in', 'dmc_sw@nmc.gov.in', 'ee_electrical@nmc.gov.in',
      'dmc_e@nmc.gov.in', 'ee_sew3@nmc.gov.in', 'dmc_tax@nmc.gov.in', 'commissioner@nmc.gov.in'
    ),
    (
      'Nagpur (NMC)', ST_SetSRID(ST_MakePoint(79.0882, 21.1458), 4326),
      'eeproject3nmc@gmail.com', 'nmcegov@gmail.com', 'nmcegov@gmail.com', 'eeproject3nmc@gmail.com',
      'estate@nmcnagpur.gov.in', 'nmcegov@gmail.com', 'nmcegov@gmail.com', 'nmcegov@gmail.com'
    ),
    (
      'Kolhapur (KMC)', ST_SetSRID(ST_MakePoint(74.2433, 16.7050), 4326),
      'cityengineerkmc@rediffmail.com', 'commissionerkmc@rediffmail.com', 'kmchealthofficer14@gmail.com', 'prokmc29@gmail.com',
      'commissionerkmc@rediffmail.com', 'prokmc29@gmail.com', 'kmchelpdesk@ascentechindia.com', 'commissionerkmc@rediffmail.com'
    ),
    (
      'Ichalkaranji (IMC)', ST_SetSRID(ST_MakePoint(74.4593, 16.6966), 4326),
      'imc22.bandhkam@gmail.com', 'imc22.waterworks@gmail.com', 'imc22.aarogya@gmail.com', 'imc22.electrical@gmail.com',
      'imc22.tp@gmail.com', 'imc22.gardan@gmail.com', 'imc22.tax@gmail.com', 'imc22.asstcomm@gmail.com'
    );
`;

async function initializeDatabase() {
  console.log('Connecting to Azure PostgreSQL...');
  try {
    const client = await pool.connect();
    await client.query(schemaSQL);
    console.log('All 10 municipalities seeded successfully from Excel.');

    const verifyRes = await client.query('SELECT name, email_electricity, email_nodal FROM municipalities LIMIT 5;');
    console.table(verifyRes.rows);

    client.release();
    await pool.end();
  } catch (err) {
    console.error('Database Error:', err.message);
    process.exit(1);
  }
}

initializeDatabase();