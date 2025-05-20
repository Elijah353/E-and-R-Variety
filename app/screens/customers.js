import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, FlatList, View, SafeAreaView, Button, TextInput, Alert, TouchableOpacity, RefreshControl, ImageBackground } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const customers = () => {
    const dbRef = useRef(null);
    const [dbReady, setDbReady] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    // Initialize database and fetch customers
    useEffect(() => {
        const init = async () => {
            dbRef.current = await SQLite.openDatabaseAsync("mobileApps.db");
            await setupDatabase();
            setDbReady(true);
            fetchCustomers();
        };
        init();
    }, []);

    // Refresh customer list and ensure tables exist
    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setupDatabase().then(fetchCustomers);
            setRefreshing(false);
        }, 1000);
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

    // Fetch all customers from the database
    const fetchCustomers = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        const db = dbRef.current;
        const allRows = await db.getAllAsync("SELECT * FROM customers");
        setCustomers(allRows);
    };

    // Add a new customer to the database
    const addCustomer = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        if (customerName && username && email) {
            try {
                const db = dbRef.current;
                await db.runAsync(
                    "INSERT INTO customers (name, username, email) VALUES (?, ?, ?)",
                    [customerName, username, email]
                );
                setCustomerName('');
                setUsername('');
                setEmail('');
                setShowAddForm(false);
                fetchCustomers();
                Alert.alert("Customer added!");
            } catch (e) {
                console.log('DB error:', e);
                Alert.alert("Error adding customer");
            }
        } else {
            Alert.alert("Please enter a customer name, username, and email.");
        }
    };

    // Update an existing customer in the database
    const updateCustomer = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        if (selectedCustomer) {
            try {
                const db = dbRef.current;
                await db.runAsync(
                    "UPDATE customers SET name = ?, username = ?, email = ? WHERE id = ?",
                    [customerName, username, email, selectedCustomer.id]
                );
                setShowEditForm(false);
                fetchCustomers();
                Alert.alert("Customer updated!");
            } catch (e) {
                Alert.alert("Error updating customer");
            }
        }
    };

    // Delete a customer from the database
    const deleteCustomer = async (id) => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        try {
            const db = dbRef.current;
            await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
            fetchCustomers();
            Alert.alert("Customer deleted!");
        } catch (e) {
            Alert.alert("Error deleting Customer");
        }
    };

    // Reset form fields and state
    const resetForm = () => {
        setCustomerName('');
        setUsername('');
        setEmail('');
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedCustomer(null);
    };

    if (showAddForm) {
        return (
            <ImageBackground
                source={require('../assets/background5.jpg')}
                style={styles.background}
            >
                <SafeAreaView style={styles.container}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholderTextColor="#333"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholderTextColor="#333"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholderTextColor="#333"
                    />
                    <Button title="Add" onPress={addCustomer} />
                    <Button title="Back to Customers" onPress={() => setShowAddForm(false)} />
                </SafeAreaView>
            </ImageBackground>
        );
    }

    if (showEditForm) {
        return (
            <ImageBackground
                source={require('../assets/background5.jpg')}
                style={styles.background}
            >
                <SafeAreaView style={styles.container}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholderTextColor="#333"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholderTextColor="#333"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholderTextColor="#333"
                    />
                    <Button title="Update" onPress={updateCustomer} />
                    <Button title="Back to Customers" onPress={() => setShowEditForm(false)} />
                </SafeAreaView>
            </ImageBackground>
        );
    }

    // Render swipeable delete action for each customer
    const renderRightActions = (item) => (
        <TouchableOpacity
            style={styles.deleteIconContainer}
            onPress={() => {
                Alert.alert("Delete", "Are you sure you want to delete this customer?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", onPress: () => deleteCustomer(item.id), style: "destructive" }
                ]);
            }}>
            <MaterialIcons name="delete" size={28} color="red" />
        </TouchableOpacity>
    );

    // Render each customer item
    const renderItem = ({ item }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)}>
            <TouchableOpacity onPress={() => {
                setSelectedCustomer(item);
                setCustomerName(item.name);
                setUsername(item.username);
                setEmail(item.email);
                setShowEditForm(true);
            }}>
                <View style={styles.customerContainer}>
                    <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>{item.name}</Text>
                        <Text style={styles.username}>Username: {item.username}</Text>
                        <Text style={styles.email}>Email: {item.email}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    // Main UI rendering
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ImageBackground
                source={require('../assets/background5.jpg')}
                style={styles.background}
            >
                <SafeAreaView style={styles.container}>
                    <FlatList data={customers}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />

                </SafeAreaView>
                {/* Logout button fixed at bottom left */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={28} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.squareButton} onPress={() => { resetForm(); setShowAddForm(true); }}>
                    <Text style={styles.squareButtonText}>+</Text>
                </TouchableOpacity>
            </ImageBackground>
        </GestureHandlerRootView>
    );
};
export default customers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    customerContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 16,
        marginBottom: 10,
    },
    customerDetails: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    customerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        color: '#007AFF',
        marginBottom: 2,
    },
    email: {
        fontSize: 14,
        color: '#777',
    },
    squareButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    squareButtonText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    deleteIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
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