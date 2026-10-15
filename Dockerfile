# ---------- Stage 1: build CMS (React + Vite) ----------
FROM node:20-alpine AS cms-build
WORKDIR /cms
COPY cms/package.json cms/package-lock.json ./
RUN npm ci
COPY cms/ ./

# Nilai publik (anon key memang aman di browser, dilindungi RLS)
ARG VITE_SUPABASE_URL=https://tfnsulqqfzkmefdhgoyi.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbnN1bHFxZnprbWVmZGhnb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTUwNDEsImV4cCI6MjEwNDQ5MTA0MX0.ZkD3CtUJC51SoXSkMEPFh0WW8NHzV-MACezOH4Zk0Nw
ARG VITE_SUPABASE_BUCKET=cms-media
ARG VITE_SITE_URL=https://ramahfakhirin.com
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_BUCKET=$VITE_SUPABASE_BUCKET \
    VITE_SITE_URL=$VITE_SITE_URL
RUN test -n "$VITE_SUPABASE_ANON_KEY" || (echo "VITE_SUPABASE_ANON_KEY belum diisi" && exit 1)
RUN npm run build

# ---------- Stage 2: serve dengan Nginx ----------
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
COPY --from=cms-build /cms/dist /usr/share/nginx/html/admin
# Buang file yang tidak boleh ikut ke server
RUN cd /usr/share/nginx/html && rm -rf cms database api deploy Dockerfile .dockerignore \
    *.php *.md package.json .env* .git* .htaccess
EXPOSE 80
