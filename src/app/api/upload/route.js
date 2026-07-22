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

    // 转发到 TG_Channel 路由（用户已验证可用）
    const fwdFormData = new FormData();
    fwdFormData.append('file', file, file.name);
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
