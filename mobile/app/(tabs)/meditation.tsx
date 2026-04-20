import { Text, View, StyleSheet } from 'react-native';

export default function MeditationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meditation Before Bed 🌙</Text>

      <Text style={styles.text}>
        What are you most grateful for today?
      </Text>

      <Text style={styles.text}>
        Take 3 breaths for that… inhale… exhale…
      </Text>

      <Text style={styles.text}>
        What are you excited for tomorrow?
      </Text>

      <Text style={styles.footer}>
        Stay present. That’s enough.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  footer: {
    color: 'gray',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});