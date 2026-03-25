import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface BarcodeScannerProps {
  onScan: (data: string, type: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    // Reset ref when scanned state is reset (if ever)
    if (!scanned) {
      scannedRef.current = false;
    }
  }, [scanned]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.closeButton}>
             <Ionicons name="close" size={24} color="white" />
        </Pressable>
      </View>
    );
  }

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanned(true);
    onScan(result.data, result.type);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_e", "upc_a", "itf14", "code93", "pdf417", "aztec", "datamatrix"],
        }}
      />
      <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
             <View style={styles.header}>
                <Pressable onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Text style={styles.title}>Scan Barcode</Text>
             </View>
             
             <View style={styles.scanArea}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
             </View>
             
             <Text style={styles.instruction}>Align barcode within the frame</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  button: {
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      padding: 10,
  },
  overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
  },
  header: {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
  },
  backButton: {
      padding: 10,
  },
  title: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
  },
  scanArea: {
      width: 280,
      height: 280,
      backgroundColor: 'transparent',
      position: 'relative',
  },
  cornerTL: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 40,
      height: 40,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: 'white',
  },
  cornerTR: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 40,
      height: 40,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: 'white',
  },
  cornerBL: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 40,
      height: 40,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: 'white',
  },
  cornerBR: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 40,
      height: 40,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: 'white',
  },
  instruction: {
      color: 'white',
      marginTop: 20,
      fontSize: 16,
  }
});
