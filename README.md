# AMI Asisten AI (arumanis)

Frontend chat AI arumanis, project terpisah dari `www/bun`. Backend tetap `www/apiamis` (Laravel, direct — tanpa BFF).

## Jalankan

```bash
cp .env.example .env   # VITE_APIAMIS_BASE_URL=http://apiamis.test/api
bun install
bun run dev            # :5174
```

Login pakai akun arumanis → token Sanctum disimpan di `localStorage['ami-token']`.

## Fitur (reuse dari bun)

- `src/features/chat/components/chat-page.tsx` — chat + stream, sessions, vote, autocomplete paket, tabel sortable, chart, export PDF, tombol kamera
- `src/features/chat/components/ChatFotoUpload.tsx` — wizard foto 3 langkah (paket → kelengkapan output/penerima → foto), tambah output/penerima inline
- `src/features/chat/api/stream-chat.ts` — SSE `POST /chat/stream`
- Endpoint lain: `POST /chat`, `GET /chat/sessions*`, `POST /chat/messages/:id/vote`, `GET /chat/reports/download`, `/foto`, `/pekerjaan`, output, penerima, `/koordinat/validate`

## Beda dari bun

- Tanpa BFF/server Hono: `api-client.ts` fetch langsung ke `VITE_APIAMIS_BASE_URL` + header `Authorization: Bearer <ami-token>`
- Tanpa `@tanstack/react-router`: tautan internal jadi `<a target=_blank>`
- Auth: form login minimal (`POST /auth/login`), bukan session cookie + handoff
