import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Image, SafeAreaView, Button, TextInput, Alert, TouchableOpacity, RefreshControl, ImageBackground } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const products = () => {
    const dbRef = useRef(null);
    const [dbReady, setDbReady] = useState(false);
    const [products, setProducts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImage, setProductImage] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    // Initialize database and fetch products
    useEffect(() => {
        const init = async () => {
            dbRef.current = await SQLite.openDatabaseAsync("mobileApps.db");
            await setupDatabase();
            setDbReady(true);
            fetchProducts();
        };
        init();
    }, []);

    // Refresh handler for products list
    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setupDatabase().then(fetchProducts);
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

    // Fetch all products from the database
    const fetchProducts = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        const db = dbRef.current;
        const allRows = await db.getAllAsync("SELECT * FROM products");
        setProducts(allRows);
    };

    // Add a new product to the database
    const addProduct = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        if (productName && productPrice) {
            try {
                const db = dbRef.current;
                await db.runAsync(
                    "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
                    [productName, parseFloat(productPrice), productImage || null]
                );
                setProductName('');
                setProductPrice('');
                setProductImage('');
                setShowAddForm(false);
                fetchProducts();
                Alert.alert("Product added!");
            } catch (e) {
                console.log('DB error:', e);
                Alert.alert("Error adding product");
            }
        } else {
            Alert.alert("Please enter a product name and price.");
        }
    };

    // Update an existing product in the database
    const updateProduct = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        if (selectedProduct) {
            try {
                const db = dbRef.current;
                await db.runAsync(
                    "UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?",
                    [productName, parseFloat(productPrice), productImage, selectedProduct.id]
                );
                setShowEditForm(false);
                fetchProducts();
                Alert.alert("Product updated!");
            } catch (e) {
                Alert.alert("Error updating product");
            }
        }
    };

    // Delete a product from the database
    const deleteProduct = async (id) => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or refresh the page.');
            return;
        }
        try {
            const db = dbRef.current;
            await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
            fetchProducts();
            Alert.alert("Product deleted!");
        } catch (e) {
            Alert.alert("Error deleting product");
        }
    };

    // Reset form fields and state
    const resetForm = () => {
        setProductName('');
        setProductPrice('');
        setProductImage('');
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedProduct(null);
    };

    // Pick an image from the device library
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need camera roll permissions to select an image.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProductImage(result.assets[0].uri);
        }
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
                        placeholder="Product Name"
                        value={productName}
                        onChangeText={setProductName}
                        placeholderTextColor="#333"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Product Price"
                        value={productPrice}
                        onChangeText={setProductPrice}
                        keyboardType="numeric"
                        placeholderTextColor="#333"
                    />
                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                        <Text style={styles.imagePickerButtonText}>
                            {productImage ? 'Change Image' : 'Pick Image'}
                        </Text>
                    </TouchableOpacity>
                    {productImage ? (
                        <Image source={{ uri: productImage }} style={styles.previewImage} />
                    ) : null}
                    <Button title="Add" onPress={addProduct} />
                    <Button title="Back to Products" onPress={() => setShowAddForm(false)} />
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
                        placeholder="Product Name"
                        value={productName}
                        onChangeText={setProductName}
                        placeholderTextColor="#333"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Product Price"
                        value={productPrice}
                        onChangeText={setProductPrice}
                        keyboardType="numeric"
                        placeholderTextColor="#333"
                    />
                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                        <Text style={styles.imagePickerButtonText}>
                            {productImage ? 'Change Image' : 'Pick Image'}
                        </Text>
                    </TouchableOpacity>
                    {productImage ? (
                        <Image source={{ uri: productImage }} style={styles.previewImage} />
                    ) : null}
                    <Button title="Update" onPress={updateProduct} />
                    <Button title="Back to Products" onPress={() => setShowEditForm(false)} />
                </SafeAreaView>
            </ImageBackground>
        );
    }

    // Render swipeable delete action for each product
    const renderRightActions = (item) => (
        <TouchableOpacity
            style={styles.deleteIconContainer}
            onPress={() => {
                Alert.alert("Delete", "Are you sure you want to delete this product?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", onPress: () => deleteProduct(item.id), style: "destructive" }
                ]);
            }}>
            <MaterialIcons name="delete" size={28} color="red" />
        </TouchableOpacity>
    );

    // Render each product item
    const renderItem = ({ item }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)}>
            <TouchableOpacity onPress={() => {
                setSelectedProduct(item);
                setProductName(item.name);
                setProductPrice(item.price.toString());
                setProductImage(item.image);
                setShowEditForm(true);
            }}>
                <View style={styles.productContainer}>
                    <Image
                        source={
                            item.image
                                ? { uri: item.image }
                                : require('../assets/default-product.png')
                        }
                        style={styles.productImage}
                    />
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
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
                <SafeAreaView style={styles.overlay}>
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item.id.toString()}
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
                <TouchableOpacity
                    style={styles.squareButton}
                    onPress={() => { resetForm(); setShowAddForm(true); }}
                >
                    <Text style={styles.squareButtonText}>+</Text>
                </TouchableOpacity>
                {/* Logout button fixed at bottom left */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={28} color="#007AFF" />
                </TouchableOpacity>
            </ImageBackground>
        </GestureHandlerRootView>
    );
};

export default products;

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
    productContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 16,
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