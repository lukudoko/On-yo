// middleware.js
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/stat/:path*',
    '/jlpt/:path*',
    '/groups/:path*',
  ],
};