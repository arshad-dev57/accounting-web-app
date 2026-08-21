// lib/pdf-service.ts - Reusable PDF Service for Frontend

import {
  generatePDF,
  savePDF,
  generatePDFBlob,
  generatePDFAsync,
  generatePDFBlobAsync,
  savePDFAsync,
  PDFGeneratorData,
} from './pdf-generator';

/**
 * PDF Service - Provides reusable methods for PDF generation and download
 * Can be used across all Next.js pages
 */

export class PDFService {
  /**
   * Get company info from localStorage
   * @returns Company information object
   */
  private static getCompanyInfo(): any {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const source = userProfile?.organizationName ? userProfile : user;
      const businessDetails = source?.businessDetails || {};
      return {
        name: source?.organizationName || 'Your Company Name',
        address: source?.address || '',
        phone: source?.contactNo || source?.phone || '',
        email: source?.email || '',
        logo: businessDetails.logo || ''
      };
    } catch (error) {
      console.error('Failed to get company info:', error);
      return {
        name: 'Your Company Name',
        address: '',
        phone: '',
        email: '',
        logo: ''
      };
    }
  }

  /**
   * Generate and download PDF (applies PDF report branding)
   */
  static async downloadPDF(data: PDFGeneratorData, filename?: string): Promise<void> {
    try {
      await savePDFAsync(data, filename);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate PDF as blob (applies PDF report branding)
   */
  static async generatePDFBlob(data: PDFGeneratorData): Promise<Blob> {
    try {
      return await generatePDFBlobAsync(data);
    } catch (error) {
      console.error('Failed to generate PDF blob:', error);
      throw new Error('Failed to generate PDF blob');
    }
  }

  /**
   * Generate PDF as jsPDF document (applies PDF report branding)
   */
  static async generatePDFDocument(data: PDFGeneratorData): Promise<any> {
    try {
      return await generatePDFAsync(data);
    } catch (error) {
      console.error('Failed to generate PDF document:', error);
      throw new Error('Failed to generate PDF document');
    }
  }

  /** Sync fallback without branding reload (when branding already on data). */
  static downloadPDFSync(data: PDFGeneratorData, filename?: string): void {
    savePDF(data, filename);
  }

  static generatePDFBlobSync(data: PDFGeneratorData): Blob {
    return generatePDFBlob(data);
  }

  static generatePDFDocumentSync(data: PDFGeneratorData): any {
    return generatePDF(data);
  }

  static async downloadPurchaseOrderPDF(orderData: any, companyInfo?: any, filename?: string): Promise<void> {
    const { createPurchaseOrderPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createPurchaseOrderPDFData(orderData, finalCompanyInfo);
    await this.downloadPDF(pdfData, filename);
  }

  static async downloadInvoicePDF(invoiceData: any, companyInfo?: any, filename?: string): Promise<void> {
    const { createInvoicePDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createInvoicePDFData(invoiceData, finalCompanyInfo);
    await this.downloadPDF(pdfData, filename);
  }

  static async downloadGoodsReceivingPDF(grnData: any, companyInfo?: any, filename?: string): Promise<void> {
    const { createGoodsReceivingPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createGoodsReceivingPDFData(grnData, finalCompanyInfo);
    await this.downloadPDF(pdfData, filename);
  }

  static async generatePurchaseOrderPDFBlob(orderData: any, companyInfo?: any): Promise<Blob> {
    const { createPurchaseOrderPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createPurchaseOrderPDFData(orderData, finalCompanyInfo);
    return this.generatePDFBlob(pdfData);
  }

  static async generateInvoicePDFBlob(invoiceData: any, companyInfo?: any): Promise<Blob> {
    const { createInvoicePDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createInvoicePDFData(invoiceData, finalCompanyInfo);
    return this.generatePDFBlob(pdfData);
  }

  static async generateGoodsReceivingPDFBlob(grnData: any, companyInfo?: any): Promise<Blob> {
    const { createGoodsReceivingPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createGoodsReceivingPDFData(grnData, finalCompanyInfo);
    return this.generatePDFBlob(pdfData);
  }

  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default PDFService;
