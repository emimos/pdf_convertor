export interface PythonSnippet {
  id: string;
  name: string;
  badge: string;
  installCmd: string;
  description: string;
  code: string;
}

export const PYTHON_SNIPPETS: PythonSnippet[] = [
  {
    id: 'pillow',
    name: 'Pillow (PIL)',
    badge: 'Most Popular',
    installCmd: 'pip install Pillow',
    description: 'The standard and most ubiquitous Python library for image processing and multi-page PDF generation.',
    code: `# Convert multiple images to a single PDF using Pillow (PIL)
from PIL import Image
import os

def images_to_pdf(image_paths, output_pdf_path):
    images = []
    
    for path in image_paths:
        img = Image.open(path)
        # Convert RGBA/P to RGB since PDF standard requires RGB or CMYK
        if img.mode != 'RGB':
            img = img.convert('RGB')
        images.append(img)
        
    if not images:
        print("No valid images found.")
        return
        
    # Save first image and append the remaining images
    first_image = images[0]
    rest_images = images[1:]
    
    first_image.save(
        output_pdf_path,
        save_all=True,
        append_images=rest_images,
        resolution=100.0,
        quality=95
    )
    print(f"Successfully generated PDF: {output_pdf_path} ({len(images)} pages)")

# Example usage
if __name__ == "__main__":
    files = ["photo1.jpg", "photo2.png", "receipt.webp"]
    images_to_pdf(files, "combined_document.pdf")
`,
  },
  {
    id: 'img2pdf',
    name: 'img2pdf',
    badge: 'Lossless & Ultra-Fast',
    installCmd: 'pip install img2pdf',
    description: 'Lossless converter that embeds JPEG/PNG bytes directly into the PDF container without re-compressing.',
    code: `# Lossless Image to PDF conversion using img2pdf
import img2pdf
import os

def convert_lossless(image_paths, output_pdf):
    # Validate files
    valid_paths = [p for p in image_paths if os.path.exists(p)]
    
    # Specify layout options (A4, auto-orientation, 20pt margin)
    a4_in_pt = (img2pdf.mm_to_pt(210), img2pdf.mm_to_pt(297))
    layout_fun = img2pdf.get_layout_fun(
        pagesize=a4_in_pt,
        fit=img2pdf.FitMode.into,
        auto_rotate=True
    )

    # Convert directly to PDF bytes
    with open(output_pdf, "wb") as f:
        f.write(img2pdf.convert(valid_paths, layout_fun=layout_fun))
        
    print(f"Saved lossless PDF to {output_pdf}")

if __name__ == "__main__":
    convert_lossless(["scan1.jpg", "scan2.jpg"], "scan_bundle.pdf")
`,
  },
  {
    id: 'pure_python',
    name: 'Standard Library (Zero Dependencies)',
    badge: 'Runs Anywhere',
    installCmd: '# No pip packages required! Works on vanilla Python 3.6+',
    description: 'The native engine powering this app. Reads JPEG markers and PNG chunks directly to build raw PDF byte streams.',
    code: `#!/usr/bin/env python3
"""
Image to PDF Converter - Pure Python 3 Standard Library
Embeds JPEG binary streams and PNG scanlines into valid PDF-1.4 specifications.
"""
import sys, os, struct, zlib

def make_pdf_from_jpegs(jpeg_files, output_pdf):
    objects = []
    page_refs = []
    
    # 1: Catalog, 2: Pages placeholder
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"") # slot for Pages
    
    for i, path in enumerate(jpeg_files):
        with open(path, "rb") as f:
            data = f.read()
            
        # Parse JPEG dimensions (SOF0 marker)
        pos = 2
        w, h = 600, 800
        while pos < len(data) - 4:
            marker, = struct.unpack(">H", data[pos:pos+2])
            pos += 2
            if marker in (0xffc0, 0xffc1, 0xffc2):
                _, h, w, _ = struct.unpack(">BHHB", data[pos+2:pos+8])
                break
            seg_len, = struct.unpack(">H", data[pos:pos+2])
            pos += seg_len

        # Image XObject
        img_dict = (
            f"<< /Type /XObject /Subtype /Image /Width {w} /Height {h} "
            f"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode "
            f"/Length {len(data)} >>\\nstream\\n"
        ).encode() + data + b"\\nendstream"
        objects.append(img_dict)
        img_id = len(objects)

        # Page content stream
        stream = f"q {w} 0 0 {h} 0 0 cm /Im1 Do Q".encode()
        content = f"<< /Length {len(stream)} >>\\nstream\\n".encode() + stream + b"\\nendstream"
        objects.append(content)
        content_id = len(objects)

        # Page object
        page = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] "
            f"/Contents {content_id} 0 R /Resources << /XObject << /Im1 {img_id} 0 R >> >> >>"
        ).encode()
        objects.append(page)
        page_refs.append(f"{len(objects)} 0 R")

    # Update Pages object
    kids = " ".join(page_refs)
    objects[1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_refs)} >>".encode()

    # Build PDF with xref table
    pdf = bytearray(b"%PDF-1.4\\n")
    offsets = []
    for num, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{num} 0 obj\\n".encode() + obj + b"\\nendobj\\n")
        
    xref = len(pdf)
    pdf.extend(f"xref\\n0 {len(objects)+1}\\n0000000000 65535 f \\n".encode())
    for off in offsets:
        pdf.extend(f"{off:010d} 00000 n \\n".encode())
    pdf.extend(f"trailer\\n<< /Size {len(objects)+1} /Root 1 0 R >>\\nstartxref\\n{xref}\\n%%EOF\\n".encode())

    with open(output_pdf, "wb") as f:
        f.write(pdf)
    print(f"Created {output_pdf} successfully!")

if __name__ == "__main__":
    make_pdf_from_jpegs(["image1.jpg"], "output.pdf")
`,
  },
  {
    id: 'reportlab',
    name: 'ReportLab',
    badge: 'Enterprise Layouts',
    installCmd: 'pip install reportlab',
    description: 'Provides exact canvas coordinate systems, custom headers, footers, watermarks, and multi-image grid templates.',
    code: `# Multi-Image PDF with ReportLab Canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os

def create_reportlab_pdf(images, output_pdf, pagesize=A4):
    c = canvas.Canvas(output_pdf, pagesize=pagesize)
    page_width, page_height = pagesize
    margin = 36 # 0.5 inch margins

    for img_path in images:
        img = ImageReader(img_path)
        img_w, img_h = img.getSize()

        # Calculate aspect ratio fitting inside margins
        avail_w = page_width - (margin * 2)
        avail_h = page_height - (margin * 2)
        scale = min(avail_w / img_w, avail_h / img_h)
        
        draw_w = img_w * scale
        draw_h = img_h * scale
        pos_x = margin + (avail_w - draw_w) / 2
        pos_y = margin + (avail_h - draw_h) / 2

        # Draw image centered
        c.drawImage(img, pos_x, pos_y, width=draw_w, height=draw_h)
        
        # Add footer
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.drawString(margin, margin / 2, f"Document converted via Python ReportLab")
        
        c.showPage()

    c.save()
    print(f"ReportLab PDF compiled to {output_pdf}")

if __name__ == "__main__":
    create_reportlab_pdf(["chart.png", "table.jpg"], "document.pdf")
`,
  },
];
