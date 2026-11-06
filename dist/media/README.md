# Segnale di prova locale

`probe.mp4` contiene esclusivamente un pattern sintetico animato FFmpeg `testsrc2`
e un tono sintetico a 440 Hz (`sine`). Generato per questo modulo; nessun filmato,
logo, musica o registrazione di terzi è stato scaricato o incorporato. È il contenuto
autorizzato per le prove di questo progetto. Nessuna licenza viene assegnata al resto
del repository. FFmpeg è uno strumento di generazione e non viene distribuito.

12 secondi, 640×360, 24 fps, H.264 Constrained Baseline / livello 3.0, yuv420p,
AAC-LC stereo 48 kHz, MP4 faststart. Si deve vedere il pattern muoversi e udire un
tono continuo: regolare il volume prima del test. Non prova 4K, DRM, HLS o sottotitoli.

Comando di generazione (FFmpeg 7.1.5; il file già incluso non viene rigenerato dalla build):

```sh
ffmpeg -hide_banner -loglevel error \
  -f lavfi -i 'testsrc2=size=640x360:rate=24' \
  -f lavfi -i 'sine=frequency=440:sample_rate=48000' \
  -t 12 -c:v libx264 -profile:v baseline -level:v 3.0 -pix_fmt yuv420p \
  -b:v 350k -threads 1 -c:a aac -b:a 64k -ac 2 -movflags +faststart \
  -map_metadata -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  assets/media/probe.mp4
```

L'identità del file è registrata in `probe.sha256`. La riproducibilità della build
usa il file versionato, non dipende dalla versione di FFmpeg installata.
