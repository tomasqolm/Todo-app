import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Vytvor tabulku ak neexistuje
    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    if (req.method === 'GET') {
      const result = await sql`SELECT data FROM todos ORDER BY id DESC LIMIT 1`;
      
      if (result.rows.length > 0) {
        return res.status(200).json(result.rows[0].data);
      }
      
      return res.status(200).json([]);
    }

    if (req.method === 'POST') {
      const todos = req.body;
      
      // Delete old data and insert new
      await sql`DELETE FROM todos`;
      await sql`INSERT INTO todos (data) VALUES (${JSON.stringify(todos)})`;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: error.message });
  }
}
