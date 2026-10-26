import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Share,
  Alert,
  Platform,
  Vibration,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const { width, height } = Dimensions.get('window');

// تنظیمات اعلان‌ها
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  // State های اصلی
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastDate, setLastDate] = useState('');
  
  // State های UI
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');
  
  // State های پیشرفته
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [targets, setTargets] = useState([
    { id: 1, name: 'هدف روزانه', count: 100, completed: false },
    { id: 2, name: 'هدف هفتگی', count: 700, completed: false },
    { id: 3, name: 'هدف ماهانه', count: 3000, completed: false },
  ]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState([]);
  
  // Animated Values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const ribbonAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // صدا
  const [sound, setSound] = useState();
  
  // تم‌های رنگی
  const themes = [
    {
      name: 'کلاسیک',
      gradient: ['#667eea', '#764ba2', '#f093fb'],
      accent: '#ffd700',
      text: '#ffffff',
      card: 'rgba(255,255,255,0.15)',
    },
    {
      name: 'سبز اسلامی',
      gradient: ['#11998e', '#38ef7d', '#06beb6'],
      accent: '#ffd700',
      text: '#ffffff',
      card: 'rgba(255,255,255,0.15)',
    },
    {
      name: 'طلایی',
      gradient: ['#f7971e', '#ffd200', '#f7971e'],
      accent: '#ffffff',
      text: '#333333',
      card: 'rgba(255,255,255,0.2)',
    },
    {
      name: 'شب',
      gradient: ['#0f2027', '#203a43', '#2c5364'],
      accent: '#4facfe',
      text: '#ffffff',
      card: 'rgba(255,255,255,0.1)',
    },
    {
      name: 'بنفش',
      gradient: ['#6a3093', '#a044ff', '#e14fad'],
      accent: '#ffd700',
      text: '#ffffff',
      card: 'rgba(255,255,255,0.15)',
    },
    {
      name: 'آبی آسمانی',
      gradient: ['#4facfe', '#00f2fe', '#43e97b'],
      accent: '#ffd700',
      text: '#ffffff',
      card: 'rgba(255,255,255,0.15)',
    },
  ];

  const currentTheme = themes[selectedTheme];

  // دستاوردها
  const allAchievements = [
    { id: 1, title: 'آغاز سفر', description: '10 صلوات اول', requirement: 10, icon: '🌱', unlocked: false },
    { id: 2, title: 'با انگیزه', description: '50 صلوات', requirement: 50, icon: '⭐', unlocked: false },
    { id: 3, title: 'پرشور', description: '100 صلوات', requirement: 100, icon: '🔥', unlocked: false },
    { id: 4, title: 'متعهد', description: '250 صلوات', requirement: 250, icon: '💎', unlocked: false },
    { id: 5, title: 'استقامت', description: '500 صلوات', requirement: 500, icon: '👑', unlocked: false },
    { id: 6, title: 'قهرمان', description: '1000 صلوات', requirement: 1000, icon: '🏆', unlocked: false },
    { id: 7, title: 'افسانه', description: '2500 صلوات', requirement: 2500, icon: '🌟', unlocked: false },
    { id: 8, title: 'نابغه', description: '5000 صلوات', requirement: 5000, icon: '✨', unlocked: false },
    { id: 9, title: 'استاد', description: '10000 صلوات', requirement: 10000, icon: '🎯', unlocked: false },
    { id: 10, title: 'روزمرّه', description: '7 روز پیاپی', requirement: 7, icon: '📅', type: 'streak', unlocked: false },
    { id: 11, title: 'ماه کامل', description: '30 روز پیاپی', requirement: 30, icon: '🌙', type: 'streak', unlocked: false },
    { id: 12, title: 'هدف‌گیر', description: 'رسیدن به هدف روزانه 10 بار', requirement: 10, icon: '🎪', type: 'goals', unlocked: false },
  ];

  // انیمیشن‌های چرخشی
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ribbonAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // بارگذاری داده‌ها
  useEffect(() => {
    loadData();
    setupNotifications();
  }, []);

  // ذخیره خودکار
  useEffect(() => {
    if (autoSave) {
      saveData();
    }
  }, [count, totalCount, currentStreak, longestStreak]);

  // بررسی روز جدید
  useEffect(() => {
    checkNewDay();
  }, []);

  // محاسبه پیشرفت
  useEffect(() => {
    const progress = Math.min(count / dailyGoal, 1);
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
    }).start();
  }, [count, dailyGoal]);

  // محاسبه سطح
  useEffect(() => {
    const newLevel = Math.floor(totalCount / 100) + 1;
    const newXp = totalCount % 100;
    setCurrentLevel(newLevel);
    setXp(newXp);
  }, [totalCount]);

  // بررسی دستاوردها
  useEffect(() => {
    checkAchievements();
  }, [totalCount, currentStreak]);

  const setupNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
    }

    if (dailyReminder) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'یادآوری صلوات 🌟',
          body: 'فراموش نکن امروز صلوات بفرست!',
          sound: true,
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });
    }
  };

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('salawatData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setCount(data.count || 0);
        setTotalCount(data.totalCount || 0);
        setDailyGoal(data.dailyGoal || 100);
        setCurrentStreak(data.currentStreak || 0);
        setLongestStreak(data.longestStreak || 0);
        setLastDate(data.lastDate || '');
        setHistory(data.history || []);
        setAchievements(data.achievements || []);
        setSelectedTheme(data.selectedTheme || 0);
        setSoundEnabled(data.soundEnabled !== false);
        setVibrationEnabled(data.vibrationEnabled !== false);
        setTargets(data.targets || targets);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      const data = {
        count,
        totalCount,
        dailyGoal,
        currentStreak,
        longestStreak,
        lastDate,
        history,
        achievements,
        selectedTheme,
        soundEnabled,
        vibrationEnabled,
        targets,
      };
      await AsyncStorage.setItem('salawatData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const checkNewDay = () => {
    const today = new Date().toDateString();
    if (lastDate && lastDate !== today) {
      // روز جدید
      if (count >= dailyGoal) {
        // هدف روزانه محقق شده
        setCurrentStreak(currentStreak + 1);
        if (currentStreak + 1 > longestStreak) {
          setLongestStreak(currentStreak + 1);
        }
      } else {
        // هدف محقق نشده - ریست استریک
        setCurrentStreak(0);
      }
      
      // ذخیره تاریخچه
      const newHistory = [...history, { date: lastDate, count, goal: dailyGoal }];
      setHistory(newHistory.slice(-30)); // نگه داشتن 30 روز اخیر
      
      setCount(0);
    }
    setLastDate(today);
  };

  const playSound = async () => {
    if (!soundEnabled) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
        { shouldPlay: true }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Sound error:', error);
    }
  };

  const createParticle = () => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * width,
      y: height / 2,
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
    }));

    setParticles(prev => [...prev, ...newParticles]);

    newParticles.forEach(particle => {
      Animated.parallel([
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: -200,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setParticles(prev => prev.filter(p => p.id !== particle.id));
      });
    });
  };

  const handlePress = () => {
    // انیمیشن فشار
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // چرخش
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    // افزایش شمارش
    const newCount = count + 1;
    const newTotalCount = totalCount + 1;
    
    setCount(newCount);
    setTotalCount(newTotalCount);

    // انیمیشن شمارنده
    Animated.sequence([
      Animated.timing(counterAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(counterAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // ذرات
    if (newCount % 10 === 0) {
      createParticle();
    }

    // بررسی رسیدن به هدف
    if (newCount === dailyGoal) {
      celebrateGoal();
    }

    // بررسی مایلستون‌ها
    if (newTotalCount % 100 === 0) {
      celebrateMilestone(newTotalCount);
    }

    // صدا و ویبره
    if (soundEnabled && newCount % 5 === 0) {
      playSound();
    }
    
    if (vibrationEnabled) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(10);
      }
    }

    // بررسی و به‌روزرسانی اهداف
    updateTargets(newCount, newTotalCount);
  };

  const updateTargets = (dailyCount, total) => {
    const updatedTargets = targets.map(target => {
      if (target.id === 1) {
        return { ...target, completed: dailyCount >= target.count };
      } else if (target.id === 2) {
        const weeklyCount = history.slice(-7).reduce((sum, day) => sum + day.count, 0) + dailyCount;
        return { ...target, completed: weeklyCount >= target.count };
      } else if (target.id === 3) {
        const monthlyCount = history.slice(-30).reduce((sum, day) => sum + day.count, 0) + dailyCount;
        return { ...target, completed: monthlyCount >= target.count };
      }
      return target;
    });
    setTargets(updatedTargets);
  };

  const celebrateGoal = () => {
    Alert.alert(
      '🎉 تبریک! 🎉',
      'به هدف روزانه‌ات رسیدی!',
      [{ text: 'عالی!' }]
    );
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 200, 100, 200]);
    }

    createParticle();
  };

  const celebrateMilestone = (milestone) => {
    Alert.alert(
      '🌟 مایلستون جدید! 🌟',
      `به ${milestone} صلوات رسیدی!`,
      [{ text: 'عالی!' }]
    );
  };

  const checkAchievements = () => {
    let newAchievements = [...achievements];
    let unlocked = false;

    allAchievements.forEach(achievement => {
      const isUnlocked = newAchievements.find(a => a.id === achievement.id);
      
      if (!isUnlocked) {
        let shouldUnlock = false;

        if (achievement.type === 'streak') {
          shouldUnlock = currentStreak >= achievement.requirement;
        } else if (achievement.type === 'goals') {
          const goalsCompleted = history.filter(day => day.count >= day.goal).length;
          shouldUnlock = goalsCompleted >= achievement.requirement;
        } else {
          shouldUnlock = totalCount >= achievement.requirement;
        }

        if (shouldUnlock) {
          newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
          unlocked = true;
          
          Alert.alert(
            `🏆 دستاورد جدید! ${achievement.icon}`,
            `${achievement.title}\n${achievement.description}`,
            [{ text: 'عالی!' }]
          );
        }
      }
    });

    if (unlocked) {
      setAchievements(newAchievements);
    }
  };

  const resetCount = () => {
    Alert.alert(
      'بازنشانی شمارنده',
      'آیا مطمئنی می‌خواهی شمارنده امروز را صفر کنی؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله',
          style: 'destructive',
          onPress: () => {
            setCount(0);
            Animated.spring(progressAnim, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          },
        },
      ]
    );
  };

  const resetAll = () => {
    Alert.alert(
      'بازنشانی کامل',
      'آیا مطمئنی می‌خواهی همه داده‌ها را پاک کنی؟ این عمل قابل بازگشت نیست!',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، همه را پاک کن',
          style: 'destructive',
          onPress: async () => {
            setCount(0);
            setTotalCount(0);
            setCurrentStreak(0);
            setLongestStreak(0);
            setHistory([]);
            setAchievements([]);
            await AsyncStorage.removeItem('salawatData');
          },
        },
      ]
    );
  };

  const shareProgress = async () => {
    try {
      await Share.share({
        message: `امروز ${count} صلوات فرستادم! 🌟\nمجموع: ${totalCount} صلوات\nاستریک: ${currentStreak} روز پیاپی 🔥`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const setCustomGoal = () => {
    const goal = parseInt(customGoalInput);
    if (goal && goal > 0) {
      setDailyGoal(goal);
      setCustomGoalInput('');
      setShowTargets(false);
      Alert.alert('موفق', `هدف روزانه به ${goal} تغییر یافت`);
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterScale = counterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const ribbonTranslate = ribbonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 2],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={currentTheme.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* پس‌زمینه متحرک */}
        <Animated.View
          style={[
            styles.ribbon,
            { transform: [{ translateX: ribbonTranslate }] },
          ]}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* هدر */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: currentTheme.card }]}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.headerButtonText}>⚙️</Text>
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ translateY: floatTranslate }] }}>
              <Text style={[styles.title, { color: currentTheme.text }]}>
                صلوات شمار
              </Text>
            </Animated.View>

            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: currentTheme.card }]}
              onPress={() => setShowStats(true)}
            >
              <Text style={styles.headerButtonText}>📊</Text>
            </TouchableOpacity>
          </View>

          {/* نوار پیشرفت سطح */}
          <View style={[styles.levelCard, { backgroundColor: currentTheme.card }]}>
            <View style={styles.levelHeader}>
              <Text style={[styles.levelText, { color: currentTheme.text }]}>
                سطح {currentLevel}
              </Text>
              <Text style={[styles.xpText, { color: currentTheme.accent }]}>
                {xp}/100 XP
              </Text>
            </View>
            <View style={styles.levelBarContainer}>
              <Animated.View
                style={[
                  styles.levelBar,
                  { width: `${xp}%`, backgroundColor: currentTheme.accent },
                ]}
              />
            </View>
          </View>

          {/* کارت اطلاعات */}
          <View style={styles.infoRow}>
            <View style={[styles.infoCard, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.infoLabel, { color: currentTheme.text }]}>
                استریک 🔥
              </Text>
              <Text style={[styles.infoValue, { color: currentTheme.accent }]}>
                {currentStreak}
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.infoLabel, { color: currentTheme.text }]}>
                بهترین 👑
              </Text>
              <Text style={[styles.infoValue, { color: currentTheme.accent }]}>
                {longestStreak}
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.infoLabel, { color: currentTheme.text }]}>
                مجموع ⭐
              </Text>
              <Text style={[styles.infoValue, { color: currentTheme.accent }]}>
                {totalCount}
              </Text>
            </View>
          </View>

          {/* نوار پیشرفت روزانه */}
          <View style={[styles.progressCard, { backgroundColor: currentTheme.card }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: currentTheme.text }]}>
                پیشرفت امروز
              </Text>
              <Text style={[styles.progressPercent, { color: currentTheme.accent }]}>
                {Math.round((count / dailyGoal) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth, backgroundColor: currentTheme.accent },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: currentTheme.text }]}>
              {count} / {dailyGoal}
            </Text>
          </View>

          {/* دکمه اصلی شمارش */}
          <Animated.View
            style={[
              styles.mainButtonContainer,
              {
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  { rotate },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.glowRing,
                {
                  opacity: glowOpacity,
                  borderColor: currentTheme.accent,
                },
              ]}
            />
            
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: currentTheme.accent }]}
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <Animated.Text
                style={[
                  styles.countText,
                  { color: currentTheme.text, transform: [{ scale: counterScale }] },
                ]}
              >
                {count}
              </Animated.Text>
              <Text style={[styles.tapText, { color: currentTheme.text }]}>
                ضربه بزن
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* متن صلوات */}
          <Animated.View
            style={[
              styles.salawatCard,
              {
                backgroundColor: currentTheme.card,
                transform: [{ translateY: floatTranslate }],
              },
            ]}
          >
            <Text style={[styles.salawatText, { color: currentTheme.text }]}>
              اللَّهُمَّ صَلِّ عَلَی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ
            </Text>
            <Text style={[styles.salawatTranslation, { color: currentTheme.text }]}>
              خدایا بر محمد و خانواده‌اش درود فرست
            </Text>
          </Animated.View>

          {/* دکمه‌های سریع */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickButton, { backgroundColor: currentTheme.card }]}
              onPress={() => setShowRewards(true)}
            >
              <Text style={styles.quickButtonIcon}>🏆</Text>
              <Text style={[styles.quickButtonText, { color: currentTheme.text }]}>
                دستاوردها
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickButton, { backgroundColor: currentTheme.card }]}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.quickButtonIcon}>📅</Text>
              <Text style={[styles.quickButtonText, { color: currentTheme.text }]}>
                تاریخچه
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickButton, { backgroundColor: currentTheme.card }]}
              onPress={() => setShowTargets(true)}
            >
              <Text style={styles.quickButtonIcon}>🎯</Text>
              <Text style={[styles.quickButtonText, { color: currentTheme.text }]}>
                اهداف
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickButton, { backgroundColor: currentTheme.card }]}
              onPress={shareProgress}
            >
              <Text style={styles.quickButtonIcon}>📤</Text>
              <Text style={[styles.quickButtonText, { color: currentTheme.text }]}>
                اشتراک
              </Text>
            </TouchableOpacity>
          </View>

          {/* دکمه‌های مدیریت */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentTheme.card }]}
              onPress={resetCount}
            >
              <Text style={[styles.actionButtonText, { color: currentTheme.text }]}>
                🔄 ریست امروز
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentTheme.card }]}
              onPress={() => {
                const increments = [10, 50, 100];
                Alert.alert(
                  'افزودن سریع',
                  'چند تا اضافه کنم؟',
                  [
                    ...increments.map(inc => ({
                      text: `${inc} عدد`,
                      onPress: () => {
                        setCount(count + inc);
                        setTotalCount(totalCount + inc);
                      },
                    })),
                    { text: 'انصراف', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={[styles.actionButtonText, { color: currentTheme.text }]}>
                ➕ افزودن سریع
              </Text>
            </TouchableOpacity>
          </View>

          {/* فضای خالی برای اسکرول */}
          <View style={{ height: 50 }} />
        </ScrollView>

        {/* ذرات */}
        {particles.map(particle => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                opacity: particle.opacity,
                transform: [{ translateY: particle.translateY }],
              },
            ]}
          >
            <Text style={styles.particleText}>✨</Text>
          </Animated.View>
        ))}

        {/* مودال تنظیمات */}
        <Modal
          visible={showSettings}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSettings(false)}
        >
          <BlurView intensity={90} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  ⚙️ تنظیمات
                </Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Text style={[styles.closeButton, { color: currentTheme.accent }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* تم‌ها */}
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                  🎨 تم رنگی
                </Text>
                <View style={styles.themesContainer}>
                  {themes.map((theme, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedTheme(index)}
                      style={styles.themeOption}
                    >
                      <LinearGradient
                        colors={theme.gradient}
                        style={[
                          styles.themePreview,
                          selectedTheme === index && {
                            borderWidth: 3,
                            borderColor: '#fff',
                          },
                        ]}
                      />
                      <Text style={[styles.themeName, { color: currentTheme.text }]}>
                        {theme.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* صدا */}
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => setSoundEnabled(!soundEnabled)}
                >
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
                    🔊 صدا
                  </Text>
                  <View
                    style={[
                      styles.toggle,
                      soundEnabled && { backgroundColor: currentTheme.accent },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        soundEnabled && styles.toggleCircleActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* ویبره */}
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => setVibrationEnabled(!vibrationEnabled)}
                >
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
                    📳 ویبره
                  </Text>
                  <View
                    style={[
                      styles.toggle,
                      vibrationEnabled && { backgroundColor: currentTheme.accent },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        vibrationEnabled && styles.toggleCircleActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* ذخیره خودکار */}
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => setAutoSave(!autoSave)}
                >
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
                    💾 ذخیره خودکار
                  </Text>
                  <View
                    style={[
                      styles.toggle,
                      autoSave && { backgroundColor: currentTheme.accent },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        autoSave && styles.toggleCircleActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* یادآوری روزانه */}
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => {
                    setDailyReminder(!dailyReminder);
                    setupNotifications();
                  }}
                >
                  <Text style={[styles.settingLabel, { color: currentTheme.text }]}>
                    🔔 یادآوری روزانه
                  </Text>
                  <View
                    style={[
                      styles.toggle,
                      dailyReminder && { backgroundColor: currentTheme.accent },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        dailyReminder && styles.toggleCircleActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* بازنشانی کامل */}
                <TouchableOpacity
                  style={[styles.dangerButton, { borderColor: '#ff4444' }]}
                  onPress={resetAll}
                >
                  <Text style={styles.dangerButtonText}>🗑️ بازنشانی کامل</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* مودال آمار */}
        <Modal
          visible={showStats}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStats(false)}
        >
          <BlurView intensity={90} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  📊 آمار و ارقام
                </Text>
                <TouchableOpacity onPress={() => setShowStats(false)}>
                  <Text style={[styles.closeButton, { color: currentTheme.accent }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    کل صلوات‌ها
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {totalCount.toLocaleString('fa-IR')}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    صلوات امروز
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {count.toLocaleString('fa-IR')}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    استریک فعلی
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {currentStreak} روز 🔥
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    بهترین استریک
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {longestStreak} روز 👑
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    میانگین روزانه
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {history.length > 0
                      ? Math.round(
                          history.reduce((sum, day) => sum + day.count, 0) /
                            history.length
                        ).toLocaleString('fa-IR')
                      : 0}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    سطح فعلی
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    سطح {currentLevel}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    دستاوردهای باز شده
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {achievements.length} / {allAchievements.length}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: currentTheme.text }]}>
                    روزهای ثبت شده
                  </Text>
                  <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                    {history.length} روز
                  </Text>
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* مودال تاریخچه */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistory(false)}
        >
          <BlurView intensity={90} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  📅 تاریخچه
                </Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Text style={[styles.closeButton, { color: currentTheme.accent }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {history.length === 0 ? (
                  <Text style={[styles.emptyText, { color: currentTheme.text }]}>
                    هنوز تاریخچه‌ای ثبت نشده
                  </Text>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((day, index) => (
                      <View key={index} style={styles.historyCard}>
                        <View>
                          <Text style={[styles.historyDate, { color: currentTheme.text }]}>
                            {new Date(day.date).toLocaleDateString('fa-IR')}
                          </Text>
                          <Text
                            style={[styles.historyCount, { color: currentTheme.accent }]}
                          >
                            {day.count} صلوات
                          </Text>
                        </View>
                        <View style={styles.historyBadge}>
                          {day.count >= day.goal ? (
                            <Text style={styles.historyBadgeText}>✅ موفق</Text>
                          ) : (
                            <Text style={styles.historyBadgeText}>
                              {Math.round((day.count / day.goal) * 100)}%
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                )}
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* مودال دستاوردها */}
        <Modal
          visible={showRewards}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRewards(false)}
        >
          <BlurView intensity={90} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  🏆 دستاوردها
                </Text>
                <TouchableOpacity onPress={() => setShowRewards(false)}>
                  <Text style={[styles.closeButton, { color: currentTheme.accent }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.achievementsGrid}>
                  {allAchievements.map(achievement => {
                    const isUnlocked = achievements.find(a => a.id === achievement.id);
                    return (
                      <View
                        key={achievement.id}
                        style={[
                          styles.achievementCard,
                          !isUnlocked && styles.achievementLocked,
                        ]}
                      >
                        <Text style={styles.achievementIcon}>
                          {isUnlocked ? achievement.icon : '🔒'}
                        </Text>
                        <Text
                          style={[
                            styles.achievementTitle,
                            { color: currentTheme.text },
                            !isUnlocked && styles.achievementTextLocked,
                          ]}
                        >
                          {achievement.title}
                        </Text>
                        <Text
                          style={[
                            styles.achievementDesc,
                            { color: currentTheme.text },
                            !isUnlocked && styles.achievementTextLocked,
                          ]}
                        >
                          {achievement.description}
                        </Text>
                        {isUnlocked && (
                          <Text style={[styles.achievementUnlocked, { color: '#4CAF50' }]}>
                            ✓ باز شده
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* مودال اهداف */}
        <Modal
          visible={showTargets}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTargets(false)}
        >
          <BlurView intensity={90} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  🎯 اهداف
                </Text>
                <TouchableOpacity onPress={() => setShowTargets(false)}>
                  <Text style={[styles.closeButton, { color: currentTheme.accent }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* هدف سفارشی */}
                <View style={styles.customGoalSection}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                    تنظیم هدف روزانه
                  </Text>
                  <View style={styles.customGoalRow}>
                    <TextInput
                      style={[
                        styles.goalInput,
                        { color: currentTheme.text, borderColor: currentTheme.accent },
                      ]}
                      placeholder="مثلا: 200"
                      placeholderTextColor={`${currentTheme.text}80`}
                      keyboardType="numeric"
                      value={customGoalInput}
                      onChangeText={setCustomGoalInput}
                    />
                    <TouchableOpacity
                      style={[
                        styles.setGoalButton,
                        { backgroundColor: currentTheme.accent },
                      ]}
                      onPress={setCustomGoal}
                    >
                      <Text style={[styles.setGoalButtonText, { color: currentTheme.text }]}>
                        ثبت
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* اهداف پیش‌فرض */}
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                  اهداف سریع
                </Text>
                <View style={styles.quickGoals}>
                  {[50, 100, 200, 500, 1000].map(goal => (
                    <TouchableOpacity
                      key={goal}
                      style={[
                        styles.quickGoalButton,
                        dailyGoal === goal && { backgroundColor: currentTheme.accent },
                      ]}
                      onPress={() => {
                        setDailyGoal(goal);
                        Alert.alert('موفق', `هدف روزانه به ${goal} تغییر یافت`);
                      }}
                    >
                      <Text
                        style={[
                          styles.quickGoalText,
                          { color: currentTheme.text },
                          dailyGoal === goal && { fontWeight: 'bold' },
                        ]}
                      >
                        {goal}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* اهداف فعال */}
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                  وضعیت اهداف
                </Text>
                {targets.map(target => (
                  <View key={target.id} style={styles.targetCard}>
                    <View style={styles.targetHeader}>
                      <Text style={[styles.targetName, { color: currentTheme.text }]}>
                        {target.name}
                      </Text>
                      {target.completed && <Text style={styles.targetBadge}>✅</Text>}
                    </View>
                    <Text style={[styles.targetCount, { color: currentTheme.accent }]}>
                      هدف: {target.count} صلوات
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </BlurView>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  ribbon: {
    position: 'absolute',
    top: height * 0.1,
    left: -width,
    width: width * 2,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '-15deg' }],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
  },
  levelBarContainer: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  levelBar: {
    height: '100%',
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
  },
  mainButtonContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
  },
  mainButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  countText: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  tapText: {
    fontSize: 18,
    marginTop: 10,
    opacity: 0.8,
  },
  salawatCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
  },
  salawatText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  salawatTranslation: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  quickButtonIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  quickButtonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
  particleText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.85,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeOption: {
    width: '30%',
    marginBottom: 20,
    alignItems: 'center',
  },
  themePreview: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 12,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingLabel: {
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    padding: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  dangerButton: {
    borderWidth: 2,
    borderRadius: 15,
    padding: 15,
    marginTop: 30,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statCard: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
    opacity: 0.6,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    marginBottom: 5,
  },
  historyCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  historyBadgeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.8,
  },
  achievementTextLocked: {
    opacity: 0.5,
  },
  achievementUnlocked: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  customGoalSection: {
    marginBottom: 20,
  },
  customGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  setGoalButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  setGoalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickGoalButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickGoalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  targetName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  targetBadge: {
    fontSize: 20,
  },
  targetCount: {
    fontSize: 14,
  },
});
