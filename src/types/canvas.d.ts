// Type declarations for canvas package (Node.js)
declare module 'canvas' {
  export function createCanvas(width: number, height: number): Canvas;
  export interface Canvas {
    width: number;
    height: number;
    getContext(type: '2d'): CanvasRenderingContext2D;
    toDataURL(type?: string): string;
  }
  export interface CanvasRenderingContext2D {
    fillRect(x: number, y: number, w: number, h: number): void;
    clearRect(x: number, y: number, w: number, h: number): void;
    getImageData(x: number, y: number, w: number, h: number): ImageData;
    putImageData(imageData: ImageData, x: number, y: number): void;
    beginPath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    stroke(): void;
    fill(text: string, x?: number, y?: number): void;
    save(): void;
    restore(): void;
    translate(x: number, y: number): void;
    scale(x: number, y: number): void;
    drawImage(img: any, x: number, y: number, w?: number, h?: number): void;
    fillText(text: string, x: number, y: number): void;
    font: string;
    textAlign: string;
  }
  export interface ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }
  const canvas: { createCanvas: typeof createCanvas };
  export default canvas;
}