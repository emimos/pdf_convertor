#!/usr/bin/env python3
"""
High-Performance Image to PDF Converter in Pure Python 3.
Zero external dependencies required - runs with standard library.
Supports JPEG, PNG, multi-page layout, margins, orientations, and transparency.
"""

import sys
import os
import json
import struct
import zlib
import time
from datetime import datetime

# Standard page sizes in points (72 points = 1 inch)
PAGE_SIZES = {
    "A4": (595.28, 841.89),
    "Letter": (612.0, 792.0),
    "Legal": (612.0, 1008.0),
    "A3": (841.89, 1190.55),
    "A5": (419.53, 595.28),
    "Tabloid": (792.0, 1224.0),
}

def parse_jpeg_info(data):
    """Parse JPEG width, height, and color channels without third-party libraries."""
    if len(data) < 2 or data[0:2] != b'\xff\xd8':
        return None
    i = 2
    length = len(data)
    while i < length:
        if data[i] != 0xff:
            i += 1
            continue
        marker = data[i+1]
        i += 2
        # Markers without payload
        if marker in (0xd8, 0xd9, 0x00) or (0xd0 <= marker <= 0xd7):
            continue
        if i + 2 > length:
            break
        seg_len, = struct.unpack('>H', data[i:i+2])
        # SOF markers: SOF0 (0xc0), SOF1 (0xc1), SOF2 (0xc2)
        if marker in (0xc0, 0xc1, 0xc2):
            if i + 8 <= length:
                bits, height, width, channels = struct.unpack('>BHHB', data[i+2:i+8])
                return {
                    "width": width,
                    "height": height,
                    "channels": channels,
                    "type": "jpeg",
                    "data": data,
                    "color_space": "/DeviceGray" if channels == 1 else "/DeviceRGB"
                }
        i += seg_len
    return None

