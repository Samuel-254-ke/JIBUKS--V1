import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Permission {
  id: string;
  label: string;
  enabled: boolean;
}

import apiService from '@/services/api';

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Added password field
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: '1', label: 'View transactions', enabled: false },
    { id: '2', label: 'View budgets', enabled: false },
    { id: '3', label: 'Add transactions', enabled: false },
    { id: '4', label: 'Manage budgets', enabled: false },
    // { id: '5', label: 'Invite members', enabled: false }, // Removed as per context
  ]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to select a photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const togglePermission = (id: string) => {
    setPermissions(prev =>
      prev.map(perm =>
        perm.id === id ? { ...perm, enabled: !perm.enabled } : perm
      )
    );
  };

  const handleAddMember = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the member\'s name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a temporary password');
      return;
    }

    // Map relationship to Role
    let role = 'MEMBER';
    const rel = relationship.toLowerCase();
    if (rel.includes('parent')) role = 'PARENT';
    else if (rel.includes('child') || rel.includes('kid')) role = 'CHILD';
    else if (rel.includes('admin')) role = 'ADMIN';

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);

      // Handle image upload
      if (profileImage) {
        if (Platform.OS === 'web') {
          // For web, fetch the blob
          try {
            const response = await fetch(profileImage);
            const blob = await response.blob();
            const filename = profileImage.split('/').pop() || 'profile.jpg';
            // @ts-ignore
            formData.append('profileImage', blob, filename);
          } catch (err) {
            console.error('Error processing image:', err);
          }
        } else {
          // For native platforms
          const filename = profileImage.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          // @ts-ignore
          formData.append('profileImage', { uri: profileImage, name: filename, type });
        }
      }

      console.log('Sending member data with image...');

      await apiService.addFamilyMember(formData);

      Alert.alert('Success', 'Family member added successfully! Check their email for login credentials.', [
        { text: 'OK', onPress: () => router.push({ pathname: '/family-setup', params: { refresh: 'true' } }) }
      ]);

    } catch (error: any) {
      console.error('Add member error:', error);
      Alert.alert('Error', error.error || error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#f59e0b" />
        </TouchableOpacity>
        <Text style={styles.subtitle}>Let's create your family space</Text>
      </LinearGradient>

      {/* White Card Section */}
      <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.addPhotoText}>Add Profile Photo</Text>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#9ca3af" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter members Name"
            placeholderTextColor="#d1d5db"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Relationship Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            placeholder="Parent"
            placeholderTextColor="#1f2937"
            value={relationship}
            onChangeText={setRelationship}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="member@example.com"
            placeholderTextColor="#d1d5db"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Temporary Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#d1d5db"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Access Permissions */}
        <View style={styles.permissionsSection}>
          <Text style={styles.label}>Access Permissions</Text>
          {permissions.map((permission) => (
            <TouchableOpacity
              key={permission.id}
              style={styles.permissionItem}
              onPress={() => togglePermission(permission.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, permission.enabled && styles.checkboxChecked]}>
                {permission.enabled && (
                  <Ionicons name="checkmark" size={18} color="#1e3a8a" />
                )}
              </View>
              <Text style={styles.permissionLabel}>{permission.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Send Invitation Button */}
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleAddMember}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>{loading ? 'Adding...' : 'Add Member'}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Apbc</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    padding: 4,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    alignSelf: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1f2937',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  permissionsSection: {
    marginBottom: 32,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#ffffff',
    borderColor: '#1e3a8a',
    borderWidth: 2,
  },
  permissionLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  sendButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
