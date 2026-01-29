import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { saveAs } from 'file-saver';
import { useStore } from '../../store/useStore.ts';

interface AeKeyframe<T> {
  time: number;
  value: T;
  inInterp: string;
  outInterp: string;
  inEase?: Array<{ speed: number; influence: number }>;
  outEase?: Array<{ speed: number; influence: number }>;
}

interface AeProp<T> {
  static?: T;
  keys?: AeKeyframe<T>[];
}

interface AeSeparatedProp<T> {
  separated: boolean;
  components: Array<{ name: string; value: AeProp<T> }>;
}

type AeDimProp<T> = AeProp<T> | AeSeparatedProp<T>;

interface AeTransform {
  anchorPoint?: AeDimProp<number[]>;
  position?: AeDimProp<number[]>;
  scale?: AeDimProp<number[]>;
  opacity?: AeProp<number>;
  rotation?: AeProp<number>;
}

interface AeEffect {
  matchName: string;
  properties?: AeEffectProperty[];
}

interface AeEffectProperty {
  matchName: string;
  value?: {
    static?: number | number[];
  };
  properties?: AeEffectProperty[];
}

interface AeSource {
  name: string;
  type: string;
  path: string | null;
  width?: number;
  height?: number;
  duration?: number;
}

interface AeLayer {
  index: number;
  name: string;
  inPoint: number;
  outPoint: number;
  startTime: number;
  stretch: number;
  blendMode: string;
  source: AeSource | null;
  transform?: AeTransform;
  timeRemap?: AeProp<number>;
  effects?: AeEffect[];
}

interface AeComp {
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  layers: AeLayer[];
}

interface AeConfig {
  comp: AeComp;
}

type AssetType = 'image' | 'video';

interface PreparedLayer {
  layer: AeLayer;
  type: AssetType | 'skip';
  url: string | null;
  assetKey: string | null;
  isCharacter: boolean;
  colorKey: ColorKeySettings | null;
}

interface ColorKeySettings {
  color: [number, number, number];
  tolerance: number;
}

export interface LunpoCanvasHandle {
  exportWebm: () => Promise<void>;
}

const CHARACTER_KEYWORD = 'RefuteCutIn';
const FINAL_KEYWORD = '\u7834\u788efinal';
const FINAL_REVERSE_KEYWORD = '\u53cd';
const BACKGROUND_VIDEO_URL = 'lunpo/background.webm';

const isCharacterLayer = (name: string) =>
  name.includes(CHARACTER_KEYWORD) && !name.includes('StainedGlass');

