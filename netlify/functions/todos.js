import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    if (req.method === 'GET') {
      // Get todos
      const result = await sql`
        SELECT data FROM todos 
        WHERE user_id = 'default' 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const todos = result.length > 0 ? result[0].data : [];
      
      return new Response(JSON.stringify(todos), {
        status: 200,
        headers
      });
    }

    if (req.method === 'POST') {
      // Save todos
      const body = await req.json();
      
      // Delete old data
      await sql`DELETE FROM todos WHERE user_id = 'default'`;
      
      // Insert new data
      await sql`
        INSERT INTO todos (user_id, data, updated_at) 
        VALUES ('default', ${JSON.stringify(body)}, NOW())
      `;
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};
