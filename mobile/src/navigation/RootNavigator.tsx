import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/utils/theme";
import { useAuth } from "@/contexts/AuthContext";

// ── Auth screens ──
import LoginScreen from "@/screens/auth/LoginScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";

// ── Common screens ──
import HomeScreen from "@/screens/home/HomeScreen";
import SearchScreen from "@/screens/search/SearchScreen";
import BookingsScreen from "@/screens/booking/BookingsScreen";
import ChatListScreen from "@/screens/chat/ChatListScreen";
import ProfileScreen from "@/screens/profile/ProfileScreen";
import TeacherDetailScreen from "@/screens/teacher/TeacherDetailScreen";
import BookingCreateScreen from "@/screens/booking/BookingCreateScreen";
import ChatRoomScreen from "@/screens/chat/ChatRoomScreen";
import PaymentScreen from "@/screens/payment/PaymentScreen";

// ── Profile sub-screens ──
import EditProfileScreen from "@/screens/profile/EditProfileScreen";
import NotificationsScreen from "@/screens/profile/NotificationsScreen";
import PrivacyScreen from "@/screens/profile/PrivacyScreen";
import HelpScreen from "@/screens/profile/HelpScreen";

// ── Review ──
import ReviewScreen from "@/screens/review/ReviewScreen";

// ── Teacher-specific screens ──
import TeacherDashboardScreen from "@/screens/teacher/TeacherDashboardScreen";
import EditTeacherProfileScreen from "@/screens/teacher/EditTeacherProfileScreen";
import MyStudentsScreen from "@/screens/teacher/MyStudentsScreen";
import ManageAvailabilityScreen from "@/screens/teacher/ManageAvailabilityScreen";

// ── Student-specific screens ──
import StudentDashboardScreen from "@/screens/student/StudentDashboardScreen";
import MyScheduleScreen from "@/screens/student/MyScheduleScreen";
import ProgressScreen from "@/screens/student/ProgressScreen";

// ── Etudiant-specific screens ──
import EtudiantDashboardScreen from "@/screens/etudiant/EtudiantDashboardScreen";

// ── Parent-specific screens ──
import ChildrenScreen from "@/screens/parent/ChildrenScreen";
import ChildProgressScreen from "@/screens/parent/ChildProgressScreen";

// ── Admin screens ──
import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import UserManagementScreen from "@/screens/admin/UserManagementScreen";
import TeacherVerificationScreen from "@/screens/admin/TeacherVerificationScreen";
import ReportsScreen from "@/screens/admin/ReportsScreen";

import type { RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ── Shared tab styling ──
const tabScreenOptions = ({ route }: { route: { name: string } }) => ({
  tabBarActiveTintColor: colors.primary[600],
  tabBarInactiveTintColor: colors.gray[400],
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
  tabBarStyle: {
    borderTopColor: colors.gray[100],
    paddingBottom: 4,
    height: 56,
  },
  headerShown: false,
});

function getTabIcon(name: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
    Accueil: ["home", "home-outline"],
    Recherche: ["search", "search-outline"],
    Cours: ["calendar", "calendar-outline"],
    Chat: ["chatbubbles", "chatbubbles-outline"],
    Profil: ["person", "person-outline"],
    "Tableau de bord": ["grid", "grid-outline"],
    Dashboard: ["grid", "grid-outline"],
    Utilisateurs: ["people", "people-outline"],
    "Vérifications": ["checkmark-circle", "checkmark-circle-outline"],
    "Élèves": ["people", "people-outline"],
    "Emploi du temps": ["calendar", "calendar-outline"],
    Progression: ["bar-chart", "bar-chart-outline"],
    Enfants: ["people", "people-outline"],
    Signalements: ["flag", "flag-outline"],
  };
  const pair = icons[name] || ["ellipse", "ellipse-outline"];
  return focused ? pair[0] : pair[1];
}

// ══════════════════════════════════════════
// TAB NAVIGATORS PER ROLE
// ══════════════════════════════════════════

// ── Parent / Guest Tabs ──
function ParentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions({ route }),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Recherche" component={SearchScreen} />
      <Tab.Screen name="Cours" component={BookingsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Teacher Tabs ──
function TeacherTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions({ route }),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={TeacherDashboardScreen} options={{ title: "Accueil" }} />
      <Tab.Screen name="Cours" component={BookingsScreen} />
      <Tab.Screen name="Élèves" component={MyStudentsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Student Tabs ──
function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions({ route }),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={StudentDashboardScreen} />
      <Tab.Screen name="Recherche" component={SearchScreen} />
      <Tab.Screen name="Emploi du temps" component={MyScheduleScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Etudiant Tabs ──
function EtudiantTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions({ route }),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={EtudiantDashboardScreen} />
      <Tab.Screen name="Recherche" component={SearchScreen} />
      <Tab.Screen name="Cours" component={BookingsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Admin Tabs ──
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions({ route }),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Tableau de bord" component={AdminDashboardScreen} />
      <Tab.Screen name="Utilisateurs" component={UserManagementScreen} />
      <Tab.Screen name="Vérifications" component={TeacherVerificationScreen} />
      <Tab.Screen name="Signalements" component={ReportsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ══════════════════════════════════════════
// MAIN TAB SELECTOR (based on role)
// ══════════════════════════════════════════

function MainTabNavigator() {
  const { isTeacher, isAdmin, isStudent, isEtudiant } = useAuth();

  if (isAdmin) return <AdminTabNavigator />;
  if (isTeacher) return <TeacherTabNavigator />;
  if (isStudent) return <StudentTabNavigator />;
  if (isEtudiant) return <EtudiantTabNavigator />;
  return <ParentTabNavigator />; // Default for parent + guest
}

// ══════════════════════════════════════════
// ROOT STACK NAVIGATOR
// ══════════════════════════════════════════

export default function RootNavigator() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.gray[900],
          headerBackTitle: "Retour",
          headerStyle: { backgroundColor: colors.white },
          headerShadowVisible: false,
        }}
      >
        {/* Main tabs (role-based) */}
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Connexion" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Inscription" }} />

        {/* Teacher detail & booking */}
        <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} options={{ title: "Profil professeur" }} />
        <Stack.Screen name="Booking" component={BookingCreateScreen} options={{ title: "Réserver un cours" }} />

        {/* Chat */}
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={({ route }) => ({
            title: (route.params as { name?: string })?.name || "Chat",
          })}
        />

        {/* Payment */}
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "S'abonner" }} />

        {/* Review */}
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: "Évaluer le cours" }} />

        {/* Profile sub-screens */}
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Modifier le profil" }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: "Confidentialité" }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ title: "Aide & Support" }} />

        {/* Teacher-specific */}
        <Stack.Screen name="EditTeacherProfile" component={EditTeacherProfileScreen} options={{ title: "Profil professeur" }} />
        <Stack.Screen name="ManageAvailability" component={ManageAvailabilityScreen} options={{ title: "Disponibilités" }} />

        {/* Student-specific */}
        <Stack.Screen name="Progression" component={ProgressScreen} options={{ title: "Ma progression" }} />

        {/* Admin-specific */}
        <Stack.Screen name="AdminBookings" component={BookingsScreen} options={{ title: "Réservations" }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Signalements" }} />

        {/* Parent-specific */}
        <Stack.Screen name="ChildProgress" component={ChildProgressScreen} options={({ route }) => ({ title: `Progression de ${(route.params as { childName?: string })?.childName || ""}` })} />
        <Stack.Screen name="AddChild" component={ChildrenScreen} options={{ title: "Mes enfants" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
