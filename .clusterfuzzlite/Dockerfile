FROM gcr.io/oss-fuzz-base/base-builder-javascript
COPY . $SRC/heap
WORKDIR $SRC/heap
COPY .clusterfuzzlite/build.sh $SRC/build.sh
