#!/bin/bash
D=/home/z/my-project/public/images/demo
SUFFIX="professional automotive photography, photorealistic, high quality, magazine quality, soft warm natural light, clean uncluttered composition"
gen() {
  local name="$1"; local prompt="$2"; local size="$3"
  if [ -f "$D/$name" ]; then echo "SKIP $name (exists)"; return 0; fi
  echo "START $name at $(date +%H:%M:%S)"
  for attempt in 1 2 3; do
    if z-ai image -p "$prompt" -o "$D/$name" -s "$size"; then echo "DONE $name"; return 0; fi
    echo "RETRY $name (attempt $attempt failed)"; sleep 3
  done
  echo "FAILED $name"
}
gen "hero.png" "vintage 1970s classic off-road SUV parked on open savanna plain at golden hour, cinematic wide shot, warm dusty tones, $SUFFIX" 1440x720
gen "fj40-2.png" "olive green 1978 Toyota Land Cruiser FJ40 classic off-road vehicle, rear three-quarter view showing tailgate and spare wheel, gravel ground, $SUFFIX" 1152x864
gen "280sl-1.png" "cream white 1971 Mercedes-Benz 280SL pagoda classic roadster with hardtop, three-quarter front view, elegant courtyard setting, $SUFFIX" 1152x864
gen "mustang-1.png" "deep burgundy red 1966 Ford Mustang fastback classic muscle car, three-quarter front view, sunset light on asphalt, $SUFFIX" 1152x864
gen "mustang-2.png" "deep burgundy red 1966 Ford Mustang fastback classic muscle car, side profile view, sunset light on asphalt, $SUFFIX" 1152x864
gen "defender-1.png" "khaki beige 1990 Land Rover Defender 110 classic station wagon, three-quarter front view, dirt road with acacia trees background, $SUFFIX" 1152x864
gen "etype-1.png" "silver blue metallic 1974 Jaguar E-Type classic sports coupe, three-quarter front view, elegant studio-like street setting, $SUFFIX" 1152x864
gen "etype-2.png" "silver blue metallic 1974 Jaguar E-Type classic sports coupe, rear three-quarter view, elegant street setting, $SUFFIX" 1152x864
gen "p911-1.png" "grand prix white 1988 Porsche 911 Carrera classic sports car with whale tail spoiler, three-quarter front view, clean minimal background, $SUFFIX" 1152x864
gen "c10-1.png" "turquoise 1970 Chevrolet C10 classic pickup truck, three-quarter front view, warm rustic yard setting, $SUFFIX" 1152x864
gen "bmw2002-1.png" "white 1969 BMW 2002 classic compact sedan, three-quarter front view, clean city street background, $SUFFIX" 1152x864
gen "about.png" "elegant vintage car showroom interior with several classic automobiles, warm ambient lighting, polished concrete floor, wide shot, $SUFFIX" 1344x768
echo "ALL_DONE"