const getBlendMode = (blendMode: string) => {
  switch (blendMode) {
    case 'ADD':
      return 'lighter';
    case 'SCREEN':
      return 'screen';
    case 'MULTIPLY':
      return 'multiply';
    case 'OVERLAY':
      return 'overlay';
    case 'DARKEN':
      return 'darken';
    case 'LIGHTEN':
      return 'lighten';
    default:
      return 'source-over';
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

const cubicBezierDerivative = (t: number, p0: number, p1: number, p2: number, p3: number) => {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
};

const solveBezier = (x: number, x1: number, x2: number) => {
  let t = x;
  for (let i = 0; i < 5; i++) {
    const current = cubicBezier(t, 0, x1, x2, 1) - x;
    const derivative = cubicBezierDerivative(t, 0, x1, x2, 1);
    if (Math.abs(derivative) < 1e-6) break;
    t = clamp(t - current / derivative, 0, 1);
  }
  let low = 0;
  let high = 1;
  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2;
    const value = cubicBezier(mid, 0, x1, x2, 1);
    if (Math.abs(value - x) < 1e-4) return mid;
    if (value < x) low = mid;
    else high = mid;
  }
  return clamp(t, 0, 1);
};

const getDeltaMagnitude = (from: unknown, to: unknown) => {
  if (Array.isArray(from) && Array.isArray(to)) {
    const dx = (to[0] ?? 0) - (from[0] ?? 0);
    const dy = (to[1] ?? 0) - (from[1] ?? 0);
    const dz = (to[2] ?? 0) - (from[2] ?? 0);
    return Math.hypot(dx, dy, dz);
  }
  if (typeof from === 'number' && typeof to === 'number') {
    return Math.abs(to - from);
  }
  return 0;
};

const getEasedT = <T,>(rawT: number, a: AeKeyframe<T>, b: AeKeyframe<T>) => {
  const outInfluence = a.outEase?.[0]?.influence ?? 0;
  const inInfluence = b.inEase?.[0]?.influence ?? 0;
  const outSpeed = a.outEase?.[0]?.speed ?? 0;
  const inSpeed = b.inEase?.[0]?.speed ?? 0;

  const usesBezier =
    a.outInterp === 'BEZIER' || b.inInterp === 'BEZIER' || outInfluence > 0 || inInfluence > 0;
  if (!usesBezier) return rawT;

  const x1 = clamp(outInfluence / 100, 0, 1);
  const x2 = clamp(1 - inInfluence / 100, 0, 1);

  const duration = b.time - a.time || 1;
  const delta = getDeltaMagnitude(a.value, b.value);
  const averageSpeed = delta > 0 ? delta / duration : 1;
  const m0 = averageSpeed > 0 ? outSpeed / averageSpeed : 0;
  const m1 = averageSpeed > 0 ? inSpeed / averageSpeed : 0;
  const y1 = clamp(m0 * x1, 0, 1);
  const y2 = clamp(1 - m1 * (1 - x2), 0, 1);

  const t = solveBezier(rawT, x1, x2);
  return cubicBezier(t, 0, y1, y2, 1);
};

const getPropValue = <T,>(prop: AeProp<T> | undefined, time: number): T | undefined => {
  if (!prop) return undefined;
  if (prop.static !== undefined) return prop.static;
  if (!prop.keys || prop.keys.length === 0) return undefined;
  if (time <= prop.keys[0].time) return prop.keys[0].value;
  const last = prop.keys[prop.keys.length - 1];
  if (time >= last.time) return last.value;
  for (let i = 0; i < prop.keys.length - 1; i++) {
    const a = prop.keys[i];
    const b = prop.keys[i + 1];
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time || 1;
      const rawT = (time - a.time) / span;
      const eased = getEasedT(rawT, a, b);
      if (Array.isArray(a.value) && Array.isArray(b.value)) {
        const next = b.value as number[];
        return a.value.map((v, idx) => v + (next[idx] - v) * eased) as T;
      }
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return (a.value + (b.value - a.value) * eased) as T;
      }
      return a.value;
    }
  }
  return last.value;
};

const getDimPropValue = (prop: AeDimProp<number[]> | undefined, time: number) => {
  if (!prop) return undefined;
  if ('separated' in prop && prop.separated) {
    const values = prop.components.map((component) => getPropValue(component.value, time) ?? 0);
    return values as number[];
  }
  return getPropValue(prop as AeProp<number[]>, time);
};

const resolveAssetUrl = (layer: AeLayer) => {
  const name = layer.source?.name ?? layer.name;
  if (!name) return null;
  if (name.endsWith('.mov') || name.includes(FINAL_KEYWORD)) {
    const isReverse = name.includes(FINAL_REVERSE_KEYWORD) || layer.stretch < 0;
    return isReverse ? 'lunpo/reverse.webm' : 'lunpo/forward.webm';
  }
  if (layer.source?.path) {
    const match = layer.source.path.match(/assets-[^\\/]+/);
    if (match) {
      return `lunpo/${match[0]}/${name}`;
    }
  }
  return `lunpo/${name}`;
};

const isColorKeyLayer = (layer: AeLayer) =>
  layer.effects?.some((effect) => effect.matchName === 'ADBE Color Key');

const isSolidLayer = (layer: AeLayer) =>
  layer.source?.path === null && layer.source?.type === 'Footage';

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });

const createVideo = (url: string) =>
  new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
  });

const findEffectValue = (
  properties: AeEffectProperty[] | undefined,
  matchName: string
): number | number[] | undefined => {
  if (!properties) return undefined;
  for (const prop of properties) {
    if (prop.matchName === matchName && prop.value?.static !== undefined) {
      return prop.value.static;
    }
    const nested = findEffectValue(prop.properties, matchName);
    if (nested !== undefined) return nested;
  }
  return undefined;
};

const getColorKeySettings = (layer: AeLayer): ColorKeySettings | null => {
  const effect = layer.effects?.find((item) => item.matchName === 'ADBE Color Key');
  if (!effect) return null;
  const colorValue = findEffectValue(effect.properties, 'ADBE Color Key-0001');
  const toleranceValue = findEffectValue(effect.properties, 'ADBE Color Key-0002');
  if (!Array.isArray(colorValue)) return null;
  const rgb = colorValue.slice(0, 3).map((value) => Math.round(value * 255)) as [
    number,
    number,
    number,
  ];
  const tolerance = typeof toleranceValue === 'number' ? toleranceValue : 0;
  return { color: rgb, tolerance };
};

