# From the repository root, start the local database and Redis if they are not
# already running. The mobile OTP endpoint requires Redis.
docker compose up -d postgres redis

# Terminal 1: Backend
cd "D:\Projects 2026\roadguard\apps\backend"
pnpm dev

# Terminal 2: Customer mobile app
cd "D:\Projects 2026\roadguard\apps\customer-mobile"
pnpm start -- --clear --lan

# Terminal 3: Admin web
cd "D:\Projects 2026\roadguard\apps\admin-web"
pnpm dev

# Terminal 4: Mechanic mobile app
cd "D:\Projects 2026\roadguard\apps\mechanic-mobile"
pnpm exec expo start --clear --lan

For Expo Go on a **physical phone**, set `EXPO_PUBLIC_API_URL` in
`apps/customer-mobile/.env` to the computer's current Wi-Fi IPv4 address, for
example `http://192.168.1.25:4000/api/v1`. Get the address with:

```powershell
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi"
```

Keep the phone and computer on the same Wi-Fi network, allow inbound TCP port
4000 through Windows Firewall, and restart Expo with `--clear` after changing
`.env`. Android emulators can use `http://10.0.2.2:4000/api/v1`; physical phones
cannot use `10.0.2.2` or `localhost`. Scan the QR code in Expo Go. Press "a"
only when an Android device with USB debugging enabled or an Android emulator
is available to ADB.

# Push changes to GitHub
git fetch origin
git reset --soft origin/main
git add .
git commit -m "Add local roadguard project files"
git push -u origin main
