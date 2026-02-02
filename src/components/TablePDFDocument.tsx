import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a nice font (optional, using Helvetica by default which is safe)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#FFFFFF',
        padding: 30, // Approx 1cm
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
    },
    cardWrapper: {
        width: '33.33%', // 3 columns
        padding: 10,
        height: 250, // Fixed height for consistency
    },
    card: {
        border: '2pt solid #0f172a', // slate-900
        borderRadius: 20,
        padding: 15,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    header: {
        width: '100%',
        textAlign: 'center',
        marginBottom: 5,
    },
    restaurantName: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#64748b', // slate-500
        marginBottom: 2,
    },
    tableNumber: {
        fontSize: 32,
        fontWeight: 'black',
        color: '#0f172a', // slate-900
    },
    qrContainer: {
        border: '3pt solid #0f172a',
        borderRadius: 12,
        padding: 5,
        marginVertical: 10,
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    footer: {
        width: '100%',
        textAlign: 'center',
        alignItems: 'center',
    },
    scanText: {
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94a3b8', // slate-400
        marginBottom: 5,
    },
    arBadge: {
        backgroundColor: '#eff6ff', // blue-50
        borderColor: '#dbeafe', // blue-100
        borderWidth: 1,
        borderRadius: 50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    arText: {
        color: '#2563eb', // blue-600
        fontSize: 7,
        fontWeight: 'heavy',
        textTransform: 'uppercase',
    },
});

interface TablePDFProps {
    restaurant: any;
    tables: any[];
}

export const TablePDFDocument: React.FC<TablePDFProps> = ({ restaurant, tables }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.grid}>
                {tables.map((table, index) => (
                    <View key={index} style={styles.cardWrapper} wrap={false}>
                        <View style={styles.card}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                                <Text style={styles.tableNumber}>{table.table_number}</Text>
                            </View>

                            {/* QR Code */}
                            {table.qrDataUrl && (
                                <View style={styles.qrContainer}>
                                    <Image src={table.qrDataUrl} style={styles.qrImage} />
                                </View>
                            )}

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.scanText}>Scannez pour commander</Text>
                                <View style={styles.arBadge}>
                                    <Text style={styles.arText}>Plats en 3D</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);
