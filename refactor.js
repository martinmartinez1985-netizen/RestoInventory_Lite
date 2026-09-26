const fs = require('fs');
let content = fs.readFileSync('src/screens/PayablesScreen.js', 'utf8');

content = content.replace(/globalReceivables/g, 'globalPayables');
content = content.replace(/addReceivable/g, 'addPayable');
content = content.replace(/updateReceivable/g, 'updatePayable');
content = content.replace(/ReceivablesScreen/g, 'PayablesScreen');
content = content.replace(/Receivables/g, 'Payables');
content = content.replace(/Cuentas por Cobrar/g, 'Cuentas por Pagar');
content = content.replace(/Saldo Deudor/g, 'Saldo Acreedor');
content = content.replace(/balance \+= \(trx\.debit - trx\.credit\)/g, 'balance += (trx.credit - trx.debit)');
content = content.replace(/runningBalance \+= \(trx\.debit - trx\.credit\)/g, 'runningBalance += (trx.credit - trx.debit)');
content = content.replace(/debit: 0,\s*credit: amt/g, 'debit: amt,\n      credit: 0');
content = content.replace(/Registrar Abono/g, 'Registrar Pago');
content = content.replace(/setPaymentConcept\('Abono'\)/g, "setPaymentConcept('Pago')");
content = content.replace(/Procesar Abono/g, 'Procesar Pago');

fs.writeFileSync('src/screens/PayablesScreen.js', content);
