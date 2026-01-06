import { ShipmentData } from '@/types/shipment';
import { format } from 'date-fns';

const formatDate = (dateString: string) => {
  if (!dateString) return '_________________';
  return format(new Date(dateString), 'dd-MMM-yyyy').toUpperCase();
};

export const printDeclaration = (data: ShipmentData) => {
  return `
    <html>
    <head>
      <title>Declaration - ${data.id}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 250px 40px 50px 40px; line-height: 1.6; max-width: 850px; margin: 0 auto; margin-top: 100px; }
        .date { text-align: right; margin-bottom: 100px; font-size: 12pt; }
        .spacer-before { height: 20px; }
        h1 { text-align: center; text-decoration: underline; margin: 20px 0; font-size: 16pt; letter-spacing: 1px; }
        .declaration-text { text-align: justify; margin: 30px 0; line-height: 1.7; font-size: 11pt; }
        .details-section { margin-top: 40px; margin-bottom: 60px; }
        .detail-line { margin: 8px 0; font-size: 11pt; }
        .company-name { text-align: left; margin-top: 100px; font-size: 12pt; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="date">${formatDate(data.details.inspectionDate || new Date().toISOString())}</div>
      <div class="spacer-before"></div>
      
      <h1>DECLARATION</h1>
      
      <div class="declaration-text">
        We undertake that we import ${data.details.brand || 'used clothing'} from USA, inspected by SGS Pakistan, export to ${data.details.customer || '_________________'}, Mombasa, Kenya vide
      </div>
      
      <div class="details-section">
        <div class="detail-line">IDF# ${data.details.idf || '_________________'},</div>
        <div class="detail-line">UCR # ${data.details.ucr || '_________________'}</div>
        <div class="detail-line">PFI# : ${data.details.proforma || '_________________'}</div>
        <div class="detail-line">CNTR# ${data.details.container || '_________________'}</div>
      </div>
      
      <div class="company-name">
        IDEAS RECYCLING PVT LTD
      </div>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
};

export const printUndertaking = (data: ShipmentData) => {
  return `
    <html>
    <head>
      <title>Undertaking - ${data.id}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 250px 40px 50px 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; margin-top: 100px; }
        .date { text-align: left; margin-bottom: 30px; font-size: 11pt; }
        .recipient { margin-bottom: 30px; font-size: 11pt; }
        .subject { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 30px; font-size: 12pt; }
        .content { text-align: justify; margin-bottom: 30px; font-size: 11pt; }
        .points { margin-bottom: 30px; font-size: 11pt; }
        .point-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
        .point-item:before { content: "•"; position: absolute; left: 0; }
        .details-section { margin-bottom: 40px; font-size: 11pt; }
        .detail-line { margin-bottom: 5px; }
        .footer { margin-top: 60px; font-size: 11pt; }
        .regards { margin-bottom: 40px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="date">${formatDate(data.details.inspectionDate || new Date().toISOString())}</div>
      
      <div class="recipient">
        TO,<br/>
        SGS PAKISTAN (PRIVATE) LIMITED<br/>
        H-3/3, SECTOR 5, KORANGI INDUSTRIAL AREA,<br/>
        KARACHI-74900, PAKISTAN
      </div>
      
      <div class="subject">SUBJECT: UNDERTAKING LETTER</div>
      
      <div class="content">
        We declares that this shipment of Mombasa, 
      </div>
      
      <div class="points">
        <div class="point-item">No package shall contain used undergarments, sleepwear, bath towels, hospital textiles, high visibility garments, handkerchiefs and facemasks.</div>
        <div class="point-item">Used textile products in the consignment shall be free from prohibited materials such as asbestos mineral wool and erionite</div>
        <div class="point-item">For used footwear, no prohibited goods included in the consignment such as Used slippers and ORTHOPEDIC footwear</div>
      </div>
      
      <div class="details-section">
        <div class="detail-line">IDF# ${data.details.idf || '_________________'},</div>
        <div class="detail-line">UCR# : ${data.details.ucr || '_________________'}</div>
        <div class="detail-line">PFI# : ${data.details.proforma || '_________________'}</div>
        <div class="detail-line">CNTR# : ${data.details.container || '_________________'}</div>
        <div class="detail-line">IMPORTER: ${data.details.customer || '_________________'}</div>
        <div class="detail-line">NO. OF PACKAGES: ${data.commercial?.qty || '_________________'}</div>
      </div>
      
      <div class="footer">
        <div class="regards">THANKS & REGRADS</div>
        <div class="company">IDEAS RECYCLING PVT LTD</div>
      </div>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
};

export const printShoesUndertaking = (data: ShipmentData) => {
  return `
    <html>
    <head>
      <title>Shoes Undertaking - ${data.id}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 250px 40px 50px 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; margin-top: 100px; }
        .date { text-align: left; margin-bottom: 30px; font-size: 11pt; }
        .recipient { margin-bottom: 30px; font-size: 11pt; }
        .subject { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 30px; font-size: 12pt; }
        .content { text-align: justify; margin-bottom: 30px; font-size: 11pt; }
        .details-section { margin-bottom: 40px; font-size: 11pt; }
        .detail-line { margin-bottom: 5px; }
        .footer { margin-top: 60px; font-size: 11pt; }
        .regards { margin-bottom: 40px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="date">${formatDate(data.details.inspectionDate || new Date().toISOString())}</div>
      
      <div class="recipient">
        TO,<br/>
        SGS PAKISTAN (PRIVATE) LIMITED<br/>
        H-3/3, SECTOR 5, KORANGI INDUSTRIAL AREA,<br/>
        KARACHI-74900, PAKISTAN
      </div>
      
      <div class="subject">SUBJECT: UNDERTAKING LETTER</div>
      
      <div class="content">
        We declares that this shipment of Mombasa, Kenya has no prohibited items in used shoes such as sandals, used slippers, used indoor footwear. No prohibited goods included in the consignment such as: No consignment shall contain used slippers and orthopedic
      </div>
      
      <div class="details-section">
        <div class="detail-line">IDF# ${data.details.idf || '_________________'},</div>
        <div class="detail-line">UCR# : ${data.details.ucr || '_________________'}</div>
        <div class="detail-line">PFI# : ${data.details.proforma || '_________________'}</div>
        <div class="detail-line">CNTR# : ${data.details.container || '_________________'}</div>
        <div class="detail-line">IMPORTER: ${data.details.customer || '_________________'}</div>
        <div class="detail-line">NO. OF PACKAGES: ${data.commercial?.qty || '_________________'}</div>
      </div>
      
      <div class="footer">
        <div class="regards">THANKS & REGRADS</div>
        <div class="company">IDEAS RECYCLING PVT LTD</div>
      </div>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
};
