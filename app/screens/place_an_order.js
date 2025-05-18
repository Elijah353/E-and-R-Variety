import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Picker } from '@react-native-picker/picker';

const PlaceOrder = () => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        setupDatabase();
        fetchCustomers();
        fetchProducts();
    }, []);

    const setupDatabase = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
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
    }

    // Fetch customers from the database
    const fetchCustomers = async () => {
        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            const allRows = await db.getAllAsync("SELECT * FROM customers");
            setProducts(allRows);
        } catch (e) {
            console.log('Error fetching customers:', e);
        }
    };

    // Fetch products from the database
    const fetchProducts = async () => {
        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            const allRows = await db.getAllAsync("SELECT * FROM products");
            setProducts(allRows);
        } catch (e) {
            console.log('Error fetching products:', e);
        }
    };

    // Add a product to the order
    const addProductToOrder = (product) => {
        setSelectedProducts([...selectedProducts, product]);
        setTotalPrice(totalPrice + product.price);
    };

    // Remove a product from the order
    const removeProductFromOrder = (productId) => {
        const updatedProducts = selectedProducts.filter(p => p.id !== productId);
        const productToRemove = selectedProducts.find(p => p.id === productId);
        setSelectedProducts(updatedProducts);
        setTotalPrice(totalPrice - productToRemove.price);
    };

    // Save the order to the database
    const saveOrder = async () => {
        if (!selectedCustomer) {
            Alert.alert("Select a customer before saving the order!");
            return;
        }

        if (selectedProducts.length === 0) {
            Alert.alert("Add at least one product to the order!");
            return;
        }

        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            await db.runAsync(
                "INSERT INTO orders (customer_id, total_price) VALUES (?, ?)",
                [selectedCustomer, totalPrice],
                (_, result) => {
                    const orderId = result.insertId;
                    selectedProducts.forEach(product => {
                        db.runAsync(
                            "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
                            [orderId, product.id, 1]
                        );
                    });
                    Alert.alert("Order saved successfully!");
                    setSelectedCustomer(null);
                    setSelectedProducts([]);
                    setTotalPrice(0);
                }
            );
        } catch (e) {
            console.log('Error saving order:', e);
            Alert.alert("Error saving order");
        }
    };

    return (
        <SafeAreaView style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Place an Order</Text>

            {/* Customer Selection */}
            <Text>Select Customer:</Text>
            <Picker
                selectedValue={selectedCustomer}
                onValueChange={(value) => setSelectedCustomer(value)}
                style={{ marginVertical: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }}
            >
                <Picker.Item label="Select a customer" value={null} />
                {customers.map((customer) => (
                    <Picker.Item key={customer.id} label={customer.name} value={customer.id} />
                ))}
            </Picker>

            {/* Product Selection */}
            <Text style={{ marginTop: 20 }}>Select Products:</Text>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            padding: 10,
                            marginVertical: 5,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 5,
                        }}
                        onPress={() => addProductToOrder(item)}
                    >
                        <Text>{item.name}</Text>
                        <Text>${item.price}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Order Summary */}
            <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Order Summary:</Text>
            {selectedProducts.map((product, index) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 }}>
                    <Text>{product.name}</Text>
                    <TouchableOpacity onPress={() => removeProductFromOrder(product.id)}>
                        <Text style={{ color: 'red' }}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ))}
            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Total: ${totalPrice.toFixed(2)}</Text>

            {/* Save and Cancel Buttons */}
            <View style={{ marginTop: 20 }}>
                <Button title="Save Order" onPress={saveOrder} />
                <Button title="Cancel" color="red" onPress={() => setSelectedProducts([])} />
            </View>
        </SafeAreaView>
    );
};

export default PlaceOrder;
