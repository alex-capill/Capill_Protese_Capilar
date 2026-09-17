import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 é um módulo nativo: precisa ficar fora do bundle do servidor.
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Server Actions recebem o payload de um arrasto com várias etiquetas.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
