blomming-image-server
=====================

This is a first experimental release of the ultra-fast
image server that automatically resizes images taken
from S3.

## Run locally

### Dependencies

(Tested on Ubuntu 13.04). The image server relies on graphicsmagick. You should install the latest version available. You can find it on sourceforge at: http://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/

Then you need to install also the jpeg and png extensions, otherwise it won't convert the images. You can find them here: http://www.imagemagick.org/download/delegates/

Every packet should be installed with the usual procedure:
```
.\configure
make
make test
sudo make -n install
sudo make install
```

After that, try to type "gm version" at the console. If you get:
```
gm: error while loading shared libraries: libjpeg.so.9: cannot open shared object file: No such file or directory
```

Try with:
```
sudo ranlib /usr/local/lib/libjpeg.a
sudo ldconfig /usr/local/lib
```

### Configuration

This image server is configured by environment variables,
you should set them like these:
```
export AWS_KEY=YOUR_AWS_KEY_HERE
export AWS_SECRET=YOUR_AWS_SECRET_HERE
export S3_BUCKET=YOUR_BUCKET_HERE
```

### Startup

Execute the following commands in your terminal:
```
git clone https://github.com/njvitto/blomming-image-server
cd blomming-image-server
npm install
./image-server.js
```

## Run on Heroku

### Create the app

Execute the following commands in your terminal:
```
git clone https://github.com/njvitto/blomming-image-server
cd blomming-image-server
gem install heroku
heroku create <YOUR_APP_NAME>
git push heroku
```

### Configuration

This image server is configured by environment variables,
you should set them like these:
```
heroku config:set AWS_KEY=YOUR_AWS_KEY_HERE
heroku config:set AWS_SECRET=YOUR_AWS_SECRET_HERE
heroku config:set S3_BUCKET=YOUR_BUCKET_HERE
```

## Usage

Once started, resizing image is really easy, it's just needed to
call a specific URL.

### Contain

Creates an image whose sizes are at max the ones specified.

```
curl http://<YOUR_URL>/w<WIDTH>/h<HEIGHT>/for/<PATH_ON_S3_OF_THE_IMAGE>
curl http://<YOUR_URL>/w<WIDTH>/for/<PATH_ON_S3_OF_THE_IMAGE>
```

### Cover

Creates an image whose sizes are exactly the ones specified.
The reduced image is obtained "cutting out" the exceding
part of the image to fit the new aspect ratio.

```
curl http://<YOUR_URL>/cover/w<WIDTH>/h<HEIGHT>/for/<PATH_ON_S3_OF_THE_IMAGE>
```

### Crop

Creates an image whose sizes are exactly the ones specified.
The reduced image is obtained picking it from a rectangle of the
same sizes from the center of the image.

```
curl http://<YOUR_URL>/crop/w<WIDTH>/h<HEIGHT>/for/<PATH_ON_S3_OF_THE_IMAGE>
```

## Internals

This server operates in the following manner:

1. tries to get the resized image, if so it returns it to the user;
2. if there is no resized image, it resizes it using the `convert`
   utility from imagemagick;
3. it forwards the resized image to the user;
4. it loads the resized image to S3 for later usage.

