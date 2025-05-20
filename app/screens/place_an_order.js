import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Button, ScrollView, TouchableOpacity, Alert, SafeAreaView, StyleSheet, ImageBackground, RefreshControl, TextInput } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlaceOrder = () => {
    const dbRef = useRef(null);
    const [dbReady, setDbReady] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [quantityModalVisible, setQuantityModalVisible] = useState(false);
    const [selectedProductForQuantity, setSelectedProductForQuantity] = useState(null);
    const [inputQuantity, setInputQuantity] = useState('1');
    const [removeModalVisible, setRemoveModalVisible] = useState(false);
    const [selectedProductForRemove, setSelectedProductForRemove] = useState(null);
    const [removeQuantity, setRemoveQuantity] = useState('1');
    const [totalPrice, setTotalPrice] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    // Initialize database and fetch customers/products
    useEffect(() => {
        const init = async () => {
            dbRef.current = await SQLite.openDatabaseAsync("mobileApps.db");
            await setupDatabase();
            setDbReady(true);
            fetchCustomers();
            fetchProducts();
        };
        init();
    }, []);

    // Refresh handler for customers and products
    const onRefresh = async () => {
        setRefreshing(true);
        setupDatabase();
        await fetchCustomers();
        await fetchProducts();
        setRefreshing(false);
    };

    // Handle user logout
    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.removeItem('loggedInUser');
                    router.replace('/'); // assuming '/' is your login or welcome screen
                }
            }
        ]);
    };

    // Create all necessary tables if they do not exist
    const setupDatabase = async () => {
        const db = dbRef.current;
        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL
            )`
        );

        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT
        )`
        );

        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT NOT NULL
        )`
        );

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                total_price REAL NOT NULL,
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        setDbReady(true);
    };

    // Fetch customers from the database
    const fetchCustomers = async () => {
        try {
            const db = dbRef.current;
            const allRows = await db.getAllAsync("SELECT * FROM customers");
            setCustomers(allRows);
        } catch (e) {
            console.log('Error fetching customers:', e);
        }
    };

    // Fetch products from the database
    const fetchProducts = async () => {
        try {
            const db = dbRef.current;
            const allRows = await db.getAllAsync("SELECT * FROM products");
            setProducts(allRows);
        } catch (e) {
            console.log('Error fetching products:', e);
        }
    };

    // Add a product to the order
    const confirmAddProductToOrder = () => {
        const quantity = parseInt(inputQuantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
            return;
        }
        const product = selectedProductForQuantity;
        const existing = selectedProducts.find(p => p.id === product.id);
        if (existing) {
            setSelectedProducts(selectedProducts.map(p =>
                p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
            ));
        } else {
            setSelectedProducts([...selectedProducts, { ...product, quantity }]);
        }
        setTotalPrice(totalPrice + product.price * quantity);
        setQuantityModalVisible(false);
        setSelectedProductForQuantity(null);
        setInputQuantity('1');
    };

    // Remove a product from the order
    const confirmRemoveProductQuantity = () => {
        const quantity = parseInt(removeQuantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
            return;
        }
        const product = selectedProductForRemove;
        const existing = selectedProducts.find(p => p.id === product.id);
        if (!existing) {
            setRemoveModalVisible(false);
            setSelectedProductForRemove(null);
            setRemoveQuantity('1');
            return;
        }
        if (existing.quantity > quantity) {
            setSelectedProducts(selectedProducts.map(p =>
                p.id === product.id ? { ...p, quantity: p.quantity - quantity } : p
            ));
            setTotalPrice(totalPrice - product.price * quantity);
        } else {
            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
            setTotalPrice(totalPrice - product.price * existing.quantity);
        }
        setRemoveModalVisible(false);
        setSelectedProductForRemove(null);
        setRemoveQuantity('1');
    };

    // Save the order to the database
    const saveOrder = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        if (!selectedCustomer) {
            Alert.alert("Select a customer before saving the order!");
            return;
        }

        if (selectedProducts.length === 0) {
            Alert.alert("Add at least one product to the order!");
            return;
        }

        try {
            const db = dbRef.current;
            await db.runAsync(
                "INSERT INTO orders (customer_id, total_price) VALUES (?, ?)",
                [selectedCustomer, totalPrice],
            );
            // Get the last inserted order id
            const orderIdResult = await db.getFirstAsync("SELECT last_insert_rowid() as id");
            const orderId = orderIdResult.id;
            for (const product of selectedProducts) {
                await db.runAsync(
                    "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
                    [orderId, product.id, product.quantity]
                );
            }
            Alert.alert("Order saved successfully!");
            setSelectedCustomer(null);
            setSelectedProducts([]);
            setTotalPrice(0);
        } catch (e) {
            console.log('Error saving order:', e);
            Alert.alert("Error saving order");
        }
    };

    // Main UI rendering
    return (
        <ImageBackground
            source={require('../assets/background5.jpg')}
            style={styles.background}
        >
            <SafeAreaView style={{ flex: 1, padding: 20 }}>

                {/* Customer Selection */}
                <Text>Select Customer:</Text>
                <Picker
                    selectedValue={selectedCustomer}
                    onValueChange={(value) => setSelectedCustomer(value)}
                    style={styles.customerPicker}
                >
                    <Picker.Item label="Select a customer" value={null} color="#000" />
                    {customers.map((customer) => (
                        <Picker.Item key={customer.id} label={customer.name} value={customer.id} color="#333" />
                    ))}
                </Picker>

                {/* Product Selection */}
                <Text style={styles.productTitle}>Select Products:</Text>
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.productItem}
                            onPress={() => {
                                setSelectedProductForQuantity(item);
                                setInputQuantity('1');
                                setQuantityModalVisible(true);
                            }}
                        >
                            <Text>{item.name}</Text>
                            <Text>${parseFloat(item.price).toFixed(2)}</Text>
                        </TouchableOpacity>
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />

                {/* Order Summary */}
                <Text style={styles.orderSummaryTitle}>Order Summary:</Text>
                <ScrollView style={{ maxHeight: 200, marginBottom: 10 }}>
                    {selectedProducts.map((product, index) => (
                        <View key={index} style={styles.orderItem}>
                            <Text>{product.name} x{product.quantity}</Text>
                            <TouchableOpacity onPress={() => {
                                setSelectedProductForRemove(product);
                                setRemoveQuantity('1');
                                setRemoveModalVisible(true);
                            }}>
                                <Text style={{ color: 'red' }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
                <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Total: ${totalPrice.toFixed(2)}</Text>

                {/* Save and Cancel Buttons */}
                <View style={{ marginTop: 20 }}>
                    <Button title="Save Order" onPress={saveOrder} />
                    <Button title="Cancel" color="red" onPress={() => { setSelectedCustomer(null); setSelectedProducts([]); setTotalPrice(0); }} />
                </View>

            </SafeAreaView>
            {/* Logout button fixed at bottom left */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <MaterialIcons name="logout" size={28} color="#007AFF" />
            </TouchableOpacity>
            {quantityModalVisible && (
                <View style={{
                    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10
                }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 12, width: 250 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                            Set Quantity for {selectedProductForQuantity?.name}
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, padding: 10, marginBottom: 15, textAlign: 'center'
                            }}
                            keyboardType="numeric"
                            value={inputQuantity}
                            onChangeText={setInputQuantity}
                            placeholder="Quantity"
                        />
                        <Button title="Add" onPress={confirmAddProductToOrder} />
                        <Button title="Cancel" color="red" onPress={() => setQuantityModalVisible(false)} />
                    </View>
                </View>
            )}

            {removeModalVisible && (
                <View style={{
                    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10
                }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 12, width: 250 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                            Remove Quantity for {selectedProductForRemove?.name}
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, padding: 10, marginBottom: 15, textAlign: 'center'
                            }}
                            keyboardType="numeric"
                            value={removeQuantity}
                            onChangeText={setRemoveQuantity}
                            placeholder="Quantity"
                        />
                        <Button title="Remove" color="red" onPress={confirmRemoveProductQuantity} />
                        <Button title="Cancel" onPress={() => setRemoveModalVisible(false)} />
                    </View>
                </View>
            )}
        </ImageBackground>
    );
};

export default PlaceOrder;

const styles = StyleSheet.create({
    customerPicker: {
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
    },
    productTitle: {
        marginTop: 20,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
    },
    orderSummaryTitle: {
        marginTop: 20,
        fontWeight: 'bold',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    logoutButton: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        width: 60,
        height: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
});