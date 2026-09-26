const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

// The regex deleted from the first TouchableOpacity up to the CRM buttons.
// Let's find where the breakage is.
const brokenCode = `            <View style={{flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 15}}>
                <TouchableOpacity 
                  style={{flex: 1, backgroundColor: '#1f1f2b', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center'}}`;

// The missing block
const missingBlock = `
            <TouchableOpacity style={[styles.navItem, {backgroundColor: COLORS.primary + '20'}]} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.navText, {color: COLORS.primary}]}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <MaterialCommunityIcons name="text-box-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.navText, {color: COLORS.primary}]}>Menú</Text>
            </TouchableOpacity>
          </View>

          {/* Centro: Catálogo de Menú */}
          <View style={styles.mainContent}>
            {/* Header Superior */}
            <View style={styles.header}>
              <View>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </View>
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="Buscar menú..." 
                  placeholderTextColor={COLORS.textMuted} 
                />
              </View>
            </View>

            {/* Categorías */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {['Todos', 'Platos Principales', 'Burger', 'Noodles', 'Drinks', 'Arroz'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.catBadge, activeCategory === cat && styles.catBadgeActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.catText, activeCategory === cat && {color: '#fff'}]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Grid de Productos */}
            <ScrollView style={styles.gridScroll}>
              <View style={styles.grid}>
                {globalRecipes.map((recipe, i) => (
                  <TouchableOpacity key={i} style={styles.menuCard} onPress={() => addToOrder(recipe)}>
                    <Image source={{uri: recipe.image || 'https://via.placeholder.com/150'}} style={styles.cardImage} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{recipe.name}</Text>
                      <Text style={styles.cardPrice}>\${formatMoney(recipe.salePrice)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Lado Derecho: Ticket / Orden */}
          <View style={styles.ticketPanel}>
            <Text style={styles.ticketTitle}>
              {order.type === 'dine_in' ? \`Orden - Mesa \${order.tableId.replace('T', '')}\` : \`Orden: \${order.type}\`}
            </Text>
            <Text style={styles.ticketSub}>ID: {order.id}</Text>

            <View style={{flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 15}}>
                <TouchableOpacity 
                  style={{flex: 1, backgroundColor: '#1f1f2b', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center'}}`;

content = content.replace(brokenCode, missingBlock);

fs.writeFileSync(path, content);
console.log("Restored missing POS code");
