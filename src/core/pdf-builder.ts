import PDFDocument from 'pdfkit';

export const PAGE_WIDTH = 1404;
export const PAGE_HEIGHT = 1872;
export const PAGE_MARGIN = 60;

export class PdfBuilder {
  private doc: PDFKit.PDFDocument;
  private chunks: Buffer[] = [];

  constructor(
    private title: string,
    private subtitle: string,
    private dateStr: string
  ) {
    this.doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: PAGE_MARGIN,
      autoFirstPage: true,
      info: {
        Title: title,
        Author: 'Pen to Paper Generator',
      },
    });

    this.doc.on('data', (chunk) => this.chunks.push(chunk));
    this.renderHeader(this.title, this.subtitle, this.dateStr);
  }

  getDoc(): PDFKit.PDFDocument {
    return this.doc;
  }

  private renderHeader(title: string, subtitle: string, dateStr: string): void {
    this.doc
      .fillColor('#000000')
      .fontSize(42)
      .font('Helvetica-Bold')
      .text(title, PAGE_MARGIN, PAGE_MARGIN, { align: 'center' });

    this.doc
      .fontSize(24)
      .font('Helvetica')
      .fillColor('#444444')
      .text(`${subtitle}  •  ${dateStr}`, PAGE_MARGIN, PAGE_MARGIN + 55, { align: 'center' });

    // Header divider line
    this.doc
      .strokeColor('#000000')
      .lineWidth(2)
      .moveTo(PAGE_MARGIN, PAGE_MARGIN + 95)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, PAGE_MARGIN + 95)
      .stroke();
  }

  addBufferPage(): void {
    this.doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: PAGE_MARGIN });

    const centerY = PAGE_HEIGHT / 2 - 40;
    this.doc
      .fillColor('#000000')
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('Answer Key on Next Page', PAGE_MARGIN, centerY, { align: 'center' });

    this.doc
      .fontSize(22)
      .font('Helvetica')
      .fillColor('#666666')
      .text('[ Swipe to reveal solution ]', PAGE_MARGIN, centerY + 55, { align: 'center' });
  }

  addAnswerKeyPage(solutionTitle: string): void {
    this.doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: PAGE_MARGIN });

    this.renderHeader(`Answer Key: ${solutionTitle}`, this.subtitle, this.dateStr);
  }

  build(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(this.chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}
