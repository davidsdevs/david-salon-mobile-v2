import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../components/ScreenWrapper';
import useAuth from '../../hooks/useAuth';
import { APP_CONFIG, FONTS } from '../../constants';
import { Reward, Promotion } from '../../types';

const { width } = Dimensions.get('window');
const isIPhone = Platform.OS === 'ios';

export default function RewardsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();


  const promotions: Promotion[] = [
    {
      id: 1,
      title: 'Birthday Month Special',
      description: 'Get 25% off all services during your birthday month',
      validUntil: '2024-02-29',
      discount: '25% OFF',
      buttonText: 'Use Now',
      buttonStyle: 'outline'
    },
    {
      id: 2,
      title: 'Bring a Friend',
      description: 'Both you and your friend get 15% off when booking together',
      validUntil: '2024-03-31',
      discount: '15% OFF',
      buttonText: 'Use Now',
      buttonStyle: 'outline'
    }
  ];

  const rewards: Reward[] = [
    {
      id: 1,
      title: 'Free Hair Cut',
      description: 'Redeem with 1000 points',
      points: '1000 pts',
      buttonText: 'Redeem Now',
      buttonStyle: 'filled',
      available: true
    },
    {
      id: 2,
      title: '20% Off Hair Color',
      description: 'Redeem with 800 points',
      points: '800 pts',
      buttonText: 'Redeem Now',
      buttonStyle: 'filled',
      available: true
    },
    {
      id: 3,
      title: 'Free Facial Treatment',
      description: 'Need 1500 points (250 more)',
      points: '1500 pts',
      buttonText: 'Redeem Now',
      buttonStyle: 'disabled',
      available: false
    }
  ];

  // For web, render without ScreenWrapper to avoid duplicate headers
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Rewards & Loyalty Section */}
        <View style={styles.section}>
          <Text style={styles.rewardsLoyaltyTitle}>Rewards & Loyalty</Text>
        
          {/* Gold Member Card */}
          <LinearGradient
          colors={['#160B53', '#2D1B69', '#4A2C8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.membershipCard}
        >
          <View style={styles.membershipTop}>
            <View style={styles.membershipLeft}>
              <Text style={styles.membershipTitle}>{user?.membershipLevel || 'Gold'} Member</Text>
              <Text style={styles.membershipSince}>Member since {user?.memberSince || '2022'}</Text>
            </View>
            <View style={styles.membershipRight}>
              <Text style={styles.pointsValue}>{user?.points || 1250}</Text>
              <Text style={styles.pointsLabel}>Points</Text>
            </View>
          </View>
          
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Progress to Platinum</Text>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#FFFFFF', '#E8E8E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </View>
          </View>

          {/* Bottom Section - Key Metrics */}
          <View style={styles.metricsSection}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>24</Text>
              <Text style={styles.membershipMetricLabel}>Total Visits</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>3</Text>
              <Text style={styles.membershipMetricLabel}>Referrals</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>₱2850</Text>
              <Text style={styles.membershipMetricLabel}>Total Earned</Text>
            </View>
          </View>
        </LinearGradient>
        </View>

        {/* Referral Program */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="person" size={20} color="#160B53" />
            </View>
            <Text style={styles.sectionTitle}>Referral Program</Text>
          </View>
          
          <View style={styles.referralCard}>
            <View style={styles.referralContent}>
              <Text style={styles.referralTitle}>Invite Friends & Earn Rewards</Text>
              <Text style={styles.referralDescription}>
                Share your referral code and both you and your friend get 15% off your next service!
              </Text>
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeLabel}>Your Code:</Text>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCode}>DAVID2024</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Ionicons name="copy" size={16} color="#160B53" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Current Promotions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="pricetag" size={20} color="#160B53" />
            </View>
            <Text style={styles.sectionTitle}>Current Promotions</Text>
          </View>
          
          <View style={styles.promotionsContainer}>
            {promotions.map((promotion) => (
              <View key={promotion.id} style={styles.promotionCard}>
                <View style={styles.promotionContent}>
                  <Text style={styles.promotionTitle}>{promotion.title}</Text>
                  <Text style={styles.promotionDescription}>{promotion.description}</Text>
                  <Text style={styles.promotionValid}>Valid until {promotion.validUntil}</Text>
                </View>
                <View style={styles.promotionRight}>
                  <Text style={styles.promotionDiscount}>{promotion.discount}</Text>
                  <TouchableOpacity style={styles.promotionButton}>
                    <Text style={styles.promotionButtonText}>{promotion.buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Available Rewards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="gift" size={20} color="#160B53" />
            </View>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
          </View>
          
          <View style={styles.rewardsContainer}>
            {rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                  <Text style={styles.rewardPoints}>{reward.points}</Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.rewardButton,
                    reward.buttonStyle === 'filled' && styles.rewardButtonFilled,
                    reward.buttonStyle === 'disabled' && styles.rewardButtonDisabled
                  ]}
                  disabled={!reward.available}
                >
                  <Text style={[
                    styles.rewardButtonText,
                    reward.buttonStyle === 'filled' && styles.rewardButtonTextFilled,
                    reward.buttonStyle === 'disabled' && styles.rewardButtonTextDisabled
                  ]}>
                    {reward.buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // For mobile, use ScreenWrapper with header
  return (
    <ScreenWrapper title="Rewards">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Rewards & Loyalty Section */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.rewardsLoyaltyTitle}>Rewards & Loyalty</Text>
          
          {/* Gold Member Card */}
          <LinearGradient
            colors={['#160B53', '#2D1B69', '#4A2C8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.membershipCard}
          >
            {/* Top Section - Membership & Points */}
            <View style={styles.membershipTop}>
              <View style={styles.membershipLeft}>
                <Text style={styles.membershipTitle}>{user?.membershipLevel || 'Gold'} Member</Text>
                <Text style={styles.membershipSince}>Member since {user?.memberSince || '2022'}</Text>
              </View>
              <View style={styles.membershipRight}>
                <Text style={styles.pointsValue}>{user?.points || 1250}</Text>
                <Text style={styles.pointsLabel}>Points</Text>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress to Platinum</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#FFFFFF', '#E8E8E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill}
                />
              </View>
            </View>

            {/* Bottom Section - Key Metrics */}
            <View style={styles.metricsSection}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>24</Text>
                <Text style={styles.membershipMetricLabel}>Total Visits</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>3</Text>
                <Text style={styles.membershipMetricLabel}>Referrals</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>₱2850</Text>
                <Text style={styles.membershipMetricLabel}>Total Earned</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Referral Program */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="person" size={20} color="#160B53" />
            </View>
            <Text style={styles.sectionTitle}>Referral Program</Text>
          </View>
          
          <View style={styles.referralCard}>
            <View style={styles.referralContent}>
              <Text style={styles.referralTitle}>Invite Friends & Earn Rewards</Text>
              <Text style={styles.referralDescription}>
                Share your referral code and both you and your friend get 15% off your next service!
              </Text>
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeLabel}>Your Code:</Text>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCode}>DAVID2024</Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Ionicons name="copy" size={16} color="#160B53" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Current Promotions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="pricetag" size={20} color="#160B53" />
            </View>
            <Text style={styles.sectionTitle}>Current Promotions</Text>
          </View>
          
          <View style={styles.promotionsContainer}>
            {promotions.map((promotion) => (
              <View key={promotion.id} style={styles.promotionCard}>
                <View style={styles.promotionContent}>
                  <Text style={styles.promotionTitle}>{promotion.title}</Text>
                  <Text style={styles.promotionDescription}>{promotion.description}</Text>
                  <Text style={styles.promotionValid}>Valid until {promotion.validUntil}</Text>
                </View>
                <View style={styles.promotionRight}>
                  <Text style={styles.promotionDiscount}>{promotion.discount}</Text>
                  <TouchableOpacity style={styles.promotionButton}>
                    <Text style={styles.promotionButtonText}>{promotion.buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Available Rewards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="gift" size={20} color="#160B53" />
            </View>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
          </View>
          
          <View style={styles.rewardsContainer}>
            {rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardContent}>
                  <View style={styles.rewardLeft}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardPoints}>{reward.points}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.rewardButton,
                    reward.buttonStyle === 'filled' && styles.rewardButtonFilled,
                    reward.buttonStyle === 'disabled' && styles.rewardButtonDisabled
                  ]}
                  disabled={!reward.available}
                >
                  <Text style={[
                    styles.rewardButtonText,
                    reward.buttonStyle === 'filled' && styles.rewardButtonTextFilled,
                    reward.buttonStyle === 'disabled' && styles.rewardButtonTextDisabled
                  ]}>
                    {reward.buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: '100%',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: isIPhone ? 130 : 110,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingVertical: isIPhone ? 12 : 15,
    paddingTop: isIPhone ? 50 : 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  headerDate: {
    fontSize: 13,
    color: '#666',
    fontFamily: FONTS.regular,
  },
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    marginBottom: Platform.OS === 'web' ? 24 : 16, // Reduced spacing for mobile
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Platform.OS === 'web' ? 16 : 12, // Reduced spacing for mobile
    gap: 8,
  },
  sectionIconContainer: {
    marginTop: Platform.OS === 'web' ? 2 : 0,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : Platform.OS === 'android' ? 14 : 16,
    color: Platform.OS === 'web' ? '#000000' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 16 : 12,
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : 'Poppins_600SemiBold',
  },
  rewardsLoyaltyTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : Platform.OS === 'android' ? 16 : 20,
    color: Platform.OS === 'web' ? '#160B53' : '#160B53',
    marginLeft: Platform.OS === 'web' ? 0 : 8,
    marginBottom: Platform.OS === 'web' ? 16 : 16,
    fontFamily: Platform.OS === 'web' ? 'Poppins_700Bold' : FONTS.bold,
  },
  membershipCard: {
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 18 : 20,
    marginBottom: 16,
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 8,
  },
  membershipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  membershipLeft: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: Platform.OS === 'android' ? 18 : Platform.OS === 'ios' ? 19 : 20,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  membershipSince: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: FONTS.regular,
  },
  membershipRight: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: Platform.OS === 'android' ? 28 : Platform.OS === 'ios' ? 30 : 32,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  pointsLabel: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: FONTS.regular,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '75%',
    borderRadius: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: Platform.OS === 'android' ? 18 : Platform.OS === 'ios' ? 19 : 20,
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  membershipMetricLabel: {
    fontSize: Platform.OS === 'android' ? 10 : Platform.OS === 'ios' ? 11 : 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  referralCode: {
    fontSize: Platform.OS === 'android' ? 14 : Platform.OS === 'ios' ? 15 : 16,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  referralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 14 : 16,
    marginBottom: Platform.OS === 'web' ? 16 : 12, // Reduced spacing for mobile
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  referralContent: {
    flex: 1,
  },
  referralTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 16 : Platform.OS === 'ios' ? 17 : 18,
    color: Platform.OS === 'web' ? 'rgb(0, 0, 0)' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 16 : 8,
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : FONTS.bold,
  },
  referralDescription: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  referralCodeLabel: {
    fontSize: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 13 : 14,
    color: '#160B53',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  copyButton: {
    padding: 8,
  },
  referralMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  referralMetric: {
    alignItems: 'center',
    flex: 1,
  },
  referralMetricValue: {
    fontSize: 20,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  referralMetricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  referralButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#160B53',
    borderRadius: 8,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontFamily: FONTS.semiBold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#160B53',
    borderRadius: 8,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#160B53',
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontFamily: FONTS.semiBold,
  },
  howItWorks: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
  },
  howItWorksTitle: {
    fontSize: 14,
    color: '#160B53',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  howItWorksItem: {
    fontSize: 13,
    color: '#160B53',
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  promotionCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: Platform.OS === 'web' ? 12 : 8, // Reduced spacing for mobile
  },
  promotionsContainer: {
    gap: Platform.OS === 'web' ? 12 : 8, // Reduced gap for mobile
  },
  promotionContent: {
    flex: 1,
    marginRight: 12,
  },
  promotionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 16,
    color: Platform.OS === 'web' ? 'rgb(0, 0, 0)' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 16 : 4,
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : FONTS.bold,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  promotionValid: {
    fontSize: 12,
    color: '#160B53',
    fontFamily: FONTS.semiBold,
  },
  promotionRight: {
    alignItems: 'flex-end',
  },
  promotionDiscount: {
    fontSize: 18,
    color: '#160B53',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  promotionButton: {
    backgroundColor: '#160B53',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    borderRadius: 6,
  },
  promotionButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontFamily: FONTS.semiBold,
  },
  rewardsContainer: {
    gap: Platform.OS === 'android' ? 8 : 12, // Reduced gap for Android
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 14 : 16, // Reduced padding for Android
    marginBottom: Platform.OS === 'web' ? 12 : 8, // Reduced spacing for mobile
    shadowColor: Platform.OS === 'web' ? '#000000' : '#000',
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
  rewardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardLeft: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 14 : 16, // Smaller for Android
    color: Platform.OS === 'web' ? 'rgb(0, 0, 0)' : '#160B53',
    marginBottom: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 2 : 4, // Reduced margin for Android
    fontFamily: Platform.OS === 'web' ? 'Poppins_600SemiBold' : FONTS.bold,
  },
  rewardPoints: {
    fontSize: Platform.OS === 'android' ? 12 : 14, // Smaller for Android
    color: '#160B53',
    marginBottom: Platform.OS === 'android' ? 4 : 8, // Reduced margin for Android
    fontFamily: FONTS.semiBold,
  },
  rewardDescription: {
    fontSize: Platform.OS === 'android' ? 12 : 14, // Smaller for Android
    color: '#666',
    lineHeight: Platform.OS === 'android' ? 16 : 20, // Smaller line height for Android
    fontFamily: FONTS.regular,
  },
  rewardButton: {
    borderWidth: 1,
    borderColor: '#160B53',
    borderRadius: 6,
    paddingHorizontal: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 10 : 12, // Smaller for Android
    paddingVertical: Platform.OS === 'web' ? 8 : Platform.OS === 'android' ? 4 : 6, // Smaller for Android
  },
  rewardButtonFilled: {
    backgroundColor: '#160B53',
    borderColor: '#160B53',
  },
  rewardButtonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  rewardButtonText: {
    color: '#160B53',
    fontSize: Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 9 : 10, // Smaller for Android
    fontFamily: FONTS.semiBold,
  },
  rewardButtonTextFilled: {
    color: '#FFFFFF',
  },
  rewardButtonTextDisabled: {
    color: '#999',
  },
  metricsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
