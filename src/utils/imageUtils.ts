import { UploadedImage } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function fileToUploadedImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          dataUrl,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          rotation: 0,
        });
      };
      img.onerror = () => {
        reject(new Error(`Failed to decode image: ${file.name}`));
      };
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Creates an oriented data URL baking the rotation and ensuring standard JPEG/PNG output.
 */
export function bakeRotationToDataUrl(image: UploadedImage): Promise<string> {
  const isDirectJpegOrPng =
    image.dataUrl.startsWith('data:image/jpeg') ||
    image.dataUrl.startsWith('data:image/jpg') ||
    image.dataUrl.startsWith('data:image/png');

  if (image.rotation === 0 && isDirectJpegOrPng) {
    return Promise.resolve(image.dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(image.dataUrl);
      }

      const isRotated90or270 = image.rotation === 90 || image.rotation === 270;
      canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((image.rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      const outputType = image.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outputType, 0.92));
    };
    img.onerror = () => resolve(image.dataUrl);
    img.src = image.dataUrl;
  });
}

/**
 * Generates sample documents and photos so the user can test immediately.
 */
export async function generateSampleImages(): Promise<UploadedImage[]> {
  const samples: UploadedImage[] = [];

  // Sample 1: Document Cover / Project Report
  const c1 = document.createElement('canvas');
  c1.width = 1200;
  c1.height = 1600;
  const ctx1 = c1.getContext('2d')!;
  
  // Background
  ctx1.fillStyle = '#f8fafc';
  ctx1.fillRect(0, 0, 1200, 1600);

  // Header band
  ctx1.fillStyle = '#1e293b';
  ctx1.fillRect(0, 0, 1200, 320);

  // Accent line
  ctx1.fillStyle = '#3b82f6';
  ctx1.fillRect(0, 314, 1200, 12);

  // Title text
  ctx1.fillStyle = '#ffffff';
  ctx1.font = 'bold 54px sans-serif';
  ctx1.fillText('PROJECT SUMMARY REPORT', 80, 140);

  ctx1.fillStyle = '#94a3b8';
  ctx1.font = '28px sans-serif';
  ctx1.fillText('Quarterly Operations & Analytics Overview', 80, 200);

  // Content blocks
  ctx1.fillStyle = '#0f172a';
  ctx1.font = 'bold 36px sans-serif';
  ctx1.fillText('1. Executive Overview', 80, 420);

  ctx1.fillStyle = '#475569';
  ctx1.font = '24px sans-serif';
  const text1 = 'This document has been processed and converted using the Python Image-to-PDF Engine. ' +
    'The standard library architecture preserves high dynamic color fidelity, strict ISO page boundaries, ' +
    'and embedding optimizations for both archival and printing workflows.';
  wrapText(ctx1, text1, 80, 470, 1040, 36);

  // Visual Chart in Canvas
  ctx1.fillStyle = '#e2e8f0';
  ctx1.fillRect(80, 640, 1040, 420);
  ctx1.strokeStyle = '#cbd5e1';
  ctx1.lineWidth = 2;
  ctx1.strokeRect(80, 640, 1040, 420);

  // Bar elements
  const barHeights = [200, 260, 310, 280, 350];
  const barLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const barColors = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];
  barHeights.forEach((h, idx) => {
    const x = 160 + idx * 190;
    const y = 1000 - h;
    ctx1.fillStyle = barColors[idx];
    ctx1.fillRect(x, y, 110, h);
    ctx1.fillStyle = '#334155';
    ctx1.font = 'bold 22px sans-serif';
    ctx1.fillText(barLabels[idx], x + 35, 1035);
  });

  // Footer
  ctx1.fillStyle = '#94a3b8';
  ctx1.font = '20px sans-serif';
  ctx1.fillText('Verified by Python 3.10 Engine • Page 1 of Document', 80, 1540);

  const sample1Data = c1.toDataURL('image/jpeg', 0.92);
  samples.push({
    id: 'sample_doc_1',
    name: '01_Project_Report_Cover.jpg',
    size: Math.round(sample1Data.length * 0.75),
    type: 'image/jpeg',
    dataUrl: sample1Data,
    width: 1200,
    height: 1600,
    rotation: 0,
  });

  // Sample 2: Business Invoice
  const c2 = document.createElement('canvas');
  c2.width = 1200;
  c2.height = 1600;
  const ctx2 = c2.getContext('2d')!;

  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(0, 0, 1200, 1600);

  // Top header
  ctx2.fillStyle = '#0f172a';
  ctx2.font = 'bold 44px sans-serif';
  ctx2.fillText('INVOICE', 80, 120);

  ctx2.fillStyle = '#64748b';
  ctx2.font = '22px sans-serif';
  ctx2.fillText('Invoice #: INV-2026-0891', 80, 165);
  ctx2.fillText('Date: September 21, 2026', 80, 200);

  // Badge
  ctx2.fillStyle = '#dcfce7';
  ctx2.fillRect(960, 80, 160, 50);
  ctx2.fillStyle = '#15803d';
  ctx2.font = 'bold 22px sans-serif';
  ctx2.fillText('PAID', 1010, 113);

  // Table header
  ctx2.fillStyle = '#f1f5f9';
  ctx2.fillRect(80, 280, 1040, 60);
  ctx2.fillStyle = '#1e293b';
  ctx2.font = 'bold 22px sans-serif';
  ctx2.fillText('Description', 110, 318);
  ctx2.fillText('Qty', 680, 318);
  ctx2.fillText('Rate', 820, 318);
  ctx2.fillText('Amount', 980, 318);

  const items = [
    { desc: 'Cloud Infrastructure & API Hosting', qty: '1', rate: '$450.00', total: '$450.00' },
    { desc: 'Python Image Conversion Architecture', qty: '1', rate: '$600.00', total: '$600.00' },
    { desc: 'Automated Document Pipeline Integration', qty: '2', rate: '$225.00', total: '$450.00' },
    { desc: 'PDF Security & Metadata Optimization', qty: '1', rate: '$300.00', total: '$300.00' },
  ];

  let currentY = 380;
  items.forEach((item, idx) => {
    ctx2.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx2.fillRect(80, currentY - 35, 1040, 50);
    ctx2.fillStyle = '#334155';
    ctx2.font = '22px sans-serif';
    ctx2.fillText(item.desc, 110, currentY);
    ctx2.fillText(item.qty, 690, currentY);
    ctx2.fillText(item.rate, 820, currentY);
    ctx2.fillText(item.total, 980, currentY);
    currentY += 60;
  });

  // Total block
  ctx2.fillStyle = '#e2e8f0';
  ctx2.fillRect(720, currentY + 40, 400, 2);
  ctx2.fillStyle = '#0f172a';
  ctx2.font = 'bold 30px sans-serif';
  ctx2.fillText('Total Paid:', 740, currentY + 95);
  ctx2.fillStyle = '#2563eb';
  ctx2.fillText('$1,800.00', 940, currentY + 95);

  const sample2Data = c2.toDataURL('image/jpeg', 0.92);
  samples.push({
    id: 'sample_doc_2',
    name: '02_Official_Invoice_INV-2026.jpg',
    size: Math.round(sample2Data.length * 0.75),
    type: 'image/jpeg',
    dataUrl: sample2Data,
    width: 1200,
    height: 1600,
    rotation: 0,
  });

  return samples;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
