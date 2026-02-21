import { AxisMarkerAnnotation } from "scichart";
import { appTheme } from "../../../../styles/theme";

type MarkerVariant = "start" | "end";

const makePillImage = (
  label: string,
  color: string,
  variant: MarkerVariant,
): { imageElement: HTMLImageElement; width: number; height: number } => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const fontSize = 11;
  const fontFamily = "Inter, Roboto, system-ui, sans-serif";
  const paddingX = 10;
  const paddingY = 5;
  const radius = 4;
  const tipH = 5;

  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  const textWidth = ctx.measureText(label).width;

  const w = Math.ceil(textWidth + paddingX * 2);
  const h = fontSize + paddingY * 2;
  const totalH = h + tipH;

  canvas.width = w;
  canvas.height = totalH;
  ctx.font = `600 ${fontSize}px ${fontFamily}`;

  const fillColor = variant === "start" ? color + "99" : color;

  const parseHex = (hex: string, alpha: number = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const baseColor = fillColor.slice(0, 7);
  const opacity =
    fillColor.length > 7 ? parseInt(fillColor.slice(7, 9), 16) / 255 : 1;
  const rgba = parseHex(baseColor, opacity);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2 - 5, tipH);
  ctx.lineTo(w / 2 + 5, tipH);
  ctx.closePath();
  ctx.fillStyle = rgba;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(radius, tipH);
  ctx.lineTo(w - radius, tipH);
  ctx.quadraticCurveTo(w, tipH, w, tipH + radius);
  ctx.lineTo(w, tipH + h - radius);
  ctx.quadraticCurveTo(w, tipH + h, w - radius, tipH + h);
  ctx.lineTo(radius, tipH + h);
  ctx.quadraticCurveTo(0, tipH + h, 0, tipH + h - radius);
  ctx.lineTo(0, tipH + radius);
  ctx.quadraticCurveTo(0, tipH, radius, tipH);
  ctx.closePath();
  ctx.fillStyle = rgba;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, w / 2, tipH + h / 2 + 1);

  const img = new Image();
  img.src = canvas.toDataURL();

  return {
    imageElement: img,
    width: w,
    height: totalH,
  };
};

export const createAxisMarker = (
  value: number,
  formatFunc: (v: number) => string,
  isXAxis: boolean = false,
  variant: MarkerVariant = "start",
  color: string = appTheme.VividSkyBlue,
): AxisMarkerAnnotation => {
  const safeValue = isNaN(value) ? 0 : value;
  const label = formatFunc(safeValue);

  if (isXAxis) {
    const { imageElement, width, height } = makePillImage(
      label,
      color,
      variant,
    );

    return new AxisMarkerAnnotation({
      image: imageElement,
      imageWidth: width,
      imageHeight: height,
      xAxisId: "AxisX",
      x1: safeValue,
    });
  } else {
    const bgColor = variant === "start" ? color + "99" : color;
    return new AxisMarkerAnnotation({
      fontSize: 11,
      fontStyle: "Bold",
      backgroundColor: bgColor,
      color: "#ffffff",
      formattedValue: label,
      yAxisId: "AxisY",
      y1: safeValue,
    });
  }
};

export const updateXAxisMarker = (
  marker: AxisMarkerAnnotation,
  value: number,
  formatFunc: (v: number) => string,
  color: string,
  variant: MarkerVariant,
) => {
  const label = formatFunc(value);
  const { imageElement, width, height } = makePillImage(label, color, variant);

  marker.x1 = value;
  marker.image = imageElement;
  marker.imageWidth = width;
  marker.imageHeight = height;
};

export const updateYAxisMarker = (
  marker: AxisMarkerAnnotation,
  value: number,
  formatFunc: (v: number) => string,
  color: string,
  variant: MarkerVariant,
) => {
  const bgColor = variant === "start" ? color + "99" : color;
  marker.y1 = value;
  marker.formattedValue = formatFunc(value);
  marker.backgroundColor = bgColor;
};
