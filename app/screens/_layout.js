import { Tabs } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'

export default () => {
    return <Tabs screenOptions={{
        headerStyle: {
            backgroundColor: 'lightblue',
        },
        headerTintColor: 'black',
        headerTitleStyle: {
            fontWeight: 'bold',
        },
        tabBarStyle: {
            backgroundColor: 'lightblue',
        },
        tabBarActiveTintColor: 'blue',
    }}>
        <Tabs.Screen name="index" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="home" size={24} color={color} />,
            title: 'Home',
        }} />
        <Tabs.Screen name="products" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="shopping-cart" size={24} color={color} />,
            title: 'Products',
        }} />
        <Tabs.Screen name="customers" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="users" size={24} color={color} />,
            title: 'Customers',
        }} />
        <Tabs.Screen name="place_an_order" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="shopping-cart" size={24} color={color} />,
            title: 'Place Order',
        }} />
        {/* <Tabs.Screen name="extra" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="briefcase" size={24} color={color} />,
            title: 'Extra',
            headerShown: false
        }} /> */}
        {/* <Tabs.Screen name="store" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="server" size={24} color={color} />,
            title: 'AsyncStorage',
        }} />
        <Tabs.Screen name="sqlite" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="gear" size={24} color={color} />,
            title: 'SQLite',
        }} /> */}
    </Tabs>
} 