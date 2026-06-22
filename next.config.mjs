/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/file/:name*',
                destination: '/api/file/:name*',
            },
            {
                source: '/cfile/:name*',
                destination: '/api/cfile/:name*',
            },
            {
                source: '/rfile/:name*',
                destination: '/api/rfile/:name*',
            },
        ]
    },
};

export default nextConfig;
