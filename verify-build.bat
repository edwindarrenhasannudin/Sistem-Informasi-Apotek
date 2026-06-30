@echo off
cd /d "D:\Documents\Sistem Informasi Apotek\Sistem Informasi Apotek"
pnpm --version
pnpm install --no-frozen-lockfile --force
pnpm build
