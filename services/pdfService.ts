import { jsPDF } from "jspdf";
import { SvgFile, PdfQuality } from "../types";

interface QualitySettings {
  scale: number;
  quality: number; // JPEG quality 0-1
}

const QUALITY_CONFIG: Record<PdfQuality, QualitySettings> = {
  low: { scale: 1.0, quality: 0.6 },     // ~72 DPI, High compression
  medium: { scale: 2.0, quality: 0.75 }, // ~144 DPI, Balanced
  high: { scale: 4.0, quality: 0.85 },   // ~288 DPI, High quality
};

// Helper to convert an image URL (SVG blob) to a JPEG Data URI via Canvas
const convertSvgToImage = (
  url: string, 
  settings: QualitySettings
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      
      // Base A4 size reference (approximate 72 DPI points)
      // width: 595px, height: 842px
      // We scale this base resolution by the quality factor
      
      // Determine aspect ratio of the input image
      // If image has no intrinsic size, assume A4 portrait
      const imgW = img.width || 595;
      const imgH = img.height || 842;
      
      // Target resolution based on A4 pixel density
      // We essentially want to map the SVG to an A4 canvas at specific DPI
      const targetBaseWidth = 595; 
      
      // Calculate the scale needed to make the image fit within the target resolution
      // We use the configured 'scale' multiplier against standard screen DPI
      const resolutionScale = settings.scale;
      
      const width = imgW;
      const height = imgH;
      
      // Set canvas size
      canvas.width = width * resolutionScale;
      canvas.height = height * resolutionScale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Fill background with white (JPEG doesn't support transparency)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.scale(resolutionScale, resolutionScale);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use JPEG for significantly better compression than PNG for full-page images
      const dataUrl = canvas.toDataURL("image/jpeg", settings.quality);
      resolve({ dataUrl, width: canvas.width, height: canvas.height });
    };

    img.onerror = (e) => reject(e);
  });
};

export const generatePdfFromSvgs = async (
  files: SvgFile[], 
  quality: PdfQuality = 'medium',
  filename: string = 'merged-vectors',
  onProgress?: (percent: number) => void
): Promise<void> => {
  if (files.length === 0) return;

  const settings = QUALITY_CONFIG[quality];

  // Initialize jsPDF (Default A4: 210mm x 297mm)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Add new page for subsequent images
    if (i > 0) {
      pdf.addPage();
    }

    try {
      const { dataUrl, width, height } = await convertSvgToImage(file.url, settings);
      
      // Calculate scaling to fit the PDF page while maintaining aspect ratio
      const ratio = width / height;
      
      let finalWidth = pageWidth;
      let finalHeight = pageWidth / ratio;

      // If height is too tall for the page, scale by height instead
      if (finalHeight > pageHeight) {
        finalHeight = pageHeight;
        finalWidth = finalHeight * ratio;
      }

      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      pdf.addImage(dataUrl, "JPEG", x, y, finalWidth, finalHeight);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      pdf.text(`Error loading image: ${file.name}`, 10, 10);
    }

    // Report progress
    if (onProgress) {
      const percent = Math.round(((i + 1) / files.length) * 100);
      onProgress(percent);
      // Small delay to allow UI to render the progress update
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Ensure filename ends in .pdf
  const cleanFilename = filename.trim() || 'merged-vectors';
  const finalFilename = cleanFilename.toLowerCase().endsWith('.pdf') 
    ? cleanFilename 
    : `${cleanFilename}.pdf`;

  pdf.save(finalFilename);
};

export const getPdfSizeEstimate = (count: number, quality: PdfQuality): string => {
  if (count === 0) return "0 MB";

  // Rough estimation logic based on A4 coverage with JPEG compression
  // Low: ~150KB per page
  // Medium: ~400KB per page
  // High: ~1.2MB per page
  const sizeMap: Record<PdfQuality, number> = {
    low: 0.15,
    medium: 0.4,
    high: 1.2
  };

  const estimatedTotalMB = count * sizeMap[quality];
  
  if (estimatedTotalMB < 1) {
    return `~${(estimatedTotalMB * 1000).toFixed(0)} KB`;
  }
  return `~${estimatedTotalMB.toFixed(1)} MB`;
};