<template>
  <div class="color-wheel">
    <div
      ref="wheel"
      class="wheel"
      :style="{ width: size + 'px', height: size + 'px' }"
      @mousedown.prevent="startDrag"
      @touchstart.prevent="startDrag"
    >
      <div class="handle" :style="handlePosition"></div>
    </div>
    <div class="cw-lightness">
      <span class="cw-label">lightness</span>
      <input
        type="range"
        min="0"
        max="100"
        :value="Math.round(hsv.v * 100)"
        @input="onLightness"
      />
    </div>
    <input
      class="cw-hex"
      :value="hex"
      maxlength="7"
      spellcheck="false"
      @change="onHexInput"
    />
  </div>
</template>

<script>
import {
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  normalizeColor,
} from "~/utils/color.js";

export default {
  name: "ColorWheel",
  props: {
    // v-model: a hex string like "#a1b2c3"
    value: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 120,
    },
  },
  data() {
    return {
      hsv: { h: 0, s: 0, v: 1 },
      dragging: false,
    };
  },
  computed: {
    hex() {
      return rgbToHex(hsvToRgb(this.hsv));
    },
    // Wheel geometry: hue = angle (0deg at top, clockwise),
    // saturation = distance from center.
    handlePosition() {
      const margin = 8;
      const r = (this.size / 2 - margin) * this.hsv.s;
      const rad = (this.hsv.h * Math.PI) / 180;
      const x = Math.sin(rad) * r;
      const y = -Math.cos(rad) * r;
      return {
        left: `calc(50% + ${x.toFixed(1)}px)`,
        top: `calc(50% + ${y.toFixed(1)}px)`,
      };
    },
  },
  created() {
    const normalized = normalizeColor(this.value);
    if (normalized) {
      this.hsv = rgbToHsv(hexToRgb(normalized));
    }
  },
  watch: {
    // Sync when the parent changes the value (e.g. a recent name is picked).
    value(newVal) {
      const normalized = normalizeColor(newVal);
      if (normalized && normalized !== this.hex) {
        this.hsv = rgbToHsv(hexToRgb(normalized));
      }
    },
  },
  methods: {
    startDrag(e) {
      this.dragging = true;
      this.applyPointer(e);
      const move = (ev) => {
        if (this.dragging) this.applyPointer(ev);
      };
      const up = () => {
        this.dragging = false;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      window.addEventListener("touchmove", move);
      window.addEventListener("touchend", up);
    },
    applyPointer(e) {
      const rect = this.$refs.wheel.getBoundingClientRect();
      const point =
        e.touches && e.touches.length > 0 ? e.touches[0] : e;
      const dx = point.clientX - (rect.left + rect.width / 2);
      const dy = point.clientY - (rect.top + rect.height / 2);
      const margin = 8;
      const maxR = this.size / 2 - margin;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const s = Math.min(1, dist / maxR);
      // atan2 measured clockwise from the top edge.
      let h = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (h < 0) h += 360;
      this.hsv = { h, s, v: this.hsv.v };
      this.emitColor();
    },
    onLightness(e) {
      this.hsv.v = parseInt(e.target.value, 10) / 100;
      this.emitColor();
    },
    onHexInput(e) {
      const normalized = normalizeColor(e.target.value);
      if (normalized) {
        this.hsv = rgbToHsv(hexToRgb(normalized));
        this.emitColor();
      }
    },
    emitColor() {
      this.$emit("input", this.hex);
    },
  },
};
</script>

<style>
.color-wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.wheel {
  position: relative;
  border-radius: 50%;
  /* Saturation falls off towards the center (white core), hue around the rim. */
  background:
    radial-gradient(circle, #ffffff 0%, rgba(255, 255, 255, 0) 72%),
    conic-gradient(
      #ff0000,
      #ffff00,
      #00ff00,
      #00ffff,
      #0000ff,
      #ff00ff,
      #ff0000
    );
  cursor: crosshair;
  touch-action: none;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.handle {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cw-lightness {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.cw-lightness input[type="range"] {
  flex: 1;
  accent-color: #a1a1aa;
}

.cw-label {
  font-size: 0.7rem;
  color: #a1a1aa;
}

.cw-hex {
  width: 5.5rem;
  background: #262626;
  color: #e5e5e5;
  border: 1px solid #404040;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  text-align: center;
  padding: 0.25rem;
}
</style>
