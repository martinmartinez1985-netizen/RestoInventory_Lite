const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\FinishedGoodsScreen.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Import globalRecipes
if (!content.includes('globalRecipes')) {
  content = content.replace(
    /import \{ globalFinishedGoods, addWaste, updateStock \} from '\.\.\/store\/mockDb';/,
    "import { globalFinishedGoods, globalRecipes, addWaste, updateStock } from '../store/mockDb';"
  );
}

// 2. Add state variables for Add Modal
const stateInjection = `const [isWasteModalVisible, setIsWasteModalVisible] = useState(false);
  const [wasteIngredient, setWasteIngredient] = useState(null);
  const [wasteAmount, setWasteAmount] = useState('');

  // Add Item Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Bebidas');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newImage, setNewImage] = useState('');

  const handleAddItem = () => {
    if (!newName.trim()) return alert("El nombre es obligatorio");
    const fgId = 'FG-' + Date.now().toString().slice(-6);
    
    // 1. Add to Finished Goods Inventory
    globalFinishedGoods.push({
      id: fgId,
      name: newName,
      baseUnit: 'Unidades',
      baseCost: parseFloat(newCost) || 0,
      baseStock: parseFloat(newStock) || 0,
      minStock: 10,
      isDirectSale: true
    });

    // 2. Create Dummy Recipe so it appears in POS
    globalRecipes.push({
      id: 'REC-' + Date.now().toString().slice(-6),
      name: newName,
      outputId: fgId,
      outputType: 'finished',
      yieldAmount: 1,
      yieldUnit: 'Unidades',
      ingredients: [], // No raw materials! Direct sale.
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      image: newImage || 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=300&q=80'
    });

    setIsAddModalVisible(false);
    setNewName('');
    setNewCategory('Bebidas');
    setNewPrice('');
    setNewCost('');
    setNewStock('');
    setNewImage('');
    loadData();
  };`;

content = content.replace(
  /const \[isWasteModalVisible, setIsWasteModalVisible\] = useState\(false\);\s*const \[wasteIngredient, setWasteIngredient\] = useState\(null\);\s*const \[wasteAmount, setWasteAmount\] = useState\(''\);/,
  stateInjection
);

// 3. Add button in toolbar
const newToolbarBtn = `<View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={[styles.reportBtn, {backgroundColor: '#10b981', borderColor: '#10b981'}]} onPress={() => setIsAddModalVisible(true)}>
                <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                <Text style={[styles.reportBtnTxt, {color: '#fff'}]}>Nuevo Directo (Sin Receta)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reportBtn}>
                <MaterialCommunityIcons name="file-chart-outline" size={18} color="#0f172a" />
                <Text style={styles.reportBtnTxt}>Reporte de Mermas</Text>
              </TouchableOpacity>
            </View>`;

content = content.replace(
  /<TouchableOpacity style=\{styles.reportBtn\}>\s*<MaterialCommunityIcons name="file-chart-outline" size=\{18\} color="#0f172a" \/>\s*<Text style=\{styles.reportBtnTxt\}>Reporte de Mermas<\/Text>\s*<\/TouchableOpacity>/,
  newToolbarBtn
);

// 4. Add the Add Modal UI
const addModalUi = `
      {/* Add Direct Item Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Producto Directo</Text>
            <Text style={styles.modalSubtitle}>Agrega platos o bebidas compradas listas para la venta (Ej: Cervezas, Refrescos) sin necesidad de receta.</Text>
            
            <Text style={styles.label}>NOMBRE DEL PRODUCTO</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Ej: Cerveza Polar" />
            
            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.label}>CATEGORÍA</Text>
                <TextInput style={styles.input} value={newCategory} onChangeText={setNewCategory} placeholder="Ej: Bebidas" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>PRECIO VENTA ($)</Text>
                <TextInput style={styles.input} value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" placeholder="1.50" />
              </View>
            </View>

            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.label}>COSTO COMPRA ($)</Text>
                <TextInput style={styles.input} value={newCost} onChangeText={setNewCost} keyboardType="numeric" placeholder="0.80" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>STOCK INICIAL (Unid)</Text>
                <TextInput style={styles.input} value={newStock} onChangeText={setNewStock} keyboardType="numeric" placeholder="50" />
              </View>
            </View>

            <Text style={styles.label}>URL IMAGEN (Opcional)</Text>
            <TextInput style={styles.input} value={newImage} onChangeText={setNewImage} placeholder="https://..." />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: '#10b981'}]} onPress={handleAddItem}>
                <Text style={styles.confirmBtnText}>Guardar y Enviar al POS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
`;

// Insert the modal before the final closing View of SafeAreaView
content = content.replace(
  /<\/SafeAreaView>/,
  addModalUi + "\n    </SafeAreaView>"
);

fs.writeFileSync(path, content);
console.log("Finished Goods updated");
