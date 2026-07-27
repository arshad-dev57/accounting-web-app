// lib/pdf-service.ts - Reusable PDF Service for Frontend

import { generatePDF, savePDF, generatePDFBlob, PDFGeneratorData } from './pdf-generator';

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
      const businessDetails = userProfile?.businessDetails || {};
      return {
        name: userProfile?.organizationName || 'Your Company Name',
        address: userProfile?.address || '',
        phone: userProfile?.contactNo || userProfile?.phone || '',
        email: userProfile?.email || '',
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
   * Generate and download PDF
   * @param data - PDF data object
   * @param filename - Optional custom filename
   */
  static downloadPDF(data: PDFGeneratorData, filename?: string): void {
    try {
      savePDF(data, filename);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate PDF as blob (for email attachments or preview)
   * @param data - PDF data object
   * @returns PDF blob
   */
  static generatePDFBlob(data: PDFGeneratorData): Blob {
    try {
      return generatePDFBlob(data);
    } catch (error) {
      console.error('Failed to generate PDF blob:', error);
      throw new Error('Failed to generate PDF blob');
    }
  }

  /**
   * Generate PDF as jsPDF document (for custom operations)
   * @param data - PDF data object
   * @returns jsPDF document
   */
  static generatePDFDocument(data: PDFGeneratorData): any {
    try {
      return generatePDF(data);
    } catch (error) {
      console.error('Failed to generate PDF document:', error);
      throw new Error('Failed to generate PDF document');
    }
  }

  /**
   * Download purchase order PDF (auto-fetches company info)
   * @param orderData - Purchase order data
   * @param companyInfo - Optional company information (auto-fetched if not provided)
   * @param filename - Optional custom filename
   */
  static downloadPurchaseOrderPDF(orderData: any, companyInfo?: any, filename?: string): void {
    const { createPurchaseOrderPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createPurchaseOrderPDFData(orderData, finalCompanyInfo);
    this.downloadPDF(pdfData, filename);
  }

  /**
   * Download invoice PDF (auto-fetches company info)
   * @param invoiceData - Invoice data
   * @param companyInfo - Optional company information (auto-fetched if not provided)
   * @param filename - Optional custom filename
   */
  static downloadInvoicePDF(invoiceData: any, companyInfo?: any, filename?: string): void {
    const { createInvoicePDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createInvoicePDFData(invoiceData, finalCompanyInfo);
    this.downloadPDF(pdfData, filename);
  }

  /**
   * Download goods receiving PDF (auto-fetches company info)
   * @param grnData - Goods receiving data
   * @param companyInfo - Optional company information (auto-fetched if not provided)
   * @param filename - Optional custom filename
   */
  static downloadGoodsReceivingPDF(grnData: any, companyInfo?: any, filename?: string): void {
    const { createGoodsReceivingPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createGoodsReceivingPDFData(grnData, finalCompanyInfo);
    this.downloadPDF(pdfData, filename);
  }

  /**
   * Generate purchase order PDF blob for email attachment (auto-fetches company info)
   * @param orderData - Purchase order data
   * @param companyInfo - Optional company information (auto-fetched if not provided)
   * @returns PDF blob
   */
  static generatePurchaseOrderPDFBlob(orderData: any, companyInfo?: any): Blob {
    const { createPurchaseOrderPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createPurchaseOrderPDFData(orderData, finalCompanyInfo);
    return this.generatePDFBlob(pdfData);
  }

  /**
   * Generate invoice PDF blob for email attachment (auto-fetches company info)
   * @param invoiceData - Invoice data
   * @param companyInfo - Optional company information (auto-fetched if not provided)
   * @returns PDF blob
   */
  static generateInvoicePDFBlob(invoiceData: any, companyInfo?: any): Blob {
    const { createInvoicePDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createInvoicePDFData(invoiceData, finalCompanyInfo);
    return this.generatePDFBlob(pdfData);
  }

  /**
   * Generate goods receiving PDF blob for email attachment (auto-fetches company info)
   * @param grnData - Goods receiving data
   * @param companyInfo - Optional company information (auto-fetched if not provided)
   * @returns PDF blob
   */
  static generateGoodsReceivingPDFBlob(grnData: any, companyInfo?: any): Blob {
    const { createGoodsReceivingPDFData } = require('./pdf-generator');
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    const pdfData = createGoodsReceivingPDFData(grnData, finalCompanyInfo);
    return this.generatePDFBlob(pdfData);
  }

  /**
   * Convert blob to base64 (for sending to backend)
   * @param blob - PDF blob
   * @returns Base64 string
   */
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
