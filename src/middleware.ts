export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trades/:path*",
    "/accounts/:path*",
  ],
};

export default function middleware() {
  // Proteção via client-side (InternalLayout). Para SSR/API, podemos adicionar verificação de cookie depois.
  return;
}
