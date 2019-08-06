# Gif To Face application
This is a phonegap project for opensource software that open animated GIF files on android device and then convert it to
big atlas of frames.

## Structure

#### PhoneGap Main folders

This folders are: hooks, plugins, www and config.xml
You can simply archive it (ignoring platforms folder) and upload it to phonegap. It will generate APK file for you (so far there is no support of iOS platform).
You can install that .apk file into your android device.

#### Test app

1. Start phonegap desktop (run through standart phonegaps startup instructions)
2. Now to see any tweaks on your browser you need to go the the folder: /platforms/browser/www/
3. If you need to tweak final appearance, functionality of the app (Android) you need to go to the folder: /www/
If your primary test device is PC, I suggest you to trart from 1-2 stages and if you glad with the result, just copy tweaked files into /www/ folder.
Please note that not all plugins work correct on both PC browser and android devices, you need to be careful with replacement of any file in the folder /www/

It is open source, you can tweak it as you want. Also if use gifuct-js library for GIF decoding.

Author deosn't response for any damage that may be caused with unaproppriate usage of the code or generated apps. Anyway there was no found significant bugs thatmay cause that damage. Please, do any tweaks with understanding of risk of that modifications



