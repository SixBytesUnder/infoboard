# infoboard

> Infoboard showing photos from local folder as the background, time, weather and Transport for London status updates.  
> Intended for Raspberry Pi, but should work on any machine with NodeJS installed.

## Examples

![Desktop landscape](https://i.imgur.com/iuyV0x9.jpg?raw=true "Desktop landscape - all options colapsed")
![Galaxy S5 portrait](https://i.imgur.com/P5w1h0r.jpg?raw=true "Galaxy S5 portrait - all options colapsed")
![iPad Pro landscape](https://i.imgur.com/Lfm25Uc.jpg?raw=true "iPad Pro landscape - all options expanded")

More example screenshots in [/static/examples/](/static/examples/) or https://imgur.com/a/Odm4haP

## Features
* Almost everything is configurable in `.env` file;
* Show current time and date;
* Background images, changing every 60 seconds. Source of images can be: a local folder, NASA Picture of the day, random image from Unsplash or curated images from Pexels;
* Up to 10 upcoming events from Google Calendar;
* Current weather and weekly forecast from DarkSky;
* Transport for London status updates for tube, overground, dlr, tfl rail and tram;
* Transport for London bus timetable for bus stops you choose;
* Everyting, except for time can be folded or expanded by clicking on their icons;
* Two buttons at the bottom right corner allow to skip to the next image or skip the entire folder to the next one (for local source only);
* Runs as a responsive website therefore can be accessed on any device.

## Raspberry Pi production deployment steps
``` bash
# go to project folder
$ cd /var/www/html/

# clone this repo to current folder
$ git clone https://github.com/SixBytesUnder/infoboard.git .

# IMPORTANT! rename .env.example to .env
$ cp .env.example .env

# then edit it to provide all necessary variables and API keys
$ vim.tiny .env

# install dependencies
$ npm install

# build production bundle
$ npm run build

# I use fantastic persistent app manager pm2, but you can use any other you wish
# install pm2
$ sudo npm i -g pm2

# start pm2, see below for detailed instructions
$ pm2 start npm --name "infoboard" -- start

# configure nginx
$ sudo vim.tiny /etc/nginx/sites-enabled/default

server {
    listen 80 default_server;
    listen [::]:80 default_server;

    access_log /var/log/nginx/infoboard-access.log;
    error_log /var/log/nginx/infoboard-error.log;

    gzip            on;
    gzip_types      text/plain application/xml text/css application/javascript;
    gzip_min_length 1000;

    # change 192.168.1.99 to your RPi's local IP address
    server_name _ 192.168.1.99 infoboard;

    location / {
        proxy_redirect                      off;
        proxy_set_header Host               $host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto  $scheme;
        proxy_read_timeout                  1m;
        proxy_connect_timeout               1m;
        proxy_pass                          http://127.0.0.1:3000;
    }
}

# restart nginx
$ sudo /etc/init.d/nginx restart
```

If your Raspberry is accessible on local network, open your browser and navigate to your RPi's IP address. In this example `http://192.168.1.99/`

## Updating to latest version
``` bash
# go to project folder
$ cd /var/www/html/

# pull latest files from git
$ git pull

# check .env.example and compare to existing .env to see if any new settings are needed
$ vim.tiny .env.example
$ vim.tiny .env

# install dependencies
$ npm install

# build production bundle
$ npm run build
# Note, if you get build errors,
# delete `node_modules` directory and run `npm install` again
# if above doesn't help delete the whole app and run
# pm2 stop infoboard
# pm2 delete infoboard
# and follow `production deployment steps` above

# restart persistent app manager
# note: no neet to run `npm run build`, pm2 will do it for you
$ pm2 restart infoboard --update-env

# the app takes a minute to compile, to see the progress
# run below command and watch "Global Logs" window
# app will be ready when you see something similar to "Listening on http://localhost:3000"
$ pm2 monit
```

## Development setup

``` bash
# clone this repo
$ git clone https://github.com/SixBytesUnder/infoboard.git .

# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev
```

For full documentation on NuxtJS go to [Nuxt.js docs](https://github.com/nuxt/nuxt.js).

## Other helpful commands

To make sure `pm2` restarts the service after your server restarts, run `pm2 startup` command. It should tell you exactly what you need to do next.

``` bash
# find out what to do to make sure pm2 runs after restart
$ pm2 startup
# above will ask you to run a commands similar to this
$ sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
$ pm2 save

# show apps managed by pm2
pm2 status

# check if your pm2 process is running
$ pm2 list

# monitor your apps running on pm2
$ pm2 monit
```

nginx setup on RPi: https://nuxtjs.org/faq/nginx-proxy/  
Production Process Manager for Node.js applications with a built-in Load Balancer: https://pm2.io/doc/en/runtime/overview/  

## License

[MIT](https://github.com/SixBytesUnder/infoboard/blob/master/LICENSE)
