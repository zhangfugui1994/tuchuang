export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export async function POST(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file uploaded', success: false }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Upload to Telegraph
    const tgFormData = new FormData();
    tgFormData.append('file', file, file.name);

    const tgRes = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: tgFormData
    });

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      return Response.json({ error: 'Telegraph upload failed', detail: errText, success: false }, {
        status: 502,
        headers: corsHeaders
      });
    }

    const tgResult = await tgRes.json();
    
    if (!tgResult || !tgResult[0] || !tgResult[0].src) {
      return Response.json({ error: 'Invalid response from Telegraph', success: false }, {
        status: 502,
        headers: corsHeaders
      });
    }

    const imageUrl = 'https://telegra.ph' + tgResult[0].src;

    return Response.json({
      url: imageUrl,
      src: tgResult[0].src,
      success: true
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return Response.json({
      error: error.message,
      success: false
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}
