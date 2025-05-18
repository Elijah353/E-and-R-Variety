import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Alert, RefreshControl } from 'react-native';
import * as SQLite from 'expo-sqlite';

const OrderSummary = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

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

    useEffect(() => {
        fetchOrders();
    }, []);

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

    // Render each order in the list
    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={{
                padding: 15,
                marginVertical: 5,
                backgroundColor: '#f5f5f5',
                borderRadius: 5,
            }}
            onPress={() => handleSelectOrder(item)}
        >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.customer_name}</Text>
            <Text>Total: ${item.total_price.toFixed(2)}</Text>
            <Text>Date: {new Date(item.order_date).toLocaleString()}</Text>
        </TouchableOpacity>
    );

    // Render order details
    const renderOrderDetails = () => (
        <View style={{ padding: 15 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Order Details:</Text>
            {orderDetails.map((item, index) => (
                <View key={index} style={{ marginVertical: 5 }}>
                    <Text>Product: {item.product_name}</Text>
                    <Text>Quantity: {item.quantity}</Text>
                </View>
            ))}
            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Text style={{ color: 'blue', marginTop: 10 }}>Back to Orders</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>Order Summary</Text>
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
                />
            )}
        </SafeAreaView>
    );
};

export default OrderSummary;
