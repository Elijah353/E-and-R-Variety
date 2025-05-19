import { Tabs } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'

export default () => {
    return <Tabs screenOptions={{
        headerStyle: {
            backgroundColor: '#007AFF',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
            fontWeight: 'bold',
        },
        tabBarStyle: {
            backgroundColor: '#007AFF',
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'lighblue',
    }}>
        <Tabs.Screen name="products" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="tags" size={24} color={color} />,
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
        <Tabs.Screen name="orderSummary" options={{
            tabBarIcon: ({ color }) =>
                <FontAwesome name="history" size={24} color={color} />,
            title: 'Order Summary',
        }} />
    </Tabs>
} 