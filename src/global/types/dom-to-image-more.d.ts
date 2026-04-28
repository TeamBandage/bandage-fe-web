declare module 'dom-to-image-more' {
  export interface DomToImageOptions {
    quality?: number;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    filter?: (node: HTMLElement) => boolean;
    cacheBust?: boolean;
  }

  const domtoimage: {
    toJpeg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
    toPng(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
    toBlob(node: HTMLElement, options?: DomToImageOptions): Promise<Blob>;
    toSvg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
  };
  export default domtoimage;
}