const applyColorKey = (image: HTMLImageElement, settings: ColorKeySettings) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const [r, g, b] = settings.color;
  const tolerance = settings.tolerance;
  const toleranceSq = tolerance * tolerance;
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - r;
    const dg = data[i + 1] - g;
    const db = data[i + 2] - b;
    if (dr * dr + dg * dg + db * db <= toleranceSq) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

const getLoopedFrameTime = (time: number, frameRate: number, duration: number) => {
  const totalFrames = Math.max(1, Math.round(duration * frameRate));
  const frame = Math.floor(time * frameRate) % totalFrames;
  return frame / frameRate;
};

const getClampedFrameTime = (time: number, frameRate: number, duration: number) => {
  const totalFrames = Math.max(1, Math.round(duration * frameRate));
  const frame = Math.min(Math.floor(time * frameRate), totalFrames - 1);
  return frame / frameRate;
};

export const LunpoCanvas = forwardRef<
  LunpoCanvasHandle,
  { width: number; height: number; scale: number }
>(({ width, height, scale }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const referenceCharacterSizeRef = useRef<{ width: number; height: number } | null>(null);
  const characterSizeRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const [config, setConfig] = useState<AeConfig | null>(null);
  const [layers, setLayers] = useState<PreparedLayer[]>([]);
  const [assetsReady, setAssetsReady] = useState(false);
  const assetsRef = useRef<Map<string, HTMLImageElement | HTMLVideoElement | HTMLCanvasElement>>(
    new Map()
  );
  const videoFrameCacheRef = useRef<Map<string, { canvas: HTMLCanvasElement; time: number }>>(
    new Map()
  );
  const exportLockRef = useRef(false);
  const isExportingRef = useRef(false);

  const { lunpoCharacterUrl, lunpoTransform, lunpoColorAdjust } = useStore();

  const backgroundFilter = useMemo(
    () =>
      `hue-rotate(${lunpoColorAdjust.hue}deg) saturate(${lunpoColorAdjust.saturation}%) brightness(${lunpoColorAdjust.brightness}%) contrast(${lunpoColorAdjust.contrast}%)`,
    [lunpoColorAdjust]
  );

  useEffect(() => {
    fetch('e.json')
      .then((res) => res.json())
      .then((data: AeConfig) => setConfig(data))
      .catch((err) => console.error('Failed to load lunpo config', err));
  }, []);

  useEffect(() => {
    if (!config) return;
    if (!referenceCharacterSizeRef.current) {
      const refLayer = config.comp.layers.find((layer) => isCharacterLayer(layer.name));
      const refWidth = refLayer?.source?.width;
      const refHeight = refLayer?.source?.height;
      if (refWidth && refHeight) {
        referenceCharacterSizeRef.current = { width: refWidth, height: refHeight };
      }
    }
    const prepared = config.comp.layers.map((layer) => {
      const isSolid = isSolidLayer(layer);
      const isCharacter = isCharacterLayer(layer.name);
      const colorKey = isColorKeyLayer(layer) ? getColorKeySettings(layer) : null;
      const url = isCharacter ? lunpoCharacterUrl : resolveAssetUrl(layer);
      const type = url?.endsWith('.webm') ? 'video' : 'image';
      const isPrecomp = layer.source?.type === 'Comp';
      const shouldSkip =
        !url || isSolid || !isCharacter || (isPrecomp && !layer.name.includes(FINAL_KEYWORD));
      const assetKey = url
        ? colorKey && type === 'image'
          ? `${url}|colorkey|${colorKey.color.join(',')}|${colorKey.tolerance}`
          : url
        : null;
      return {
        layer,
        type: shouldSkip ? 'skip' : type,
        url,
        assetKey,
        isCharacter,
        colorKey,
      } as PreparedLayer;
    });
    setLayers(prepared);
  }, [config, lunpoCharacterUrl]);

  useEffect(() => {
    let isMounted = true;
    const loadAssets = async () => {
      const loadPromises: Promise<void>[] = [];
      if (!backgroundVideoRef.current) {
        loadPromises.push(
          createVideo(BACKGROUND_VIDEO_URL).then((video) => {
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            backgroundVideoRef.current = video;
          })
        );
      }
      layers.forEach((item) => {
        if (!item.url || item.type === 'skip' || !item.assetKey) return;
        if (assetsRef.current.has(item.assetKey)) return;
        if (item.type === 'image') {
          const promise = createImage(item.url).then((img) => {
            const asset = item.colorKey ? applyColorKey(img, item.colorKey) : img;
            assetsRef.current.set(item.assetKey!, asset);
            if (item.isCharacter) {
              characterSizeRef.current.set(item.assetKey!, {
                width: asset.width,
                height: asset.height,
              });
            }
          });
          loadPromises.push(promise);
        } else {
          const promise = createVideo(item.url).then((video) => {
            assetsRef.current.set(item.assetKey!, video);
          });
          loadPromises.push(promise);
        }
      });
      const results = await Promise.allSettled(loadPromises);
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Lunpo asset failed', result.reason);
        }
      });

      if (isMounted) {
        setAssetsReady(true);
      }
    };

    if (layers.length) {
      setAssetsReady(false);
      loadAssets().catch((err) => console.error('Failed to load lunpo assets', err));
    }
    return () => {
      isMounted = false;
    };
  }, [layers]);

  const getLayerTransform = useCallback(
    (
      layer: AeLayer,
      time: number,
      isCharacter: boolean,
      characterSize?: { width: number; height: number } | null,
      referenceSize?: { width: number; height: number } | null
    ) => {
      const transform = layer.transform;
      const anchor = (getDimPropValue(transform?.anchorPoint, time) ?? [0, 0, 0]) as number[];
      const position = [...(getDimPropValue(transform?.position, time) ?? [0, 0, 0])] as number[];
      const scaleValue = (getDimPropValue(transform?.scale, time) ?? [100, 100, 100]) as number[];
      let rotation = getPropValue(transform?.rotation, time) ?? 0;

      if (isCharacter && characterSize) {
        anchor[0] = characterSize.width / 2;
        anchor[1] = characterSize.height / 2;
        anchor[2] = 0;
      }

      let scaleX = scaleValue[0] / 100;
      let scaleY = scaleValue[1] / 100;
      if (isCharacter) {
        if (characterSize && referenceSize && characterSize.height > 0) {
          const sizeScale = referenceSize.height / characterSize.height;
          scaleX *= sizeScale;
          scaleY *= sizeScale;
        }
        position[0] += lunpoTransform.offsetX;
        position[1] += lunpoTransform.offsetY;
        rotation += lunpoTransform.rotation;
        scaleX *= lunpoTransform.scale / 100;
        scaleY *= lunpoTransform.scale / 100;
        if (lunpoTransform.flipX) scaleX *= -1;
        if (lunpoTransform.flipY) scaleY *= -1;
      }
      return {
        anchor,
        position,
        scaleX,
        scaleY,
        rotation: toRadians(rotation),
      };
    },
    [lunpoTransform]
  );

  const drawImageWithTransform = (
    ctx: CanvasRenderingContext2D,
    asset: CanvasImageSource,
    transform: ReturnType<typeof getLayerTransform>
  ) => {
    ctx.translate(transform.position[0], transform.position[1]);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scaleX, transform.scaleY);
    ctx.translate(-transform.anchor[0], -transform.anchor[1]);
    ctx.drawImage(asset, 0, 0);
  };

  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const backgroundVideo = backgroundVideoRef.current;
      if (backgroundVideo && backgroundVideo.readyState >= 2) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = backgroundFilter;
        ctx.drawImage(backgroundVideo, 0, 0, width, height);
        ctx.restore();
      }

      const frameTime = backgroundVideo?.currentTime ?? time;
      layers
        .filter((item) => item.type !== 'skip' && item.isCharacter)
        .sort((a, b) => b.layer.index - a.layer.index)
        .forEach((item) => {
          const layer = item.layer;
          const visibleStart = Math.min(layer.inPoint, layer.outPoint);
          const visibleEnd = Math.max(layer.inPoint, layer.outPoint);
          if (frameTime < visibleStart || frameTime > visibleEnd) return;
          const asset = item.assetKey ? assetsRef.current.get(item.assetKey) : undefined;
          if (!asset) return;

          const opacity = getPropValue(layer.transform?.opacity, frameTime) ?? 100;
          const composite = getBlendMode(layer.blendMode);
          const characterSize = item.isCharacter
            ? (characterSizeRef.current.get(item.assetKey ?? '') ?? null)
            : null;
          const transform = getLayerTransform(
            layer,
            frameTime,
            item.isCharacter,
            characterSize,
            referenceCharacterSizeRef.current
          );

          ctx.save();
          ctx.globalAlpha = opacity / 100;
          ctx.globalCompositeOperation = composite as GlobalCompositeOperation;
          ctx.filter = 'none';
          if (item.type === 'video') {
            const video = asset as HTMLVideoElement;
            if (video.readyState >= 2) {
              const duration = Number.isFinite(video.duration) ? video.duration : 0;
              const localTime = (frameTime - layer.startTime) * (layer.stretch / 100);
              const remapped = layer.timeRemap
                ? getPropValue(layer.timeRemap, frameTime)
                : localTime;
              const rawTargetTime = clamp(remapped ?? 0, 0, duration || 0);
              const frameRate = config.comp.frameRate || 30;
              const frameStep = 1 / frameRate;
              const targetTime = Math.round(rawTargetTime * frameRate) / frameRate;
              const cacheKey = item.assetKey ?? item.url ?? '';
              const cached = cacheKey ? videoFrameCacheRef.current.get(cacheKey) : undefined;
              if (!video.seeking && Math.abs(video.currentTime - targetTime) > frameStep / 2) {
                video.currentTime = targetTime;
              }

              const drawSource =
                video.seeking && cached ? (cached.canvas as CanvasImageSource) : video;
              drawImageWithTransform(ctx, drawSource, transform);

              if (!video.seeking && cacheKey) {
                let cache = cached;
                if (!cache) {
                  const cacheCanvas = document.createElement('canvas');
                  cacheCanvas.width = width;
                  cacheCanvas.height = height;
                  cache = { canvas: cacheCanvas, time: targetTime };
                  videoFrameCacheRef.current.set(cacheKey, cache);
                }
                const cacheCtx = cache.canvas.getContext('2d');
                if (cacheCtx) {
                  cacheCtx.clearRect(0, 0, width, height);
                  drawImageWithTransform(cacheCtx, video, transform);
                  cache.time = targetTime;
                }
              }
            }
          } else {
            drawImageWithTransform(ctx, asset as CanvasImageSource, transform);
          }
          ctx.restore();
        });
    },
    [backgroundFilter, config, getLayerTransform, height, layers, width]
  );

  useEffect(() => {
    if (!config || !assetsReady) return;
    let rafId = 0;
    const duration = config.comp.duration;
    const frameRate = config.comp.frameRate || 30;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const backgroundVideo = backgroundVideoRef.current;
      if (backgroundVideo && backgroundVideo.paused) {
        backgroundVideo.currentTime = 0;
        backgroundVideo.play().catch(() => {});
      }
      const t = getLoopedFrameTime(elapsed, frameRate, duration);
      if (!isExportingRef.current) {
        renderFrame(t);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [assetsReady, config, renderFrame]);

  const exportWebm = useCallback(async () => {
    if (!canvasRef.current || !config || exportLockRef.current || !assetsReady) return;
    exportLockRef.current = true;
    isExportingRef.current = true;
    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(config.comp.frameRate || 30);
      const backgroundVideo = backgroundVideoRef.current;
      const backgroundDuration = backgroundVideo?.duration || config.comp.duration;
      if (backgroundVideo) {
        backgroundVideo.loop = false;
        backgroundVideo.currentTime = 0;
        await backgroundVideo.play().catch(() => {});
      }
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const audioResponse = await fetch('lunpo/audio.mp3');
      const audioBuffer = await audioResponse.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(audioBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = decoded;
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      const mixedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp9', 'video/webm'];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
      const recorder = new MediaRecorder(mixedStream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      const durationMs = backgroundDuration * 1000;
      const frameRate = config.comp.frameRate || 30;
      const durationSec = backgroundDuration;
      const start = performance.now();
      let rafId = 0;
      const tick = (now: number) => {
        const elapsed = now - start;
        renderFrame(getClampedFrameTime(elapsed / 1000, frameRate, durationSec));
        if (elapsed < durationMs) {
          rafId = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(rafId);
          recorder.stop();
        }
      };

      recorder.start();
      source.start(0);
      requestAnimationFrame(tick);

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      saveAs(blob, `lunpo-${Date.now()}.webm`);
      if (backgroundVideo) {
        backgroundVideo.loop = true;
        backgroundVideo.pause();
      }
      source.stop();
      audioContext.close();
    } finally {
      exportLockRef.current = false;
      isExportingRef.current = false;
    }
  }, [assetsReady, config, renderFrame]);

  useImperativeHandle(ref, () => ({ exportWebm }), [exportWebm]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: width * scale, height: height * scale }}
    />
  );
});

LunpoCanvas.displayName = 'LunpoCanvas';
