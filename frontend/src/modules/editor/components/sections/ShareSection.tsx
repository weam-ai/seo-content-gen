import React from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Download,
  Copy,
  FileText,
  FileDown,
  Globe,
} from 'lucide-react';
import useEditor from '../../hooks/useEditor';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { blocksToMarkdown, blocksToHTML } from '@/lib/blocknote.util';

// Role-related functions removed for single-user application

// Helper to export HTML as A4 PDF
async function exportHtmlToA4PDF(html: string, filename: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.width = '190mm'; // A4 width (210mm) - 2*10mm margin
  container.style.minHeight = '277mm'; // A4 height (297mm) - 2*10mm margin
  container.style.padding = '10mm'; // Equal padding on all sides
  container.style.background = '#fff';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.6';
  container.style.wordBreak = 'break-word';
  container.style.whiteSpace = 'pre-wrap';
  container.innerHTML = html;

  // Add robust styles
  const style = document.createElement('style');
  style.textContent = `
    h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
    h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
    h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
    h4 { font-size: 1em; font-weight: bold; margin: 1.12em 0; }
    h5 { font-size: 0.83em; font-weight: bold; margin: 1.5em 0; }
    h6 { font-size: 0.67em; font-weight: bold; margin: 1.67em 0; }
    p { margin: 0.5em 0; }
    ul, ol { margin: 0.5em 0 0.5em 2em; }
    li { margin: 0.2em 0; }
    pre, code { background: #f4f4f4; font-family: monospace; }
    blockquote { border-left: 4px solid #ccc; margin: 1em 0; padding: 0.5em 1em; color: #555; }
    * { box-sizing: border-box; }
  `;
  container.prepend(style);

  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fff',
    windowWidth: 794,
    windowHeight: 1123,
  });

  const imgProps = {
    width: canvas.width,
    height: canvas.height,
  };
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const pdfWidth = pageWidth - 2 * margin;
  const pdfHeight = pageHeight - 2 * margin;

  // Calculate the scale between px and mm
  const pxPerMm = imgProps.width / pdfWidth;
  const pageHeightPx = pdfHeight * pxPerMm;
  const bottomPaddingPx = margin * pxPerMm;

  let renderedHeight = 0;
  let pageNum = 0;

  while (renderedHeight < imgProps.height) {
    const isLastPage = renderedHeight + pageHeightPx >= imgProps.height;
    const sliceHeightPx = Math.min(
      pageHeightPx,
      imgProps.height - renderedHeight
    );
    // Create a temporary canvas for each page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgProps.width;
    pageCanvas.height = sliceHeightPx + bottomPaddingPx;
    const ctx: any = pageCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      renderedHeight,
      imgProps.width,
      sliceHeightPx,
      0,
      0,
      imgProps.width,
      sliceHeightPx
    );
    const pageImgData = pageCanvas.toDataURL('image/png');
    if (pageNum > 0) pdf.addPage();
    if (isLastPage) {
      // Draw at natural height for the last page (no vertical stretching)
      const lastPageHeightMm = sliceHeightPx / pxPerMm;
      pdf.addImage(
        pageImgData,
        'PNG',
        margin,
        margin,
        pdfWidth,
        lastPageHeightMm
      );
    } else {
      // Draw full page as before
      pdf.addImage(
        pageImgData,
        'PNG',
        margin,
        margin,
        pdfWidth,
        pdfHeight + margin
      );
    }
    renderedHeight += pageHeightPx;
    pageNum++;
  }

  pdf.save(filename);
  document.body.removeChild(container);
}

export const ShareSection: React.FC = () => {
  const { article, editorRef } = useEditor();

  // Helper to trigger file download
  const triggerDownload = (
    content: string | Blob,
    filename: string,
    type: string
  ) => {
    const blob =
      typeof content === 'string' ? new Blob([content], { type }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (format: string) => {
    if (!editorRef?.current) {
      toast({ title: 'Editor not ready' });
      return;
    }

    let content = '';
    let filename = article?.title || 'document';
    const blocks = editorRef.current.document;
    try {
      switch (format) {
        case 'PDF': {
          const html = blocksToHTML(blocks);
          await exportHtmlToA4PDF(html, `${filename}.pdf`);
          break;
        }
        case 'Word': {
          const html = blocksToHTML(blocks);
          const wordHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'></head><body>${html}</body></html>`;
          triggerDownload(wordHtml, `${filename}.doc`, 'application/msword');
          break;
        }
        case 'Markdown': {
          content = blocksToMarkdown(blocks);
          triggerDownload(content, `${filename}.md`, 'text/markdown');
          break;
        }
        case 'HTML': {
          content = blocksToHTML(blocks);
          triggerDownload(content, `${filename}.html`, 'text/html');
          break;
        }
        default:
          toast({ title: 'Unknown format' });
      }
      toast({
        title: 'Download started',
        description: `Downloading document as ${format.toUpperCase()}`,
      });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to download document' });
    }
  };

  const handleCopyContent = async (format: string) => {
    if (!editorRef?.current) {
      toast({ title: 'Editor not ready' });
      return;
    }
    try {
      let content = '';
      const blocks = editorRef.current.document;
      if (format === 'Markdown') {
        content = blocksToMarkdown(blocks);
        await navigator.clipboard.writeText(content);
      } else if (format === 'HTML') {
        content = blocksToHTML(blocks);
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': new Blob([content], { type: 'text/html' }),
            'text/plain': new Blob([content], { type: 'text/plain' }),
          }),
        ]);
      }
      toast({
        title: 'Content copied',
        description: `Document content copied as ${format}`,
      });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to copy content' });
    }
  };

  // Collaboration functions removed for single-user application

  return (
    <div className="p-3 space-y-4">
      {/* Download */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Download className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Download</span>
        </div>

        <div className="space-y-1">
          {[
            { format: 'PDF', icon: FileText },
            { format: 'Word', icon: FileText },
            { format: 'Markdown', icon: FileDown },
            { format: 'HTML', icon: Globe },
          ].map((item) => (
            <div
              key={item.format}
              className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleDownload(item.format)}
            >
              <item.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{item.format}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Copy className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">Copy</span>
        </div>

        <div className="space-y-1">
          {[{ format: 'Markdown' }, { format: 'HTML' }].map((item) => (
            <div
              key={item.format}
              className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleCopyContent(item.format)}
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{item.format}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Dialog removed for single-user app */}
    </div>
  );
};
