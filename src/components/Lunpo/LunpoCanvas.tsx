import React, {
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
  isCharacter: boolean;
  isMask: boolean;
  hasColorKey: boolean;
}

export interface LunpoCanvasHandle {
  exportWebm: () => Promise<void>;
}

const MASK_LAYER_NAME = 'Hiro_CutIn_StainedGlass_luminescence001.png';
const CHARACTER_KEYWORD = 'RefuteCutIn';

const getBlendMode = (blendMode: string, hasColorKey: boolean) => {
  if (hasColorKey) return 'screen';
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

const smoothstep = (t: number) => t * t * (3 - 2 * t);

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
      const eased = a.outInterp === 'BEZIER' || b.inInterp === 'BEZIER' ? smoothstep(rawT) : rawT;
      if (Array.isArray(a.value) && Array.isArray(b.value)) {
        return a.value.map((v, idx) => v + (b.value[idx] - v) * eased) as T;
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
  if (name.endsWith('.mov') || name.includes('破碎final')) {
    const isReverse = name.includes('反') || layer.stretch < 0;
    return isReverse ? '/lunpo/reverse.webm' : '/lunpo/forward.webm';
  }
  if (layer.source?.path) {
    const match = layer.source.path.match(/assets-[^\\/]+/);
    if (match) {
      return `/lunpo/${match[0]}/${name}`;
    }
  }
  return `/lunpo/${name}`;
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
    img.onerror = reject;
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

export const LunpoCanvas = forwardRef<
  LunpoCanvasHandle,
  { width: number; height: number; scale: number }
>(({ width, height, scale }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const [config, setConfig] = useState<AeConfig | null>(null);
  const [layers, setLayers] = useState<PreparedLayer[]>([]);
  const [assetsReady, setAssetsReady] = useState(false);
  const assetsRef = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map());
  const maskLayerRef = useRef<PreparedLayer | null>(null);
  const exportLockRef = useRef(false);
  const isExportingRef = useRef(false);

  const { lunpoCharacterUrl, lunpoTransform, lunpoColorAdjust } = useStore();

  const backgroundFilter = useMemo(
    () =>
      `hue-rotate(${lunpoColorAdjust.hue}deg) saturate(${lunpoColorAdjust.saturation}%) brightness(${lunpoColorAdjust.brightness}%) contrast(${lunpoColorAdjust.contrast}%)`,
    [lunpoColorAdjust]
  );

  useEffect(() => {
    fetch('/e.json')
      .then((res) => res.json())
      .then((data: AeConfig) => setConfig(data))
      .catch((err) => console.error('Failed to load lunpo config', err));
  }, []);

  useEffect(() => {
    if (!config) return;
    const prepared = config.comp.layers.map((layer) => {
      const isMask = layer.name === MASK_LAYER_NAME;
      const isCharacter = isCharacterLayer(layer.name);
      const url = isCharacter ? lunpoCharacterUrl : resolveAssetUrl(layer);
      const type = url?.endsWith('.webm') ? 'video' : 'image';
      return {
        layer,
        type: url ? type : 'skip',
        url,
        isCharacter,
        isMask,
        hasColorKey: isColorKeyLayer(layer),
      } as PreparedLayer;
    });
    setLayers(prepared);
    maskLayerRef.current = prepared.find((item) => item.isMask) ?? null;
  }, [config, lunpoCharacterUrl]);

  useEffect(() => {
    let isMounted = true;
    const loadAssets = async () => {
      const loadPromises: Promise<void>[] = [];
      layers.forEach((item) => {
        if (!item.url || item.type === 'skip' || item.isMask) return;
        if (assetsRef.current.has(item.url)) return;
        if (item.type === 'image') {
          const promise = createImage(item.url).then((img) => {
            assetsRef.current.set(item.url!, img);
          });
          loadPromises.push(promise);
        } else {
          const promise = createVideo(item.url).then((video) => {
            assetsRef.current.set(item.url!, video);
          });
          loadPromises.push(promise);
        }
      });
      if (maskLayerRef.current?.url && !assetsRef.current.has(maskLayerRef.current.url)) {
        loadPromises.push(
          createImage(maskLayerRef.current.url).then((img) => {
            assetsRef.current.set(maskLayerRef.current!.url!, img);
          })
        );
      }
      await Promise.all(loadPromises);
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
    (layer: AeLayer, time: number, isCharacter: boolean) => {
      const transform = layer.transform;
      const anchor = (getDimPropValue(transform?.anchorPoint, time) ?? [0, 0, 0]) as number[];
      const position = [...(getDimPropValue(transform?.position, time) ?? [0, 0, 0])] as number[];
      const scaleValue = (getDimPropValue(transform?.scale, time) ?? [100, 100, 100]) as number[];
      let rotation = getPropValue(transform?.rotation, time) ?? 0;

      let scaleX = scaleValue[0] / 100;
      let scaleY = scaleValue[1] / 100;
      if (isCharacter) {
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

  const drawMask = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const maskLayer = maskLayerRef.current;
      if (!maskLayer?.url) return;
      const maskAsset = assetsRef.current.get(maskLayer.url) as HTMLImageElement | undefined;
      if (!maskAsset) return;
      const transform = getLayerTransform(maskLayer.layer, time, false);
      ctx.save();
      drawImageWithTransform(ctx, maskAsset, transform);
      ctx.restore();
    },
    [getLayerTransform]
  );

  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenRef.current;
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      ctx.clearRect(0, 0, width, height);

      layers
        .filter((item) => item.type !== 'skip' && !item.isMask && !isSolidLayer(item.layer))
        .sort((a, b) => a.layer.index - b.layer.index)
        .forEach((item) => {
          const layer = item.layer;
          const visibleStart = Math.min(layer.inPoint, layer.outPoint);
          const visibleEnd = Math.max(layer.inPoint, layer.outPoint);
          if (time < visibleStart || time > visibleEnd) return;
          const asset = item.url ? assetsRef.current.get(item.url) : undefined;
          if (!asset) return;

          const opacity = getPropValue(layer.transform?.opacity, time) ?? 100;
          const isBackground = !item.isCharacter;
          const composite = getBlendMode(layer.blendMode, item.hasColorKey);
          const transform = getLayerTransform(layer, time, item.isCharacter);

          const drawTarget = (targetCtx: CanvasRenderingContext2D) => {
            targetCtx.save();
            targetCtx.globalAlpha = opacity / 100;
            targetCtx.globalCompositeOperation = composite as GlobalCompositeOperation;
            targetCtx.filter = isBackground ? backgroundFilter : 'none';
            if (item.type === 'video') {
              const video = asset as HTMLVideoElement;
              if (video.readyState >= 2) {
                const localTime = (time - layer.startTime) * Math.abs(layer.stretch / 100);
                const remapped = layer.timeRemap ? getPropValue(layer.timeRemap, time) : localTime;
                const duration = Number.isFinite(video.duration) ? video.duration : 0;
                const targetTime = clamp(remapped ?? localTime, 0, duration || 0);
                if (Math.abs(video.currentTime - targetTime) > 0.05) {
                  video.currentTime = targetTime;
                }
                drawImageWithTransform(targetCtx, video, transform);
              }
            } else {
              drawImageWithTransform(targetCtx, asset as HTMLImageElement, transform);
            }
            targetCtx.restore();
          };

          const shouldMask = item.layer.name.includes('StainedGlass');
          if (shouldMask && maskLayerRef.current) {
            offCtx.clearRect(0, 0, width, height);
            drawTarget(offCtx);
            offCtx.globalCompositeOperation = 'destination-in';
            drawMask(offCtx, time);
            ctx.drawImage(offscreen, 0, 0);
          } else {
            drawTarget(ctx);
          }
        });
    },
    [backgroundFilter, config, drawMask, getLayerTransform, height, layers, width]
  );

  useEffect(() => {
    if (!config || !assetsReady) return;
    let rafId = 0;
    const duration = config.comp.duration;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = elapsed % duration;
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
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const audioResponse = await fetch('/lunpo/audio.mp3');
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

      const durationMs = config.comp.duration * 1000;
      const start = performance.now();
      let rafId = 0;
      const tick = (now: number) => {
        const elapsed = now - start;
        renderFrame(elapsed / 1000);
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
const isCharacterLayer = (name: string) =>
  name.includes(CHARACTER_KEYWORD) && !name.includes('StainedGlass');
