#!/usr/bin/env bash
set -euo pipefail

source_dir="${CANCER_MOTIF_SOURCE_DIR:-/Users/promelink/Documents/Codex/2026-08-07-medical-agent-maker/review}"
target_dir="assets/cancer-motifs-v3"

mkdir -p "$target_dir"

copy_alpha() {
  cp "$source_dir/$1" "$target_dir/$2"
}

# Only remove near-white pixels connected to the outer canvas edge. This keeps
# white highlights inside the approved watercolor artwork intact.
remove_connected_white() {
  magick "$source_dir/$1" \
    -bordercolor white -border 1 -alpha set -channel RGBA -fuzz 6% \
    -fill none -draw "alpha 0,0 floodfill" -shave 1x1 \
    "$target_dir/$2"
}

remove_connected_white headneck-xray-perspective-bounded-godray-v4-locked.png headneck-xray-diagnostic.png
remove_connected_white headneck-motif-02-closed-lip-diagnostic.png headneck-closed-lip-diagnostic.png
remove_connected_white headneck-motif-03-cradled-head-neck.png headneck-cradled-care.png
copy_alpha lung-motif-01-tree-of-breath.png lung-tree-of-breath.png
copy_alpha lung-motif-02-imaging-orbit.png lung-imaging-orbit.png
copy_alpha lung-motif-03-alveoli-immune-constellation.png lung-alveoli-immune-constellation.png
remove_connected_white gyn-motif-01-reproductive-garden.png gyn-reproductive-garden.png
copy_alpha gyn-motif-02-therapeutic-containment.png gyn-therapeutic-containment.png
copy_alpha gyn-motif-03-breaking-treatment-barrier.png gyn-breaking-treatment-barrier.png
copy_alpha urinary-motif-01-complete-system.png urinary-complete-system.png
copy_alpha urinary-motif-02-precision-orbit.png urinary-precision-orbit.png
copy_alpha urinary-motif-03-therapeutic-sanctuary.png urinary-therapeutic-sanctuary.png
copy_alpha colorectal-motif-01-treatment-atlas-v5.png colorectal-treatment-atlas.png
copy_alpha colorectal-motif-02-screening-window.png colorectal-screening-window.png
copy_alpha colorectal-motif-03-restored-ecology-v3.png colorectal-restored-ecology.png
copy_alpha breast-motif-01-tissue-ribbon.png breast-tissue-ribbon.png
copy_alpha breast-motif-02-self-embrace.png breast-self-embrace.png
copy_alpha breast-motif-03-precision-focus-ribbon.png breast-precision-focus-ribbon.png
