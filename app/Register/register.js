import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View, SafeAreaView, TextInput, Alert, TouchableOpacity, } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

const Users = () => {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'login'

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Login form state
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    useEffect(() => {
        setupDatabase();
    }, []);

    const setupDatabase = async () => {
        const db = await SQLite.openDatabaseAsync("mobileApps.db");
        // await db.runAsync(`DROP TABLE IF EXISTS users`);  // remove for production
        await db.runAsync(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL
            )`
        );
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
            const db = await SQLite.openDatabaseAsync('mobileApps.db');

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
            Alert.alert('Error adding user', e.message);
        }
    };

    const loginUser = async () => {
        if (!loginUsername || !loginPassword) {
            Alert.alert('Please enter username and password.');
            return;
        }

        try {
            const db = await SQLite.openDatabaseAsync('mobileApps.db');

            const result = await db.getAllAsync(
                'SELECT * FROM users WHERE username = ? AND password = ?',
                [loginUsername, loginPassword]
            );

            if (result.length > 0) {
                Alert.alert('Login successful!', `Welcome back, ${result[0].name}!`);
                resetLoginForm();

                // Navigate to your desired screen
                router.push('/screens/products');  // adjust path as needed
            } else {
                Alert.alert('Invalid username or password');
            }
        } catch (e) {
            console.log('DB error:', e);
            Alert.alert('Error logging in', e.message);
        }
    };

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

                        <TouchableOpacity style={styles.registerButton} onPress={addUser}>
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
                        <TouchableOpacity style={styles.registerButton} onPress={loginUser}>
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