def paeth_predictor(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    elif pb <= pc:
        return b
    else:
        return c

def parse_png_info(data):
    """Parse PNG format and unfilter scanlines into raw RGB or RGBA."""
    if len(data) < 8 or data[0:8] != b'\x89PNG\r\n\x1a\n':
        return None
    
    i = 8
    length = len(data)
    idat_chunks = []
    palette = None
    width = height = bit_depth = color_type = None

    while i + 8 <= length:
        chunk_len, = struct.unpack('>I', data[i:i+4])
        chunk_type = data[i+4:i+8]
        chunk_data = data[i+8:i+8+chunk_len]
        i += 12 + chunk_len

        if chunk_type == b'IHDR':
            width, height, bit_depth, color_type = struct.unpack('>IIBB', chunk_data[0:10])
        elif chunk_type == b'PLTE':
            palette = chunk_data
        elif chunk_type == b'IDAT':
            idat_chunks.append(chunk_data)
        elif chunk_type == b'IEND':
            break

    if not width or not height or not idat_chunks:
        return None

    # Decompress scanlines
    try:
        raw_idat = zlib.decompress(b''.join(idat_chunks))
    except Exception:
        return None

    # Bytes per pixel
    bpp_map = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
    bpp = bpp_map.get(color_type, 3)

    stride = width * bpp
    expected_len = height * (1 + stride)
    if len(raw_idat) < expected_len:
        return None

    # Unfilter PNG lines
    unfiltered = bytearray(height * stride)
    prev_line = bytearray(stride)
    src_pos = 0

    for y in range(height):
        filter_type = raw_idat[src_pos]
        src_pos += 1
        curr_line = bytearray(raw_idat[src_pos:src_pos + stride])
        src_pos += stride

        out_line = bytearray(stride)
        for x in range(stride):
            curr_byte = curr_line[x]
            left = out_line[x - bpp] if x >= bpp else 0
            up = prev_line[x]
            up_left = prev_line[x - bpp] if x >= bpp else 0

            if filter_type == 0:    # None
                val = curr_byte
            elif filter_type == 1:  # Sub
                val = (curr_byte + left) & 0xff
            elif filter_type == 2:  # Up
                val = (curr_byte + up) & 0xff
            elif filter_type == 3:  # Average
                val = (curr_byte + ((left + up) // 2)) & 0xff
            elif filter_type == 4:  # Paeth
                val = (curr_byte + paeth_predictor(left, up, up_left)) & 0xff
            else:
                val = curr_byte
            out_line[x] = val

        unfiltered[y * stride:(y + 1) * stride] = out_line
        prev_line = out_line

    # Split RGB and Alpha if RGBA (type 6)
    if color_type == 6: # RGBA
        rgb_data = bytearray(width * height * 3)
        alpha_data = bytearray(width * height)
        for p in range(width * height):
            rgb_data[p*3] = unfiltered[p*4]
            rgb_data[p*3+1] = unfiltered[p*4+1]
            rgb_data[p*3+2] = unfiltered[p*4+2]
            alpha_data[p] = unfiltered[p*4+3]
        return {
            "width": width,
            "height": height,
            "channels": 3,
            "type": "png",
            "rgb_compressed": zlib.compress(bytes(rgb_data), level=7),
            "alpha_compressed": zlib.compress(bytes(alpha_data), level=7),
            "has_alpha": True,
            "color_space": "/DeviceRGB"
        }
    elif color_type == 2: # RGB
        return {
            "width": width,
            "height": height,
            "channels": 3,
            "type": "png",
            "rgb_compressed": zlib.compress(bytes(unfiltered), level=7),
            "has_alpha": False,
            "color_space": "/DeviceRGB"
        }
    elif color_type == 3 and palette: # Indexed palette
        rgb_data = bytearray(width * height * 3)
        for p in range(width * height):
            idx = unfiltered[p]
            pal_pos = idx * 3
            if pal_pos + 2 < len(palette):
                rgb_data[p*3] = palette[pal_pos]
                rgb_data[p*3+1] = palette[pal_pos+1]
                rgb_data[p*3+2] = palette[pal_pos+2]
        return {
            "width": width,
            "height": height,
            "channels": 3,
            "type": "png",
            "rgb_compressed": zlib.compress(bytes(rgb_data), level=7),
            "has_alpha": False,
            "color_space": "/DeviceRGB"
        }
    elif color_type == 0: # Grayscale
        return {
            "width": width,
            "height": height,
            "channels": 1,
            "type": "png",
            "rgb_compressed": zlib.compress(bytes(unfiltered), level=7),
            "has_alpha": False,
            "color_space": "/DeviceGray"
        }
    return None

class PDFBuilder:
    def __init__(self, title="Document", author="Python Converter"):
        self.objects = []
        self.title = title
        self.author = author

    def add_object(self, content_bytes):
        self.objects.append(content_bytes)
        return len(self.objects)

    def build_bytes(self):
        pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = []
        for i, obj in enumerate(self.objects, start=1):
            offsets.append(len(pdf))
            pdf.extend(f"{i} 0 obj\n".encode())
            pdf.extend(obj)
            pdf.extend(b"\nendobj\n")

        xref_pos = len(pdf)
        pdf.extend(f"xref\n0 {len(self.objects) + 1}\n".encode())
        pdf.extend(b"0000000000 65535 f \n")
        for off in offsets:
            pdf.extend(f"{off:010d} 00000 n \n".encode())

        pdf.extend(f"trailer\n<< /Size {len(self.objects) + 1} /Root 1 0 R >>\n".encode())
        pdf.extend(f"startxref\n{xref_pos}\n%%EOF\n".encode())
        return bytes(pdf)

def convert_images_to_pdf(config):
    start_time = time.time()
    images_info = []
    
    # Process each input image
    for item in config.get("pages", []):
        file_path = item.get("path")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Input file not found: {file_path}")
        
        with open(file_path, "rb") as f:
            data = f.read()

        info = parse_jpeg_info(data)
        if not info:
            info = parse_png_info(data)
        if not info:
            raise ValueError(f"Unsupported or corrupted image format in {file_path}. Must be valid JPEG or PNG.")

        info["name"] = item.get("name", os.path.basename(file_path))
        info["rotation"] = item.get("rotation", 0)
        images_info.append(info)

    if not images_info:
        raise ValueError("No images provided for conversion.")

    builder = PDFBuilder(
        title=config.get("title", "Converted Images"),
        author=config.get("author", "Python Image-to-PDF Converter")
    )

    page_size_pref = config.get("pageSize", "A4")
    orientation_pref = config.get("orientation", "auto") # auto, portrait, landscape
    margin = float(config.get("margin", 20))
    fit_mode = config.get("fit", "contain") # contain, fill, stretch
    show_page_numbers = config.get("pageNumbers", False)

    # Object 1: Catalog
    # Object 2: Pages
    # Object 3: Font (Helvetica)
    builder.add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
    pages_obj_idx = builder.add_object(b"") # Placeholder for Pages obj
    font_obj_num = builder.add_object(
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
    )

    page_obj_nums = []
    total_pages = len(images_info)

    for idx, img in enumerate(images_info, start=1):
        orig_w = img["width"]
        orig_h = img["height"]

        # Determine dimensions considering rotation (90, 270 swap w and h)
        is_rotated_90_or_270 = img["rotation"] in (90, 270)
        eff_img_w = orig_h if is_rotated_90_or_270 else orig_w
        eff_img_h = orig_w if is_rotated_90_or_270 else orig_h

        # Page Dimensions
        if page_size_pref == "Fit":
            page_w = float(eff_img_w + margin * 2)
            page_h = float(eff_img_h + margin * 2)
        else:
            base_w, base_h = PAGE_SIZES.get(page_size_pref, PAGE_SIZES["A4"])
            if orientation_pref == "portrait":
                page_w, page_h = min(base_w, base_h), max(base_w, base_h)
            elif orientation_pref == "landscape":
                page_w, page_h = max(base_w, base_h), min(base_w, base_h)
            else: # auto
                if eff_img_w > eff_img_h:
                    page_w, page_h = max(base_w, base_h), min(base_w, base_h)
                else:
                    page_w, page_h = min(base_w, base_h), max(base_w, base_h)

        # Usable canvas inside margins
        usable_w = max(10.0, page_w - (margin * 2))
        usable_h = max(10.0, page_h - (margin * 2) - (15.0 if show_page_numbers else 0))

        # Calculate final image placement and size
        if fit_mode == "stretch":
            draw_w = usable_w
            draw_h = usable_h
        elif fit_mode == "fill":
            scale = max(usable_w / eff_img_w, usable_h / eff_img_h)
            draw_w = eff_img_w * scale
            draw_h = eff_img_h * scale
        else: # contain
            scale = min(usable_w / eff_img_w, usable_h / eff_img_h)
            draw_w = eff_img_w * scale
            draw_h = eff_img_h * scale

        pos_x = margin + (usable_w - draw_w) / 2.0
        pos_y = margin + (15.0 if show_page_numbers else 0) + (usable_h - draw_h) / 2.0

        # Handle Transparency Mask for PNG
        smask_ref = ""
        if img["type"] == "png" and img.get("has_alpha"):
            smask_stream = img["alpha_compressed"]
            smask_dict = (
                f"<< /Type /XObject /Subtype /Image /Width {orig_w} /Height {orig_h} "
                f"/ColorSpace /DeviceGray /BitsPerComponent 8 "
                f"/Filter /FlateDecode /Length {len(smask_stream)} >>\nstream\n"
            ).encode() + smask_stream + b"\nendstream"
            smask_obj_num = builder.add_object(smask_dict)
            smask_ref = f"/SMask {smask_obj_num} 0 R "

        # Create Image XObject
        if img["type"] == "jpeg":
            img_stream = img["data"]
            filter_str = "/Filter /DCTDecode "
        else:
            img_stream = img["rgb_compressed"]
            filter_str = "/Filter /FlateDecode "

        img_xobject = (
            f"<< /Type /XObject /Subtype /Image /Width {orig_w} /Height {orig_h} "
            f"/ColorSpace {img['color_space']} /BitsPerComponent 8 {filter_str}{smask_ref}"
            f"/Length {len(img_stream)} >>\nstream\n"
        ).encode() + img_stream + b"\nendstream"
        img_obj_num = builder.add_object(img_xobject)

        # Page Content Stream
        # Handle rotation matrix if rotated
        rot = img["rotation"]
        content_cmds = "q\n"
        
        if rot == 90:
            # Rotated 90 deg clockwise:
            # Translation to top-left of image box, then rotate -90 deg
            content_cmds += f"{draw_w:.2f} 0 0 {draw_h:.2f} {pos_x:.2f} {pos_y:.2f} cm\n"
            content_cmds += "0 1 -1 0 1 0 cm\n"
            content_cmds += "/Im1 Do\nQ\n"
        elif rot == 180:
            content_cmds += f"{draw_w:.2f} 0 0 {draw_h:.2f} {pos_x:.2f} {pos_y:.2f} cm\n"
            content_cmds += "-1 0 0 -1 1 1 cm\n"
            content_cmds += "/Im1 Do\nQ\n"
        elif rot == 270:
            content_cmds += f"{draw_w:.2f} 0 0 {draw_h:.2f} {pos_x:.2f} {pos_y:.2f} cm\n"
            content_cmds += "0 -1 1 0 0 1 cm\n"
            content_cmds += "/Im1 Do\nQ\n"
        else:
            # 0 deg
            content_cmds += f"{draw_w:.2f} 0 0 {draw_h:.2f} {pos_x:.2f} {pos_y:.2f} cm\n"
            content_cmds += "/Im1 Do\nQ\n"

        # Footer page number
        if show_page_numbers:
            p_text = f"Page {idx} of {total_pages}"
            text_x = page_w / 2.0 - (len(p_text) * 2.2)
            content_cmds += f"BT /F1 9 Tf 0.4 0.4 0.4 rg {text_x:.2f} {margin / 2.0 + 2:.2f} Td ({p_text}) Tj ET\n"

        content_bytes = content_cmds.encode("latin-1")
        content_obj = (
            f"<< /Length {len(content_bytes)} >>\nstream\n".encode() +
            content_bytes +
            b"\nendstream"
        )
        content_obj_num = builder.add_object(content_obj)

        # Page Object
        page_dict = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_w:.2f} {page_h:.2f}] "
            f"/Contents {content_obj_num} 0 R "
            f"/Resources << /ProcSet [/PDF /Text /ImageC] "
            f"/Font << /F1 {font_obj_num} 0 R >> "
            f"/XObject << /Im1 {img_obj_num} 0 R >> >> >>"
        ).encode()
        page_obj_num = builder.add_object(page_dict)
        page_obj_nums.append(page_obj_num)

    # Update Pages Object (index 1, object number 2)
    kids_str = " ".join([f"{n} 0 R" for n in page_obj_nums])
    pages_dict = f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_obj_nums)} >>".encode()
    builder.objects[pages_obj_idx - 1] = pages_dict

    pdf_bytes = builder.build_bytes()

    output_path = config.get("output", "output.pdf")
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    return {
        "success": True,
        "output": output_path,
        "sizeBytes": len(pdf_bytes),
        "pageCount": len(page_obj_nums),
        "durationMs": elapsed_ms,
        "engine": "Python 3.10 standard library",
        "pageSize": page_size_pref,
        "orientation": orientation_pref
    }

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--config":
        with open(sys.argv[2], "r") as cf:
            cfg = json.load(cf)
        res = convert_images_to_pdf(cfg)
        print(json.dumps(res))
    else:
        print("Usage: python3 converter.py --config config.json")
