declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: unknown);
    on(event: string, callback: (...args: unknown[]) => void): this;
    text(text: string, options?: unknown): this;
    moveDown(lines?: number): this;
    fontSize(size: number): this;
    end(): void;
  }
  export default PDFDocument;
}


