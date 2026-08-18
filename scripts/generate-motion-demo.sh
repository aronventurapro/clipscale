#!/usr/bin/env bash
set -euo pipefail

FONT_REGULAR="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUTPUT="${1:-public/clipscale-demo.mp4}"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0x090a10:s=1280x720:d=5.5:r=30" \
  -f lavfi -i "color=c=0x090a10:s=1280x720:d=5.5:r=30" \
  -f lavfi -i "color=c=0x090a10:s=1280x720:d=5.5:r=30" \
  -f lavfi -i "color=c=0x090a10:s=1280x720:d=5.5:r=30" \
  -f lavfi -i "color=c=0x090a10:s=1280x720:d=5.5:r=30" \
  -f lavfi -i "color=c=0x090a10:s=1280x720:d=5.5:r=30" \
  -filter_complex "
  [0:v]drawbox=x='820+50*sin(t*1.2)':y='80+30*cos(t)':w=360:h=360:color=0x7658e4@0.13:t=fill,
       drawbox=x='90+15*sin(t)':y=118:w=12:h=70:color=0x8f73f2:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='CLIPSCALE':x='max(110,520-330*t)':y=105:fontsize=30:fontcolor=0xa991ff,
       drawtext=fontfile=${FONT_BOLD}:text='UNE VIDÉO.':x=110:y='220+8*sin(t*2)':fontsize=76:fontcolor=white,
       drawtext=fontfile=${FONT_BOLD}:text='PARTOUT. PLUS VITE.':x=110:y='310+8*sin(t*2)':fontsize=64:fontcolor=0x9b83ff,
       drawtext=fontfile=${FONT_REGULAR}:text='Le cockpit qui transforme un clip en campagne multicanale.':x=114:y=420:fontsize=24:fontcolor=0xb8bac5,
       drawbox=x='114+min(610,t*165)':y=486:w=12:h=12:color=0xa58cff:t=fill,
       drawbox=x=114:y=490:w='min(610,t*165)':h=4:color=0x876aeb:t=fill[s0];

  [1:v]drawbox=x=70:y=64:w=1140:h=592:color=0x11131b:t=fill,
       drawbox=x=71:y=65:w=1138:h=590:color=0xffffff@0.04:t=3,
       drawtext=fontfile=${FONT_BOLD}:text='01  IMPORTEZ VOTRE CLIP':x=110:y=100:fontsize=27:fontcolor=0xa991ff,
       drawbox=x='max(155,980-230*t)':y=250:w=330:h=190:color=0x1a1c27:t=fill,
       drawbox=x='max(155,980-230*t)':y=250:w=330:h=190:color=0x8e73ee@0.55:t=3,
       drawtext=fontfile=${FONT_BOLD}:text='▶  clip-final.mp4':x='max(185,1010-230*t)':y=300:fontsize=25:fontcolor=white,
       drawtext=fontfile=${FONT_REGULAR}:text='9\\:16  •  24 sec  •  1080p':x='max(185,1010-230*t)':y=350:fontsize=18:fontcolor=0x9094a3,
       drawbox=x=180:y=500:w=780:h=10:color=0x242633:t=fill,
       drawbox=x=180:y=500:w='min(780,t*210)':h=10:color=0x8468ed:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='Un seul fichier. Un espace clair.':x=180:y=548:fontsize=31:fontcolor=white[s1];

  [2:v]drawbox=x='80+18*sin(t*1.3)':y=70:w=1120:h=580:color=0x10121a:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='02  ANALYSE VIRALE':x=110:y=105:fontsize=27:fontcolor=0xa991ff,
       drawbox=x=125:y=205:w=300:h=300:color=0x171925:t=fill,
       drawbox=x=125:y=205:w=300:h=300:color=0x7658e4@0.6:t=3,
       drawtext=fontfile=${FONT_BOLD}:text='87':x=205:y='260-6*sin(t*2)':fontsize=122:fontcolor=white,
       drawtext=fontfile=${FONT_BOLD}:text='/100':x=320:y=365:fontsize=26:fontcolor=0x8f82bc,
       drawtext=fontfile=${FONT_BOLD}:text='FORT POTENTIEL':x=178:y=440:fontsize=20:fontcolor=0x66d5a7,
       drawtext=fontfile=${FONT_BOLD}:text='Accroche':x=505:y=228:fontsize=20:fontcolor=0xcfd0d8,
       drawbox=x=505:y=266:w=570:h=12:color=0x292b36:t=fill,drawbox=x=505:y=266:w='min(525,t*155)':h=12:color=0x8064ec:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='Rétention':x=505:y=322:fontsize=20:fontcolor=0xcfd0d8,
       drawbox=x=505:y=360:w=570:h=12:color=0x292b36:t=fill,drawbox=x=505:y=360:w='min(495,t*145)':h=12:color=0x8e73f0:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='Format':x=505:y=416:fontsize=20:fontcolor=0xcfd0d8,
       drawbox=x=505:y=454:w=570:h=12:color=0x292b36:t=fill,drawbox=x=505:y=454:w='min(548,t*160)':h=12:color=0x9c86f7:t=fill,
       drawtext=fontfile=${FONT_REGULAR}:text='Des recommandations concrètes avant de publier.':x=505:y=525:fontsize=24:fontcolor=0xa5a8b3[s2];

  [3:v]drawtext=fontfile=${FONT_BOLD}:text='03  ADAPTEZ À CHAQUE PLATEFORME':x=92:y=86:fontsize=27:fontcolor=0xa991ff,
       drawbox=x=90:y=154:w=1100:h=460:color=0x10121a:t=fill,
       drawbox=x='120+12*sin(t*2)':y=205:w=225:h=320:color=0x1a1725:t=fill,
       drawbox=x='385+12*sin(t*2+1)':y=205:w=225:h=320:color=0x141927:t=fill,
       drawbox=x='650+12*sin(t*2+2)':y=205:w=225:h=320:color=0x21151b:t=fill,
       drawbox=x='915+12*sin(t*2+3)':y=205:w=225:h=320:color=0x171925:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='Instagram':x=162:y=245:fontsize=22:fontcolor=white,
       drawtext=fontfile=${FONT_BOLD}:text='TikTok':x=455:y=245:fontsize=22:fontcolor=white,
       drawtext=fontfile=${FONT_BOLD}:text='YouTube':x=716:y=245:fontsize=22:fontcolor=white,
       drawtext=fontfile=${FONT_BOLD}:text='LinkedIn':x=980:y=245:fontsize=22:fontcolor=white,
       drawtext=fontfile=${FONT_REGULAR}:text='Hook court':x=173:y=340:fontsize=19:fontcolor=0xa9aab5,
       drawtext=fontfile=${FONT_REGULAR}:text='Ton direct':x=447:y=340:fontsize=19:fontcolor=0xa9aab5,
       drawtext=fontfile=${FONT_REGULAR}:text='Titre fort':x=714:y=340:fontsize=19:fontcolor=0xa9aab5,
       drawtext=fontfile=${FONT_REGULAR}:text='Angle expert':x=962:y=340:fontsize=19:fontcolor=0xa9aab5,
       drawtext=fontfile=${FONT_BOLD}:text='✓ PRÊT':x=180:y='440-8*sin(t*2)':fontsize=23:fontcolor=0x6ed8ac,
       drawtext=fontfile=${FONT_BOLD}:text='✓ PRÊT':x=445:y='440-8*sin(t*2+1)':fontsize=23:fontcolor=0x6ed8ac,
       drawtext=fontfile=${FONT_BOLD}:text='✓ PRÊT':x=710:y='440-8*sin(t*2+2)':fontsize=23:fontcolor=0x6ed8ac,
       drawtext=fontfile=${FONT_BOLD}:text='✓ PRÊT':x=975:y='440-8*sin(t*2+3)':fontsize=23:fontcolor=0x6ed8ac[s3];

  [4:v]drawtext=fontfile=${FONT_BOLD}:text='04  PUBLIEZ ET MESUREZ':x=94:y=86:fontsize=27:fontcolor=0xa991ff,
       drawbox=x=92:y=156:w=1096:h=480:color=0x10121a:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='38 200':x=135:y=205:fontsize=56:fontcolor=white,
       drawtext=fontfile=${FONT_REGULAR}:text='VUES CUMULÉES':x=138:y=278:fontsize=18:fontcolor=0x858998,
       drawtext=fontfile=${FONT_BOLD}:text='+24,8 POUR CENT':x=138:y=325:fontsize=26:fontcolor=0x62d0a4,
       drawbox=x=470:y=230:w=70:h='min(300,70+t*35)':color=0x5f46c6:t=fill,
       drawbox=x=575:y='500-min(270,90+t*32)':w=70:h='min(270,90+t*32)':color=0x694ed2:t=fill,
       drawbox=x=680:y='500-min(250,120+t*28)':w=70:h='min(250,120+t*28)':color=0x7559df:t=fill,
       drawbox=x=785:y='500-min(320,130+t*38)':w=70:h='min(320,130+t*38)':color=0x8268ea:t=fill,
       drawbox=x=890:y='500-min(345,160+t*40)':w=70:h='min(345,160+t*40)':color=0x9278f3:t=fill,
       drawbox=x=995:y='500-min(365,180+t*42)':w=70:h='min(365,180+t*42)':color=0xa38dfa:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='Tout votre contenu. Toutes vos performances.':x=135:y=565:fontsize=31:fontcolor=white[s4];

  [5:v]drawbox=x='420+35*sin(t)':y='30+20*cos(t)':w=650:h=650:color=0x7658e4@0.16:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='CLIPSCALE':x=92:y=95:fontsize=28:fontcolor=0xab98ff,
       drawtext=fontfile=${FONT_BOLD}:text='UNE VIDÉO.':x=92:y=215:fontsize=82:fontcolor=white,
       drawtext=fontfile=${FONT_BOLD}:text='PARTOUT.':x=92:y=315:fontsize=82:fontcolor=0xa38cff,
       drawtext=fontfile=${FONT_BOLD}:text='PLUS VITE.':x=92:y=415:fontsize=82:fontcolor=white,
       drawbox=x=92:y=530:w=475:h=70:color=0x7658e4:t=fill,
       drawtext=fontfile=${FONT_BOLD}:text='ESSAYER CLIPSCALE  →':x=130:y=550:fontsize=24:fontcolor=white,
       drawtext=fontfile=${FONT_REGULAR}:text='Analyse • adaptation • publication • performance':x=92:y=632:fontsize=20:fontcolor=0x9da0ad[s5];

  [s0][s1]xfade=transition=slideleft:duration=0.6:offset=4.9[x1];
  [x1][s2]xfade=transition=fade:duration=0.6:offset=9.8[x2];
  [x2][s3]xfade=transition=slideup:duration=0.6:offset=14.7[x3];
  [x3][s4]xfade=transition=smoothleft:duration=0.6:offset=19.6[x4];
  [x4][s5]xfade=transition=fadeblack:duration=0.6:offset=24.5,
  format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset medium -crf 20 -movflags +faststart -t 30 "$OUTPUT"

echo "Motion demo generated at $OUTPUT"
