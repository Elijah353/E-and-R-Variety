import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, SafeAreaView, TextInput, Alert, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


const CustomCheckBox = ({ value, onValueChange }) => (
    <TouchableOpacity
        onPress={() => onValueChange(!value)}
        style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: '#007AFF',
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: value ? '#007AFF' : 'white',
        }}
    >
        {value ? (
            <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>
        ) : null}
    </TouchableOpacity>
);

const Users = () => {
    const router = useRouter();
    const dbRef = useRef(null);
    const [dbReady, setDbReady] = useState(false);

    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'login'

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Login form state
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const initialize = async () => {
        dbRef.current = await SQLite.openDatabaseAsync("mobileApps.db");
        await setupDatabase();
        setDbReady(true);
        checkLogin();
    };

    useEffect(() => {
        initialize();
    }, []);

    const checkLogin = async () => {
        const user = await AsyncStorage.getItem('loggedInUser');
        if (user) {
            // Navigate to your main screen
            router.push('/screens/products');
        }
    };

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

    const resetRegisterForm = () => {
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const resetLoginForm = () => {
        setLoginUsername('');
        setLoginPassword('');
    };

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const addUser = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or restart the application.');
            return;
        }
        if (!name || !username || !email || !password || !confirmPassword) {
            Alert.alert('Please fill all registration fields.');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Passwords do not match.');
            return;
        }

        try {
            const db = dbRef.current;

            const existingUsers = await db.getAllAsync(
                'SELECT * FROM users WHERE email = ? OR username = ?',
                [email, username]
            );

            if (existingUsers.length > 0) {
                // Check which field is duplicated
                const emailExists = existingUsers.some(user => user.email === email);
                const usernameExists = existingUsers.some(user => user.username === username);

                if (emailExists && usernameExists) {
                    Alert.alert('This email and username are already registered.');
                } else if (emailExists) {
                    Alert.alert('This email is already registered.');
                } else if (usernameExists) {
                    Alert.alert('This username is already taken.');
                }
                return;
            }

            await db.runAsync(
                'INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)',
                [name, username, email, password]
            );

            Alert.alert('User registered!');
            resetRegisterForm();
            setActiveTab('login');
        } catch (e) {
            console.log('DB error:', e);
            Alert.alert('Error adding user');
        }
    };

    const loginUser = async () => {
        if (!dbReady) {
            Alert.alert('Please try again in a moment or restart the application.');
            return;
        }
        if (!loginUsername || !loginPassword) {
            Alert.alert('Please enter username and password.');
            return;
        }

        try {
            const db = dbRef.current;

            const result = await db.getAllAsync(
                'SELECT * FROM users WHERE username = ? AND password = ?',
                [loginUsername, loginPassword]
            );

            if (result.length > 0) {
                Alert.alert('Login successful!', `Welcome back, ${result[0].name}!`);
                resetLoginForm();

                if (rememberMe) {
                    await AsyncStorage.setItem('loggedInUser', loginUsername);
                } else {
                    await AsyncStorage.removeItem('loggedInUser');
                }

                // Navigate to your desired screen
                router.push('/screens/products');  // adjust path as needed
            } else {
                Alert.alert('Invalid username or password');
            }
        } catch (e) {
            console.log('DB error:', e);
            Alert.alert('Error logging in');
        }
    };

    if (!dbReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f2' }}>
                <Text style={{ fontSize: 18, color: '#007AFF' }}>Preparing app...</Text>
                <TouchableOpacity onPress={initialize} style={{ marginTop: 20, padding: 10, backgroundColor: '#007AFF', borderRadius: 8 }}>
                    <Text style={{ color: 'white' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }


    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'register' && styles.activeTab]}
                        onPress={() => setActiveTab('register')}
                    >
                        <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                            Register
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                        onPress={() => setActiveTab('login')}
                    >
                        <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                            Login
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'register' ? (
                    <View style={styles.formContainer}>
                        <TextInput
                            placeholder="Full Name"
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            placeholder="Username"
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            placeholder="Email"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            placeholder="Password"
                            secureTextEntry
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            placeholder="Confirm Password"
                            secureTextEntry
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor="#999"
                        />

                        <TouchableOpacity
                            style={[
                                styles.registerButton,
                                !dbReady && { backgroundColor: '#aaa' } // visually indicate disabled
                            ]}
                            onPress={addUser}
                            disabled={!dbReady} // <-- disable if db not ready
                        >
                            <Text style={styles.registerButtonText}>Register</Text>
                        </TouchableOpacity>

                    </View>
                ) : (
                    <View style={styles.formContainer}>
                        <TextInput
                            placeholder="Username"
                            style={styles.input}
                            value={loginUsername}
                            onChangeText={setLoginUsername}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            placeholder="Password"
                            secureTextEntry
                            style={styles.input}
                            value={loginPassword}
                            onChangeText={setLoginPassword}
                            placeholderTextColor="#999"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <CustomCheckBox
                                value={rememberMe}
                                onValueChange={setRememberMe}
                            />
                            <Text style={{ marginLeft: 8 }}>Remember Me</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.registerButton,
                                !dbReady && { backgroundColor: '#aaa' }
                            ]}
                            onPress={loginUser}
                            disabled={!dbReady}
                        >
                            <Text style={styles.registerButtonText}>Login</Text>
                        </TouchableOpacity>

                    </View>
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

export default Users;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        justifyContent: 'center',
        width: 320,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        elevation: 2,
    },
    activeTab: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
        width: 320,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
    },
    registerButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});