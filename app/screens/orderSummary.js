import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Alert, RefreshControl, StyleSheet, ImageBackground, ScrollView } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrderSummary = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    // Refresh handler
    const onRefresh = () => {
        setRefreshing(true);
        // Simulate a network request
        setTimeout(() => {
            // Add your logic to refresh products here
            fetchOrders();  // Example: Fetching the latest products
            setRefreshing(false);
        }, 1000);
    };

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

    useEffect(() => {
        setupDatabase().then(fetchOrders);
    }, []);

    const setupDatabase = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
        await db.runAsync(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT NOT NULL
        )
    `);
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
        await db.runAsync(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT
        )
    `);
    };

    // Fetch all orders
    const fetchOrders = async () => {
        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            const result = await db.getAllAsync(`
                SELECT o.id, c.name AS customer_name, o.total_price, o.order_date 
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                ORDER BY o.order_date DESC
            `);
            setOrders(result);
        } catch (e) {
            console.log("Error fetching orders:", e);
        }
    };

    // Fetch order details (products in the order)
    const fetchOrderDetails = async (orderId) => {
        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            const result = await db.getAllAsync(`
                SELECT p.name AS product_name, oi.quantity 
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [orderId]);
            setOrderDetails(result);
        } catch (e) {
            console.log("Error fetching order details:", e);
        }
    };

    // Handle order selection to view details
    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        fetchOrderDetails(order.id);
    };

    function parseSQLiteDateToLocal(dateString) {
        if (!dateString) return '';
        const isoString = dateString.replace(' ', 'T') + 'Z';
        return new Date(isoString).toLocaleString();
    }

    // Render each order in the list
    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderItem}
            onPress={() => handleSelectOrder(item)}
        >
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text>Total: ${item.total_price.toFixed(2)}</Text>
            <Text>Date: {parseSQLiteDateToLocal(item.order_date)}</Text>
        </TouchableOpacity>
    );

    // Render order details with total price
    const renderOrderDetails = () => (
        <View style={styles.orderDetailView}>
            <Text style={styles.orderDetails}>Order Details:</Text>
            <Text style={styles.detailText}>
                Customer: {selectedOrder.customer_name}
            </Text>
            <Text style={styles.detailText}>
                Total Price: ${selectedOrder.total_price.toFixed(2)}
            </Text>
            <Text style={styles.detailText}>
                Order Date: {parseSQLiteDateToLocal(selectedOrder.order_date)}
            </Text>

            <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
                {orderDetails.map((item, index) => (
                    <View key={index} style={styles.productRow}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        <View style={styles.quantityBadge}>
                            <Text style={styles.quantityText}>x{item.quantity}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Text style={{ color: 'blue', marginTop: 10 }}>Back to Orders</Text>
            </TouchableOpacity>
        </View>
    );


    return (
        <ImageBackground
            source={require('../assets/background5.jpg')} // Update the path to your image
            style={styles.background}
        >
            <SafeAreaView style={styles.container}>
                {selectedOrder ? (
                    renderOrderDetails()
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderOrder}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        ListEmptyComponent={<Text>No orders found.</Text>}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </SafeAreaView>
            {/* Logout button fixed at bottom left */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <MaterialIcons name="logout" size={28} color="#007AFF" />
            </TouchableOpacity>
        </ImageBackground>
    );
};

export default OrderSummary;

const styles = StyleSheet.create({
    orderItem: {
        padding: 15,
        marginVertical: 5,
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    orderDetailView: {
        padding: 15,
    },
    orderDetails: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    details: {
        marginVertical: 5,
    },
    detailText: {
        fontSize: 16,
        color: '#333',
        marginVertical: 3,
    },
    container: {
        padding: 20,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    quantityBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginLeft: 10,
        minWidth: 36,
        alignItems: 'center',
    },
    quantityText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        width: 60,            // same as squareButton
        height: 60,           // same as squareButton
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,     // same as squareButton
        elevation: 4,         // shadow Android
        shadowColor: '#000',  // shadow iOS
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
