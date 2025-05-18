import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Image, SafeAreaView, Button, TextInput, Alert, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

const customers = () => {
    const [customers, setCustomers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        setupDatabase().then(fetchCustomers);
    }, []);

    const setupDatabase = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT NOT NULL
        )`
        );
    };

    const fetchCustomers = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
        const allRows = await db.getAllAsync("SELECT * FROM customers");
        setCustomers(allRows);
    };

    const addCustomer = async () => {
        if (customerName && username && email) {
            try {
                const db = await SQLite.openDatabaseAsync("mobileApps.db");
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
                Alert.alert("Error adding customer", e.message);
            }
        } else {
            Alert.alert("Please enter a customer name, username, and email.");
        }
    };

    const updateCustomer = async () => {
        if (selectedCustomer) {
            try {
                const db = await SQLite.openDatabaseAsync("mobileApps.db");
                await db.runAsync(
                    "UPDATE customers SET name = ?, username = ?, email = ? WHERE id = ?",
                    [customerName, username, email, selectedCustomer.id]
                );
                setShowEditForm(false);
                fetchCustomers();
                Alert.alert("Customer updated!");
            } catch (e) {
                Alert.alert("Error updating customer", e.message);
            }
        }
    };

    const deleteCustomer = async (id) => {
        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
            fetchCustomers();
            Alert.alert("Customer deleted!");
        } catch (e) {
            Alert.alert("Error deleting Customer", e.message);
        }
    };

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
            <SafeAreaView style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />
                <Button title="Add" onPress={addCustomer} />
                <Button title="Back to Customers" onPress={() => setShowAddForm(false)} />
            </SafeAreaView>
        );
    }

    if (showEditForm) {
        return (
            <SafeAreaView style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />
                <Button title="Update" onPress={updateCustomer} />
                <Button title="Back to Customers" onPress={() => setShowEditForm(false)} />
            </SafeAreaView>
        );
    }

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

    const renderItem = ({ item }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)}>
            <TouchableOpacity onPress={() => {
                setSelectedCustomer(item);
                setCustomerName(item.name);
                setUsername(item.username);
                setEmail(item.email);
                setShowEditForm(true);
            }}>
                <View style={styles.productContainer}>
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>{item.username}</Text>
                         <Text style={styles.productPrice}>{item.email}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <FlatList data={customers} keyExtractor={item => item.id.toString()} renderItem={renderItem} />
                <TouchableOpacity style={styles.squareButton} onPress={() => { resetForm(); setShowAddForm(true); }}>
                    <Text style={styles.squareButtonText}>+</Text>
                </TouchableOpacity>
            </SafeAreaView>
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
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    productContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 5,
    },
    productDetails: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    productPrice: {
        fontSize: 16,
        color: 'green',
    },
    squareButton: {
        position: 'absolute',
        bottom: 30,
        right: 30, // <-- Move button to the right
        width: 60,
        height: 60,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        elevation: 4, // for Android shadow
        shadowColor: '#000', // for iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    squareButtonText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    imagePickerButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    imagePickerButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 10,
    },
    deleteIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
});