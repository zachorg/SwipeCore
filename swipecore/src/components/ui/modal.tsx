import React, { useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ReactNativeModal: React.FC<ModalProps> = React.memo(
  ({ visible, onClose, title, children }) => {
    const handleOverlayPress = useCallback(() => {
      onClose();
    }, [onClose]);

    const handleModalPress = useCallback((e: any) => {
      e.stopPropagation();
    }, []);

    const modalStyle = useMemo(
      () => [
        styles.modalContainer,
        { transform: [{ scale: visible ? 1 : 0.9 }] },
      ],
      [visible]
    );

    return (
      <Modal
        visible={visible}
        onRequestClose={onClose}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleOverlayPress}
        >
          <TouchableOpacity
            style={modalStyle}
            activeOpacity={1}
            onPress={handleModalPress}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.content}>{children}</View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  content: {
    width: "100%",
  },
});
