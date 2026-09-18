import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 é um módulo nativo: precisa ficar fora do bundle do servidor.
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Server Actions recebem o payload de um arrasto com várias etiquetas.
    serverActions: { bodySizeLimit: "2mb" },
  },
  webpack: (config, { dev }) => {
    // Nesta máquina o projeto vive dentro de uma pasta sincronizada (OneDrive),
    // que disputa o arquivo de cache do webpack com o dev server em sessões
    // longas ("EPERM: operation not permitted, rename ...pack.gz") e corrompe o
    // build a ponto de toda página parar de compilar
    // (`__webpack_modules__[moduleId] is not a function`), só resolvendo com
    // `rm -rf .next` + reiniciar. Sem cache em disco no dev, o rebuild fica um
    // pouco mais lento, mas para de corromper.
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
