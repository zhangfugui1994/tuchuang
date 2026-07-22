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
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file uploaded', success: false }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // 使用 58img 上传通道（无需任何配置）
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const payload = {
      "Pic-Size": "0*0",
      "Pic-Encoding": "base64",
      "Pic-Path": "/nowater/webim/big/",
      "Pic-Data": base64
    };

    const res = await fetch('https://upload.58cdn.com.cn/json/nowater/webim/big/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.text();
    const random_number = Math.floor(Math.random() * 8) + 1;
    const finalUrl = 'https://pic' + random_number + '.58cdn.com.cn/nowater/webim/big/' + result;

    return Response.json({
      url: finalUrl,
      success: true,
      name: result
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
