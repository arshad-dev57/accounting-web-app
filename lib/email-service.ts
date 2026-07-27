// lib/email-service.ts - Reusable Email Service for Frontend

/**
 * Email Service - Provides reusable methods for sending emails from Next.js pages
 * Can be used across all Next.js pages
 */

export interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
}

export interface DocumentEmailData {
  documentType: 'Purchase Order' | 'Invoice' | 'Quotation' | 'Receipt' | 'Sales Order';
  documentNumber: string;
  recipientEmail: string;
  recipientName: string;
  documentData: any;
  pdfBlob?: Blob;
  companyInfo?: {
    name: string;
    email?: string;
    phone?: string;
    logo?: string;
  };
}

export class EmailService {
  private static apiBase = '/api/email';

  /**
   * Get company info from localStorage
   * @returns Company information object
   */
  private static getCompanyInfo(): any {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      return {
        name: userProfile?.organizationName || 'Your Company Name',
        email: userProfile?.email || '',
        phone: userProfile?.contactNo || userProfile?.phone || ''
      };
    } catch (error) {
      console.error('Failed to get company info:', error);
      return {
        name: 'Your Company Name',
        email: '',
        phone: ''
      };
    }
  }

  /**
   * Send raw email
   * @param data - Email data
   * @returns Promise with response
   */
  static async sendEmail(data: EmailData): Promise<any> {
    try {
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send document email with PDF attachment
   * @param data - Document email data
   * @returns Promise with response
   */
  static async sendDocumentEmail(data: DocumentEmailData): Promise<any> {
    try {
      // Validate required fields
      if (!data.recipientEmail) {
        throw new Error('Recipient email is required');
      }

      let attachments: EmailAttachment[] = [];

      // If PDF blob is provided, convert to base64 and attach
      if (data.pdfBlob) {
        const base64 = await this.blobToBase64(data.pdfBlob);
        attachments.push({
          filename: `${data.documentType.replace(/\s+/g, '_')}_${data.documentNumber}.pdf`,
          content: base64,
          contentType: 'application/pdf'
        });
      }

      const emailData: EmailData = {
        to: data.recipientEmail,
        subject: `${data.documentType} ${data.documentNumber}`,
        html: this.generateDocumentEmailHTML(data),
        attachments
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send document email:', error);
      throw error;
    }
  }

  /**
   * Send purchase order email
   * @param orderData - Purchase order data
   * @param pdfBlob - PDF blob (optional)
   * @param companyInfo - Company information (optional)
   * @returns Promise with response
   */
  static async sendPurchaseOrderEmail(
    orderData: any,
    pdfBlob?: Blob,
    companyInfo?: any
  ): Promise<any> {
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    return await this.sendDocumentEmail({
      documentType: 'Purchase Order',
      documentNumber: orderData.orderNumber || orderData.grnNumber,
      recipientEmail: orderData.supplierEmail,
      recipientName: orderData.supplierName,
      documentData: orderData,
      pdfBlob,
      companyInfo: finalCompanyInfo
    });
  }

  /**
   * Send invoice email (handles both sales and purchase invoices)
   * @param invoiceData - Invoice data
   * @param pdfBlob - PDF blob (optional)
   * @param companyInfo - Company information (optional)
   * @returns Promise with response
   */
  static async sendInvoiceEmail(
    invoiceData: any,
    pdfBlob?: Blob,
    companyInfo?: any
  ): Promise<any> {
    const finalCompanyInfo = companyInfo || this.getCompanyInfo();
    return await this.sendDocumentEmail({
      documentType: 'Invoice',
      documentNumber: invoiceData.invoiceNumber,
      recipientEmail: invoiceData.customerEmail || invoiceData.supplierEmail,
      recipientName: invoiceData.customerName || invoiceData.supplierName,
      documentData: invoiceData,
      pdfBlob,
      companyInfo: finalCompanyInfo
    });
  }

  /**
   * Send quotation email
   * @param quotationData - Quotation data
   * @param pdfBlob - PDF blob (optional)
   * @param companyInfo - Company information (optional)
   * @returns Promise with response
   */
  static async sendQuotationEmail(
    quotationData: any,
    pdfBlob?: Blob,
    companyInfo?: any
  ): Promise<any> {
    return await this.sendDocumentEmail({
      documentType: 'Quotation',
      documentNumber: quotationData.quotationNumber,
      recipientEmail: quotationData.customerEmail,
      recipientName: quotationData.customerName,
      documentData: quotationData,
      pdfBlob,
      companyInfo
    });
  }

  /**
   * Generate HTML for document email
   * @param data - Document email data
   * @returns HTML string
   */
  private static generateDocumentEmailHTML(data: DocumentEmailData): string {
    const companyName = data.companyInfo?.name || 'Your Company';
    const orderDate = data.documentData.orderDate || data.documentData.invoiceDate || data.documentData.quotationDate;
    const grandTotal = data.documentData.grandTotal;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.documentType} ${data.documentNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.12);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f2744 100%); padding: 48px 40px 36px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 8px;">📋</div>
              <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">${data.documentType}</div>
              <div style="margin-top: 8px; font-size: 15px; color: rgba(255,255,255,0.7); font-weight: 300;">
                ${data.documentType} Number: ${data.documentNumber}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 36px 40px 28px;">
              <p style="font-size: 15px; color: #374151; line-height: 1.8; margin: 0 0 28px 0;">
                Dear <strong style="color: #111827;">${data.recipientName}</strong>,<br/>
                Please find attached the ${data.documentType.toLowerCase()} <strong style="color: #111827;">${data.documentNumber}</strong> from <strong style="color: #111827;">${companyName}</strong> for your review and processing.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; border-radius: 10px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top; font-size: 18px;">📊</td>
                        <td style="font-size: 14px; color: #14532d; line-height: 1.7;">
                          <strong>Document Details:</strong><br/>
                          Date: ${new Date(orderDate).toLocaleDateString()}<br/>
                          Total Amount: Rs. ${grandTotal?.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${data.pdfBlob ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 10px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top; font-size: 18px;">📎</td>
                        <td style="font-size: 14px; color: #1e3a8a; line-height: 1.7;">
                          <strong>Attachment:</strong> The detailed ${data.documentType.toLowerCase()} is attached as a PDF file for your records.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
                <tr>
                  <td style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.8; margin: 0;">
                Questions? <span style="color: #7c4dff;">${data.companyInfo?.email || 'support@company.com'}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; border-top: 1px solid #f3f4f6; padding: 22px 40px;">
              <p style="font-size: 12px; color: #9ca3af; line-height: 1.7; margin: 0 0 12px 0;">
                © 2025 ${companyName}. All rights reserved.<br/>Warehouse & Inventory Management System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Convert blob to base64
   * @param blob - Blob to convert
   * @returns Base64 string
   */
  private static async blobToBase64(blob: Blob): Promise<string> {
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

export default EmailService;
