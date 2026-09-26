const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';

let content = fs.readFileSync(path, 'utf8');

const brokenRegex = /\{\/\* Lado Izquierdo: Sidebar Navegacin \*\/\}[\s\S]*?<View style=\{styles\.ticketHeaders\}>/;

const newBlock = `{/* Lado Izquierdo: Sidebar Navegación */}
          <View style={styles.sidebar}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="storefront" size={28} color={COLORS.primary} />
            </View>
            
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
                style={{flex: 1, backgroundColor: '#1f1f2b', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center'}}
                onPress={() => setIsClientModalVisible(true)}
              >
                <MaterialCommunityIcons name="account-search" size={16} color={COLORS.textMuted} style={{marginRight: 8}} />
                <Text style={{color: clientName ? COLORS.text : COLORS.textMuted, fontSize: 13, flex: 1}} numberOfLines={1}>
                  {clientName ? clientName : "Buscar Cliente..."}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center'}}
                onPress={() => { setIsClientModalVisible(true); setIsCreatingClient(true); }}
              >
                <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.ticketHeaders}>`;

content = content.replace(brokenRegex, newBlock);

fs.writeFileSync(path, content);
console.log("Restored missing POS code completely");
