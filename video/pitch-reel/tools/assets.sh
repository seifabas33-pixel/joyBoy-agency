#!/bin/sh
# Builds public/ for the pitch reel. public/ is generated, never commit it:
# the footage already lives in ../../media and everything else is made here.
#   - the site's clips and photos (copied)
#   - soft, blurred copies of the clips for full-frame backgrounds (ffmpeg)
#   - film-grain tiles (ImageMagick)
#   - the fonts (OFL, kept in fonts/)
#   - the music bed (tools/music.py, synthesised, nothing licensed)
set -e
cd "$(dirname "$0")/.."
mkdir -p public/img public/bg public/grain public/fonts
cp ../../media/*.mp4 public/
cp ../../media/img/gallery-*.jpg ../../media/img/poster-*.jpg ../../media/img/award-*.jpg \
  ../../media/img/rank-*.jpg ../../media/img/logo.jpg public/img/
# hotel photos cut out of the platform cards (no deal prices in the reel)
convert public/img/rank-solymar-reef.jpg -crop 466x246+12+10 +repage public/img/crop-solymar.jpg
convert public/img/rank-jaz-grand.jpg -crop 512x112+14+8 +repage public/img/crop-jaz.jpg
convert public/img/rank-hilton-nubian.jpg -crop 776x428+22+40 +repage public/img/crop-hilton.jpg
convert public/img/award-tripadvisor-casa-blue.jpg -crop 880x480+0+0 +repage public/img/crop-casa-blue.jpg
cp fonts/*.woff2 public/fonts/

for f in public/*.mp4; do
  b=$(basename "$f")
  [ -f "public/bg/$b" ] && continue
  ffmpeg -v error -y -i "$f" -an -vf "scale=240:-2,gblur=sigma=9,eq=saturation=1.25" \
    -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -g 30 "public/bg/$b"
done

i=0
while [ $i -lt 8 ]; do
  [ -f "public/grain/g$i.png" ] || convert -size 320x320 xc:gray50 -seed $((i + 11)) \
    -attenuate 0.6 +noise Gaussian -colorspace Gray "public/grain/g$i.png"
  i=$((i + 1))
done

python3 tools/music.py public/music.wav
