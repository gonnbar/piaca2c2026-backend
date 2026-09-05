# PIACA - Backend (piaca2c2026-backend)

API REST para seguimiento integral de pacientes de nutrición deportiva/culturismo.

## Stack
- Node.js + Express 5 + TypeScript
- MongoDB + Mongoose 8
- JWT (`jsonwebtoken`) + bcrypt
- Multer (fotos), express-validator, CORS, Helmet, Morgan

## Arquitectura AGENTS.md
```
route → middleware → controller → service → model → MongoDB
```
Estructura `src/`:
```
config/       env.ts, db.ts
controllers/  auth, patients
models/       User, Patient, Measurement, Food, Meal, Workout, PhysicalActivity, Photo, Consultation
routes/       auth, patients, foods, measurements, meals, workouts, physical-activity, photos, consultations
middlewares/  auth, authorize, validate, errorHandler, upload
services/     authService, patientService
validators/   auth, patient
utils/        calculations.ts (IMC/macros), editWindow.ts (10min), apiResponse.ts
seeds/        foods.ts, admin.ts
```

## Endpoints (AGENTS.md)
```
/api/auth
/api/patients            (nutritionist CRUD, soft delete isActive)
/api/patients/:id
/api/measurements        (con cálculo IMC, ventana 10min para patient)
/api/meals                (cálculo automático macros por Food.grams)
/api/foods                (búsqueda por category/search)
/api/workouts
/api/physical-activity
/api/photos               (Multer /uploads, view frente|perfil|espalda)
/api/consultations        (solo nutritionist crea)
/api/health               (check)
```

## Roles
- `nutritionist`: admin, crea pacientes (`POST /api/patients`), consultas, corrige tras ventana
- `patient`: registra comidas/actividad/entrenos/peso/fotos, modifica solo dentro de 10 min (`createdAt + 10min > now`)

## Variables de entorno
Copiar `.env.example` → `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/piaca
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## Scripts
```bash
npm install
npm run dev      # tsx watch src/server.ts → http://localhost:3000
npm run build    # tsc → dist/
npm start        # node dist/server.js
npm run seed     # tsx src/seeds/foods.ts (19 alimentos MVP)
# seeds/admin.ts crea admin@piaca.com / admin123
```

## Seguridad & Buenas prácticas
- Passwords hasheados bcrypt (nunca plain, `User.ts:28`), no se exponen en JSON.
- Validación con express-validator antes de DB.
- Respuestas error consistentes `{success:false,message}` (`middlewares/errorHandler.ts:12`).
- `utils/calculations.ts` y `utils/editWindow.ts` separados de controladores/UI (AGENTS.md).

## Base de alimentos MVP
carnes, huevos, leche, quesos, yogur, verduras, cereales, frutas, semillas, miel, azúcar, aceites, grasas (`seeds/foods.ts:3`).

## Gráficos
Backend expone históricos con `date` para que frontend (Recharts) consuma evolución peso/IMC/macros/cargas.
