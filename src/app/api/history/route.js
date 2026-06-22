import { getRequestContext } from '@cloudflare/next-on-pages';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

export const runtime = 'edge';

export async function GET(request) {
  const { env, cf, ctx } = getRequestContext();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  if (!env.IMG) {
    return Response.json({
      code: 500,
      success: false,
      message: 'D1 database is not configured',
      data: [],
      total: 0,
    }, { status: 500, headers: corsHeaders });
  }

  try {
    const offset = page * pageSize;
    const ps = env.IMG.prepare(
      `SELECT url, referer, ip, rating, total, time FROM imginfo ORDER BY id DESC LIMIT ? OFFSET ?`
    ).bind(pageSize, offset);
    const { results } = await ps.all();
    const total = await env.IMG.prepare(`SELECT COUNT(*) as total FROM imginfo`).first();

    return Response.json({
      code: 200,
      success: true,
      message: 'success',
      data: results,
      total: total.total,
      page,
      pageSize,
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({
      code: 500,
      success: false,
      message: error.message,
      data: [],
      total: 0,
    }, { status: 500, headers: corsHeaders });
  }
}
