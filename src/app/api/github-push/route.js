export const runtime = 'edge';
import { getRequestContext } from '@cloudflare/next-on-pages';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export async function POST(request) {
  const { env } = getRequestContext();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const token = env.GITHUB_TOKEN;
    if (!token) {
      return Response.json(
        { error: '服务端未配置 GITHUB_TOKEN，请联系管理员' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { articles } = await request.json();
    if (!articles || !Array.isArray(articles)) {
      return Response.json(
        { error: '缺少文章数据' },
        { status: 400, headers: corsHeaders }
      );
    }

    const repo = env.GITHUB_REPO || 'zhangfugui1994/zfg_boke';
    const owner = repo.split('/')[0];
    const name = repo.split('/')[1];

    // 生成 script.js 内容
    const scriptContent = `// 商品数据（由管理面板自动生成）
const productsData = ${JSON.stringify(articles, null, 2)};
let posts = JSON.parse(JSON.stringify(productsData));
`;

    // 先获取文件 SHA（用于更新）
    let sha = null;
    try {
      const getFileRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/contents/script.js`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        sha = fileData.sha;
      }
    } catch (e) {
      // 文件不存在或获取 SHA 失败，sha 为 null，会创建新文件
    }

    // 创建/更新文件
    const updateRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contents/script.js`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'update: 从管理面板推送',
          content: btoa(unescape(encodeURIComponent(scriptContent))),
          ...(sha ? { sha } : {})
        })
      }
    );

    if (!updateRes.ok) {
      const errorData = await updateRes.text();
      return Response.json(
        { error: `GitHub API 错误: ${errorData}` },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json(
      { success: true, message: '推送成功！Cloudflare Pages 将在 1-3 分钟内自动部署完成。' },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
