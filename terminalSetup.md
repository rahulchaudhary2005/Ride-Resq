in terminal 1 which is expo customer mobile 

from the customer-mobile directory run this command 
before runnig the command please connect ypur phone to the laptop by usb and make sure the both devices ar in the same network   

cd "D:\Projects 2026\roadguard\apps\mechanic-mobile"
pnpm exec expo start -c

it will ask to open android expo 
-> press a for opening the android expo app
->press r for reload or what ever is there to reoad 



// Terminal @2  Backend terminal 

cd apps/backend
-> pnpm dev

// Terminal 3  for the admin web

cd "D:\Projects 2026\roadguard\apps\admin-web"
pnpm dev


//terminal 4 mechanic 
cd "D:\Projects 2026\roadguard\apps\mechanic-mobile"
pnpm exec expo start

// Customer mobile app

cd "D:\Projects 2026\roadguard\apps\customer-mobile"
pnpm exec expo start -c --localhost