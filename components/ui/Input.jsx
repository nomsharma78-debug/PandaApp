import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon: Icon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  className = '',
}) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container} className={`space-y-1.5 ${className}`}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          multiline && { height: Math.max(80, numberOfLines * 24), alignItems: 'flex-start', paddingTop: 10 },
          isFocused && styles.inputContainerFocused,
          Boolean(error) && styles.inputContainerError,
        ]}
      >
        {Icon && <Icon size={18} color={isFocused ? '#2dd4bf' : '#94a3b8'} style={styles.icon} />}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, multiline && { textAlignVertical: 'top' }]}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeBtn}>
            {isSecure ? (
              <Eye size={18} color="#94a3b8" />
            ) : (
              <EyeOff size={18} color="#2dd4bf" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: '#2dd4bf',
    backgroundColor: '#0f172a',
  },
  inputContainerError: {
    borderColor: '#f43f5e',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#fb7185',
    marginTop: 4,
    marginLeft: 4,
  },
});
