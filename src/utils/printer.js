export const printTicket = (type, order, globalSettings) => {
  if (typeof window === 'undefined') return;

  const width = '80mm'; // Standard thermal printer width
  let content = '';

  const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

  if (type === 'kitchen') {
    // KITCHEN TICKET (Comanda)
    content = `
      <div style="width: ${width}; font-family: monospace; color: #000; padding: 10px; box-sizing: border-box;">
        <h2 style="text-align: center; margin: 0; font-size: 24px; border-bottom: 2px dashed #000; padding-bottom: 10px;">COMANDA DE COCINA</h2>
        <h1 style="text-align: center; margin: 10px 0; font-size: 36px;">${order.tableId ? 'MESA ' + order.tableId : 'PARA LLEVAR'}</h1>
        
        <div style="font-size: 14px; margin-bottom: 10px;">
          <p style="margin: 2px 0;"><strong>ORDEN:</strong> ${order.id}</p>
          <p style="margin: 2px 0;"><strong>FECHA:</strong> ${dateStr}</p>
          ${order.customerName ? `<p style="margin: 2px 0;"><strong>CLIENTE:</strong> ${order.customerName}</p>` : ''}
        </div>

        <table style="width: 100%; font-size: 16px; font-weight: bold; margin-top: 15px; border-collapse: collapse;">
          <tr style="border-bottom: 2px solid #000;">
            <th style="text-align: left; padding-bottom: 5px;">CANT</th>
            <th style="text-align: left; padding-bottom: 5px;">PLATO / PEDIDO</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td style="padding: 8px 0; vertical-align: top; font-size: 20px;">${item.qty}x</td>
              <td style="padding: 8px 0;">${item.name}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; text-align: center; font-size: 12px;">
          --- FIN DE COMANDA ---
        </div>
      </div>
    `;
  } else if (type === 'receipt') {
    // CUSTOMER RECEIPT (Factura)
    const rate = parseFloat(globalSettings?.exchangeRate) || 40.00;
    const totalBs = (order.total * rate).toFixed(2);
    
    content = `
      <div style="width: ${width}; font-family: monospace; color: #000; padding: 10px; box-sizing: border-box;">
        <h2 style="text-align: center; margin: 0; font-size: 22px;">LAGO WOK ZHEN</h2>
        <p style="text-align: center; margin: 5px 0 15px 0; font-size: 12px;">El mejor sabor asiático</p>
        
        <div style="font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px;">
          <p style="margin: 2px 0;"><strong>ORDEN:</strong> ${order.id}</p>
          <p style="margin: 2px 0;"><strong>FECHA:</strong> ${dateStr}</p>
          <p style="margin: 2px 0;"><strong>TIPO:</strong> ${order.tableId ? 'Mesa ' + order.tableId : 'Para Llevar / Delivery'}</p>
          ${order.customerName ? `<p style="margin: 2px 0;"><strong>CLIENTE:</strong> ${order.customerName}</p>` : ''}
          ${order.clientId ? `<p style="margin: 2px 0;"><strong>C.I./RIF:</strong> ${order.clientId}</p>` : ''}
        </div>

        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; padding-bottom: 4px;">CANT</th>
            <th style="text-align: left; padding-bottom: 4px;">DESCRIPCIÓN</th>
            <th style="text-align: right; padding-bottom: 4px;">TOTAL</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td style="padding: 4px 0; vertical-align: top;">${item.qty}</td>
              <td style="padding: 4px 0;">${item.name}</td>
              <td style="padding: 4px 0; text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
          <table style="width: 100%; font-size: 14px; font-weight: bold;">
            <tr>
              <td>TOTAL USD:</td>
              <td style="text-align: right;">$${order.total.toFixed(2)}</td>
            </tr>
            <tr>
              <td>TOTAL Bs:</td>
              <td style="text-align: right;">Bs ${totalBs}</td>
            </tr>
          </table>
          <p style="text-align: center; font-size: 11px; margin-top: 10px; color: #555;">Tasa del día: 1 USD = ${rate} Bs</p>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px;">
          <p style="margin: 2px 0;">*** GRACIAS POR SU COMPRA ***</p>
          <p style="margin: 2px 0;">Por favor conserve su recibo</p>
        </div>
      </div>
    `;
  }

  // Create an iframe to print silently
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'absolute';
  printIframe.style.width = '0px';
  printIframe.style.height = '0px';
  printIframe.style.border = 'none';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow.document;
  doc.open();
  
  // Clean HTML structure without escaping issues
  const htmlStart = "<html><head><title>Imprimir Ticket</title><style>@page { margin: 0; } body { margin: 0; padding: 0; background: #fff; }</style></head><body>";
  const scriptTag = "<script>setTimeout(() => { window.print(); setTimeout(() => { window.parent.document.body.removeChild(window.frameElement); }, 500); }, 250);</" + "script>";
  const htmlEnd = "</body></html>";
  
  doc.write(htmlStart + content + scriptTag + htmlEnd);
  doc.close();
};
