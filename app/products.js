import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Image, SafeAreaView, Button, TextInput, Alert, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

const ProductListScreen = () => {
    const [products, setProducts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImage, setProductImage] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        setupDatabase().then(fetchProducts);
    }, []);

    const setupDatabase = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT
        )`
        );
    };

    const fetchProducts = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
        const allRows = await db.getAllAsync("SELECT * FROM products");
        setProducts(allRows);
    };

    const addProduct = async () => {
        if (productName && productPrice && productImage) {
            try {
                const db = await SQLite.openDatabaseAsync("mobileApps.db");
                await db.runAsync(
                    "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
                    [productName, parseFloat(productPrice), productImage]
                );
                setProductName('');
                setProductPrice('');
                setProductImage('');
                setShowAddForm(false);
                fetchProducts();
                Alert.alert("Product added!");
            } catch (e) {
                console.log('DB error:', e);
                Alert.alert("Error adding product", e.message);
            }
        } else {
            Alert.alert("Please enter a product name, price, and image.");
        }
    };

    const updateProduct = async () => {
        if (selectedProduct) {
            try {
                const db = await SQLite.openDatabaseAsync("mobileApps.db");
                await db.runAsync(
                    "UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?",
                    [productName, parseFloat(productPrice), productImage, selectedProduct.id]
                );
                setShowEditForm(false);
                fetchProducts();
                Alert.alert("Product updated!");
            } catch (e) {
                Alert.alert("Error updating product", e.message);
            }
        }
    };

    const deleteProduct = async (id) => {
        try {
            const db = await SQLite.openDatabaseAsync("mobileApps.db");
            await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
            fetchProducts();
            Alert.alert("Product deleted!");
        } catch (e) {
            Alert.alert("Error deleting product", e.message);
        }
    };

    const resetForm = () => {
        setProductName('');
        setProductPrice('');
        setProductImage('');
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedProduct(null);
    };

    const pickImage = async () => {
        // Ask for permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need camera roll permissions to select an image.');
            return;
        }
        // Launch image picker
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
            <SafeAreaView style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Product Name"
                    value={productName}
                    onChangeText={setProductName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Product Price"
                    value={productPrice}
                    onChangeText={setProductPrice}
                    keyboardType="numeric"
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
        );
    }

    if (showEditForm) {
        return (
            <SafeAreaView style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Product Name"
                    value={productName}
                    onChangeText={setProductName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Product Price"
                    value={productPrice}
                    onChangeText={setProductPrice}
                    keyboardType="numeric"
                />
                <Button title="Update" onPress={updateProduct} />
                <Button title="Back to Products" onPress={() => setShowEditForm(false)} />
            </SafeAreaView>
        );
    }

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
                    <Image source={{ uri: item.image }} style={styles.productImage} />
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <FlatList data={products} keyExtractor={item => item.id.toString()} renderItem={renderItem} />
                <TouchableOpacity style={styles.squareButton} onPress={() => { resetForm(); setShowAddForm(true); }}>
                    <Text style={styles.squareButtonText}>+</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

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
export default ProductListScreen;