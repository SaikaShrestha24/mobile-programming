import { useState } from 'react';
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const handleCancel = () => {
    setUsername('');
    setPassword('');
    Keyboard.dismiss();
  };

  const handleSignIn = () => {
    Keyboard.dismiss();
    setVisible(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.logo}>⚡</Text>

          <Text style={styles.appName}>
            EV Charge Hub
          </Text>

          <Text style={styles.tagline}>
            Smart EV Charging Anytime, Anywhere
          </Text>
        </View>

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Sign In
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.buttonContainer}>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
            >
              <Text style={styles.signInText}>
                Sign In
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>

              <Text style={styles.modalIcon}>⚡</Text>

              <Text style={styles.successTitle}>
                Signed In Successfully
              </Text>

              <Text style={styles.successText}>
                Welcome to EV Charge Hub
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.closeButtonText}>
                  Close
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>x

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: 'mintcream',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    fontSize: 70,
  },

  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'forestgreen',
  },

  tagline: {
    color: 'dimgray',
    marginTop: 8,
    textAlign: 'center',
  },

  card: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    elevation: 8,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'forestgreen',
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    backgroundColor: 'whitesmoke',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelButton: {
    width: '47%',
    borderWidth: 2,
    borderColor: 'forestgreen',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },

  cancelText: {
    color: 'forestgreen',
    fontWeight: 'bold',
  },

  signInButton: {
    width: '47%',
    backgroundColor: 'forestgreen',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },

  signInText: {
    color: 'white',
    fontWeight: 'bold',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: 300,
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },

  modalIcon: {
    fontSize: 60,
    marginBottom: 10,
  },

  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'forestgreen',
    marginBottom: 10,
  },

  successText: {
    color: 'dimgray',
    marginBottom: 20,
  },

  closeButton: {
    backgroundColor: 'forestgreen',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
  },

  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

});