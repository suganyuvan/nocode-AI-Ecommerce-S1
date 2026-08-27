export interface CourierPartner {
  id: string;
  name: string;
  trackingUrlTemplate: (awb: string) => string;
}

export const PUBLIC_COURIER_PARTNERS: CourierPartner[] = [
  {
    id: 'delhivery',
    name: 'Delhivery Express',
    trackingUrlTemplate: (awb) => `https://www.delhivery.com/track/package/${awb}`
  },
  {
    id: 'bluedart',
    name: 'BlueDart Surface & Air',
    trackingUrlTemplate: (awb) => `https://www.bluedart.com/tracking?waybill=${awb}`
  },
  {
    id: 'fedex',
    name: 'FedEx Priority',
    trackingUrlTemplate: (awb) => `https://www.fedex.com/fedextrack/?trknbr=${awb}`
  },
  {
    id: 'dtdc',
    name: 'DTDC Express',
    trackingUrlTemplate: (awb) => `https://www.dtdc.in/tracking/shipment-tracking.asp?strcnno=${awb}`
  },
  {
    id: 'dhl',
    name: 'DHL Express Worldwide',
    trackingUrlTemplate: (awb) => `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${awb}`
  },
  {
    id: 'indiapost',
    name: 'India Post Speed Post',
    trackingUrlTemplate: (awb) => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`
  },
  {
    id: 'xpressbees',
    name: 'Xpressbees Logistics',
    trackingUrlTemplate: (awb) => `https://www.xpressbees.com/track?isAwb=true&values=${awb}`
  },
  {
    id: 'ecomexpress',
    name: 'Ecom Express',
    trackingUrlTemplate: (awb) => `https://ecomexpress.in/tracking/?awb_field=${awb}`
  }
];

export function getCourierTrackingUrl(courierName: string | undefined | null, trackingNumber: string | undefined | null): string {
  const awb = (trackingNumber || '').trim();
  const cName = (courierName || '').toLowerCase();

  if (!awb) return 'https://www.delhivery.com/track';

  if (cName.includes('bluedart')) {
    return `https://www.bluedart.com/tracking?waybill=${awb}`;
  }
  if (cName.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${awb}`;
  }
  if (cName.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?strcnno=${awb}`;
  }
  if (cName.includes('dhl')) {
    return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${awb}`;
  }
  if (cName.includes('india post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
  }
  if (cName.includes('xpressbees')) {
    return `https://www.xpressbees.com/track?isAwb=true&values=${awb}`;
  }
  if (cName.includes('ecom')) {
    return `https://ecomexpress.in/tracking/?awb_field=${awb}`;
  }

  // Default to Delhivery tracking
  return `https://www.delhivery.com/track/package/${awb}`;
}
