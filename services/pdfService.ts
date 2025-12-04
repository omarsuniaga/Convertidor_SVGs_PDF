import { PDFDocument, PageSizes } from 'pdf-lib';
import { AppFile, PdfQuality } from "../types";

interface QualitySettings {
  scale: number;
  quality: number; // JPEG quality 0-1
}

const QUALITY_CONFIG: Record<PdfQuality, QualitySettings> = {
  low: { scale: 1.0, quality: 0.6 },     // ~72 DPI, High compression
  medium: { scale: 2.0, quality: 0.75 }, // ~144 DPI, Balanced
  high: { scale: 3.0, quality: 0.85 },   // ~216 DPI, High quality
};

// Helper to convert an image URL (Blob) to a JPEG buffer via Canvas
// This normalizes resolution, handles transparency (white bg), and ensures standard format.
const processFileToImageBuffer = (
  url: string, 
  settings: QualitySettings
): Promise<{ buffer: Uint8Array; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      
      // Standardize to A4-ish proportions if no intrinsic size
      const imgW = img.width || 595;
      const imgH = img.height || 842;
      
      // Apply quality scaling
      const resolutionScale = settings.scale;
      
      canvas.width = imgW * resolutionScale;
      canvas.height = imgH * resolutionScale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Fill background with white (handles transparency in PNG/SVG)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.scale(resolutionScale, resolutionScale);
      
      ctx.drawImage(img, 0, 0, imgW, imgH);
      
      // Export as JPEG Data URL
      const dataUrl = canvas.toDataURL("image/jpeg", settings.quality);
      
      // Convert Data URL to Uint8Array for pdf-lib
      const base64 = dataUrl.split(',')[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      resolve({ buffer: bytes, width: canvas.width, height: canvas.height });
    };

    img.onerror = (e) => reject(e);
  });
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const generatePdfFromFiles = async (
  files: AppFile[], 
  quality: PdfQuality = 'medium',
  filename: string = 'merged-document',
  onProgress?: (percent: number) => void
): Promise<void> => {
  if (files.length === 0) return;

  const settings = QUALITY_CONFIG[quality];
  
  // Create a new PDF Document
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      if (isPdf) {
        // --- Handle PDF merging ---
        const fileBuffer = await readFileAsArrayBuffer(file.file);
        // Load the source PDF
        const srcPdf = await PDFDocument.load(fileBuffer);
        // Copy all pages from source PDF
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        // Add each copied page to the new document
        copiedPages.forEach((page) => mergedPdf.addPage(page));

      } else {
        // --- Handle Image (SVG, JPG, PNG) embedding ---
        // Process image to a standardized JPEG buffer (handles transparency, resolution)
        const { buffer, width, height } = await processFileToImageBuffer(file.url, settings);
        
        // Embed the JPEG into the document
        const imageEmbed = await mergedPdf.embedJpg(buffer);
        
        // Create a new A4 page
        const page = mergedPdf.addPage(PageSizes.A4); // A4 is [595.28, 841.89]
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Calculate dimensions to fit page while maintaining aspect ratio
        const imgDims = imageEmbed.scaleToFit(pageWidth, pageHeight);
        
        // Center the image
        const x = (pageWidth - imgDims.width) / 2;
        const y = (pageHeight - imgDims.height) / 2;

        // Draw the image
        page.drawImage(imageEmbed, {
          x,
          y,
          width: imgDims.width,
          height: imgDims.height,
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Create a blank page with error text if processing fails
      const page = mergedPdf.addPage(PageSizes.A4);
      page.drawText(`Error processing file: ${file.name}`, { x: 50, y: 700 });
    }

    // Report progress
    if (onProgress) {
      const percent = Math.round(((i + 1) / files.length) * 100);
      onProgress(percent);
      // Yield to UI
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Save the PDF
  const pdfBytes = await mergedPdf.save();
  
  // Trigger download
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  
  // Ensure filename ends in .pdf
  const cleanFilename = filename.trim() || 'merged-document';
  const finalFilename = cleanFilename.toLowerCase().endsWith('.pdf') 
    ? cleanFilename 
    : `${cleanFilename}.pdf`;
    
  link.download = finalFilename;
  link.click();
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

export const getPdfSizeEstimate = (count: number, quality: PdfQuality): string => {
  if (count === 0) return "0 MB";

  // Rough estimation logic
  // PDFs are hard to estimate because they vary wildly. We assume a base size + image estimation.
  // Images: Low ~150KB, Med ~400KB, High ~1.2MB
  const sizeMap: Record<PdfQuality, number> = {
    low: 0.15,
    medium: 0.4,
    high: 1.2
  };

  // We'll use the image estimate as a baseline for "pages"
  const estimatedTotalMB = count * sizeMap[quality];
  
  if (estimatedTotalMB < 1) {
    return `~${(estimatedTotalMB * 1000).toFixed(0)} KB`;
  }
  return `~${estimatedTotalMB.toFixed(1)} MB`;
};