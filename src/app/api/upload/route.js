export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export async function POST(request) {
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
    const contentType = request.headers.get('content-type') || '';
    
    let file, fileName;
    
    // Support both multipart/form-data and base64 JSON
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.file || !body.filename) {
        return Response.json({ error: 'Missing file data', success: false }, {
          status: 400,
          headers: corsHeaders
        });
      }
      
      // Decode base64 to blob
      const byteCharacters = atob(body.file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      file = blob;
      fileName = body.filename;
    } else {
      const formData = await request.formData();
      file = formData.get('file');
      if (!file) {
        return Response.json({ error: 'No file uploaded', success: false }, {
          status: 400,
          headers: corsHeaders
        });
      }
      fileName = file.name || 'upload';
    }

    // Forward to TG_Channel
    const fwdFormData = new FormData();
    fwdFormData.append('file', file, fileName);
    const reqUrl = new URL(request.url);
    const tgUrl = reqUrl.origin + '/api/enableauthapi/tgchannel';

    const fwdRes = await fetch(tgUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: fwdFormData
    });

    const result = await fwdRes.json();

    return Response.json({
      url: result.url,
      success: true,
      name: result.name || ''
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