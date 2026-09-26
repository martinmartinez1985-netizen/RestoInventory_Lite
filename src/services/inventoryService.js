import { db } from '../config/firebase';
import { collection, doc, getDocs, updateDoc, addDoc, onSnapshot, query, where, runTransaction } from 'firebase/firestore';

const INVENTORY_COLLECTION = 'inventory';

export const inventoryService = {
  // Listen in real-time to inventory items
  subscribeToInventory: (callback) => {
    const q = query(collection(db, INVENTORY_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },

  // Add new item to inventory
  addItem: async (itemData) => {
    return await addDoc(collection(db, INVENTORY_COLLECTION), {
      ...itemData,
      stockPrincipal: itemData.stockPrincipal || 0,
      stockBarra: itemData.stockBarra || 0,
      createdAt: new Date().toISOString(),
    });
  },

  // Transfer stock between warehouses (e.g. Principal -> Barra)
  transferStock: async (itemId, fromWarehouse, toWarehouse, amount) => {
    const itemRef = doc(db, INVENTORY_COLLECTION, itemId);

    try {
      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
          throw "Document does not exist!";
        }
        
        const data = itemDoc.data();
        const stockFromKey = `stock${fromWarehouse}`; // 'stockPrincipal' or 'stockBarra'
        const stockToKey = `stock${toWarehouse}`;

        if (data[stockFromKey] < amount) {
          throw "Insufficient stock in source warehouse!";
        }

        const newFromStock = data[stockFromKey] - amount;
        const newToStock = (data[stockToKey] || 0) + amount;

        transaction.update(itemRef, {
          [stockFromKey]: newFromStock,
          [stockToKey]: newToStock,
          lastUpdated: new Date().toISOString()
        });
      });
      console.log("Transaction successfully committed!");
      return true;
    } catch (e) {
      console.log("Transaction failed: ", e);
      return false;
    }
  },
  
  // Deduct stock during billing (e.g., from Bar)
  deductStock: async (itemId, warehouse, amount) => {
    const itemRef = doc(db, INVENTORY_COLLECTION, itemId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) throw "Item not found";
        
        const stockKey = `stock${warehouse}`;
        const currentStock = itemDoc.data()[stockKey] || 0;
        
        if (currentStock < amount) throw "Not enough stock to deduct";
        
        transaction.update(itemRef, {
          [stockKey]: currentStock - amount
        });
      });
      return true;
    } catch(e) {
      console.log("Failed to deduct stock:", e);
      return false;
    }
  }
};
