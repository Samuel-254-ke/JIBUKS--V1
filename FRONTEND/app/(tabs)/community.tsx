import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock community data
// TODO: Replace with real API calls when backend is ready
const mockCommunity = {
  members: [
    { id: 1, name: "John Doe", status: "online" as const, avatar: null, lastActive: "Just now", role: "Admin" },
    { id: 2, name: "Sarah", status: "online" as const, avatar: null, lastActive: "5 min ago", role: "Parent" },
    { id: 3, name: "David", status: "offline" as const, avatar: null, lastActive: "2 hours ago", role: "Child" },
    { id: 4, name: "Grace", status: "offline" as const, avatar: null, lastActive: "1 day ago", role: "Parent" },
  ],
  announcements: [
    { id: 1, title: "Family Meeting", message: "Let's discuss the new car fund this weekend. Everyone's input is valuable!", date: "Today", author: "John" },
    { id: 2, title: "Budget Update", message: "We're 60% through this month's budget. Great job everyone on staying on track!", date: "Yesterday", author: "System" },
    { id: 3, title: "New Goal Created", message: "Sarah created a new family goal: Summer Vacation Fund", date: "2 days ago", author: "System" },
  ],
  recentActivity: [
    { id: 1, member: "Sarah", action: "added an expense", detail: "Supermarket - KES 2,400", time: "3:24 PM" },
    { id: 2, member: "John", action: "received income", detail: "Salary - KES 50,000", time: "12:00 PM" },
    { id: 3, member: "David", action: "contributed to goal", detail: "New Car Fund - KES 5,000", time: "9:15 AM" },
  ]
};

export default function CommunityScreen() {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[id % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Family Community</Text>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Family Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <Text style={styles.memberCount}>{mockCommunity.members.length} members</Text>
          </View>

          <View style={styles.membersGrid}>
            {mockCommunity.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                activeOpacity={0.7}
              >
                <View style={styles.memberAvatarContainer}>
                  <View style={[styles.memberAvatar, { backgroundColor: getAvatarColor(member.id) }]}>
                    <Text style={styles.memberInitials}>{getInitials(member.name)}</Text>
                  </View>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: member.status === 'online' ? '#10b981' : '#9ca3af' }
                  ]} />
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberLastActive}>{member.lastActive}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Announcements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {mockCommunity.announcements.map((announcement) => (
            <TouchableOpacity
              key={announcement.id}
              style={styles.announcementCard}
              activeOpacity={0.7}
            >
              <View style={styles.announcementHeader}>
                <View style={styles.announcementIconContainer}>
                  <Ionicons name="megaphone" size={20} color="#2563eb" />
                </View>
                <View style={styles.announcementHeaderText}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementMeta}>
                    {announcement.date} · by {announcement.author}
                  </Text>
                </View>
              </View>
              <Text style={styles.announcementMessage}>{announcement.message}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.activityCard}>
            {mockCommunity.recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityLine} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityMember}>{activity.member}</Text>
                    {' '}{activity.action}
                  </Text>
                  <Text style={styles.activityDetail}>{activity.detail}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Coming Soon Features */}
        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <Ionicons name="chatbubbles" size={64} color="#cbd5e1" />
            <Text style={styles.comingSoonTitle}>More Features Coming Soon!</Text>
            <Text style={styles.comingSoonText}>
              We're building exciting new ways for your family to connect and collaborate:
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubbles-outline" size={20} color="#2563eb" />
                <Text style={styles.featureText}>Family group chat</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="document-text-outline" size={20} color="#2563eb" />
                <Text style={styles.featureText}>Shared notes and lists</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="calendar-outline" size={20} color="#2563eb" />
                <Text style={styles.featureText}>Family calendar</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="notifications-outline" size={20} color="#2563eb" />
                <Text style={styles.featureText}>Real-time notifications</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="camera-outline" size={20} color="#2563eb" />
                <Text style={styles.featureText}>Photo sharing</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="trophy-outline" size={20} color="#2563eb" />
                <Text style={styles.featureText}>Family achievements</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  memberCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  memberLastActive: {
    fontSize: 11,
    color: '#9ca3af',
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  announcementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementHeaderText: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  announcementMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  announcementMessage: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  activityLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
    marginTop: 4,
  },
  activityLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  activityMember: {
    fontWeight: '600',
    color: '#1f2937',
  },
  activityDetail: {
    fontSize: 13,
    color: '#2563eb',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
    fontWeight: '500',
  },
});
