This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### Orden del proyecto
```
mi-proyecto/
├── public/                 # Archivos estáticos
├── src/                    # Todo el código fuente vive aquí
│   ├── app/                # OBLIGATORIO: Rutas y vistas de Next.js
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Vista Home (Frontend)
│   │   └── api/            # Tus endpoints HTTP
│   │       └── users/
│   │           └── route.ts # Punto de entrada que llama al Controller
│   ├── controllers/        # Controladores que manejan la petición/respuesta
│   │   └── user.controller.ts
│   ├── services/           # Lógica de negocio pura
│   │   └── user.service.ts
│   ├── repositories/       # Consultas directas a la Base de Datos
│   │   └── user.repository.ts
│   ├── models/             # Esquemas/Modelos de ORM (Prisma, Mongoose)
│   ├── dtos/               # Objetos de transferencia de datos / Validaciones (Zod)
│   ├── routes/             # (Opcional) Definición de rutas y middlewares por grupo de endpoints
│   ├── lib/                # Inicialización de clientes (DB, Auth, etc.)
│   ├── logger/             # Configuración de logs (Pino, Winston)
│   ├── types/              # Interfaces y tipos globales de TypeScript
│   ├── utils/              # Funciones helper puras
│   └── middleware.ts       # OBLIGATORIO: Middleware oficial en la raíz de src/
├── next.config.ts
├── package.json
└── tsconfig.json
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
67 (Not merge)
