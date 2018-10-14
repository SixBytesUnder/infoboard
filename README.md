# infoboard

> Infoboard showing photos as a background, time, weather and Transport for London status updates

## Development setup

``` bash
# clone this repo

# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# test production build
$ npm run build
$ npm start
```

For detailed explanation on how things work, checkout the [Nuxt.js docs](https://github.com/nuxt/nuxt.js).

## Raspberry Pi deployment steps
``` bash
# go to project folder
$ cd /var/www/html/

# clone this repo
$ git ...

# IMPORTANT! rename .env.example to .env
$ cp .env.example .env
# then edit it to provide all necessary variables
$ vim.tiny .env

# install dependencies
$ npm install

# build production bundle
$ npm run build

# install persistent app manager
$ sudo npm i -g pm2

# start persistent app manager
$ pm2 start infoboard
# or even better, name your app on pm2 list
$ pm2 start npm --name "infoboard" -- start

# setup nginx
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

If your Raspberry is accessible on local network, open your browser and navigate to your RPi's IP address. In this example `192.168.1.99`

## Updating to latest version
``` bash
# go to project folder
$ cd /var/www/html/

# pull latest files from git
$ git pull

# check .env.example and compare to existing .env to see if new settings are needed
$ vim.tiny .env.example
$ vim.tiny .env

# install dependencies
$ npm install

# build production bundle
$ npm run build

# restart persistent app manager
$ pm2 restart infoboard

# sometimes nginx needs to be restarted as well
$ sudo /etc/init.d/nginx restart
```

### Other helpful commands

``` bash
# show apps managed by pm2
pm2 status

# check if your pm2 process is running
pm2 list
```

nginx setup on RPi: https://nuxtjs.org/faq/nginx-proxy/  
