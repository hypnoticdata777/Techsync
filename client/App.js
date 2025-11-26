import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';

const API_BASE_URL = 'http://localhost:8000';

function WorkOrderItem({item}) {
  return (
    <View style={styles.workOrderCard}>
      <Text style={styles.workOrderTitle}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.workOrderDescription}>{item.description}</Text>
      ) : null}
      <Text style={styles.workOrderMeta}>Status: {item.status}</Text>
    </View>
  );
}

function App() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/work-orders`);
        const json = await res.json();
        setWorkOrders(json);
      } catch (err) {
        console.error(err);
        setError('Unable to load work orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>TechSync</Text>
        <Text style={styles.subtitle}>
          Field Service Management • In Development
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Work Orders</Text>
        {loading && <ActivityIndicator />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && (
          <FlatList
            data={workOrders}
            keyExtractor={item => String(item.id)}
            renderItem={WorkOrderItem}
            ListEmptyComponent={
              <Text style={styles.emptyState}>
                No work orders yet – backend is running but database is empty.
              </Text>
            }
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with React Native + FastAPI + Supabase (MVP scaffold)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#050816'},
  header: {padding: 16, paddingTop: 24},
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#38bdf8',
  },
  subtitle: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 4,
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
  },
  workOrderCard: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  workOrderDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  workOrderMeta: {
    fontSize: 12,
    color: '#a3e635',
    marginTop: 6,
  },
  emptyState: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#f97373',
    marginTop: 8,
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#111827',
  },
  footerText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default App;
