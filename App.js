import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import LoginScreen from './screens/LoginScreen';
import OtpScreen from './screens/OtpScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import LocationScreen, { EVEGAH_ZONES } from './screens/LocationScreen';
import MyRidesScreen from './screens/MyRidesScreen';
import RideDetailScreen from './screens/RideDetailScreen';
import ScanScreen from './screens/ScanScreen';
import UnlockingScreen from './screens/UnlockingScreen';
import BluetoothScreen from './screens/BluetoothScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import KycScreen from './screens/KycScreen';
import ReferScreen from './screens/ReferScreen';
import OffersScreen from './screens/OffersScreen';
import GiftCardScreen from './screens/GiftCardScreen';
import RedeemGiftCardScreen from './screens/RedeemGiftCardScreen';
import HelpScreen from './screens/HelpScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import AboutScreen from './screens/AboutScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import TransactionScreen from './screens/TransactionScreen';
import InsightsScreen from './screens/InsightsScreen';
import SecurityScreen from './screens/SecurityScreen';
import BmsScreen from './screens/BmsScreen';
import WalletScreen from './screens/WalletScreen';
import VehicleDetailsScreen from './screens/VehicleDetailsScreen';
import VehicleListScreen from './screens/VehicleListScreen';
import RentScreen from './screens/RentScreen';
import PayScreen from './screens/PayScreen';
import BookingConfirmedScreen from './screens/BookingConfirmedScreen';
import RideScreen from './screens/RideScreen';
import EndRideScreen from './screens/EndRideScreen';
import WalletIntro from './components/WalletIntro';
import { apiGet, apiPost, last10, sendLoginSmsOtp, setUserMobile } from './services/api';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [loginReturnTo, setLoginReturnTo] = useState('home');
  const [phone, setPhone] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(EVEGAH_ZONES[0]);
  const [calendarTriggerTick, setCalendarTriggerTick] = useState(0);
  const [walletIntro, setWalletIntro] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleFrom, setVehicleFrom] = useState('home');
  const [rentFrom, setRentFrom] = useState('home');
  const [vehicleListFrom, setVehicleListFrom] = useState('rent');
  const [payBackTo, setPayBackTo] = useState('vehicle');
  const [trip, setTrip] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [rideSummary, setRideSummary] = useState(null);
  const [pastRide, setPastRide] = useState(null);
  const [rideFrom, setRideFrom] = useState('booked');
  const [unlockFrom, setUnlockFrom] = useState('scan');
  const [unlockScooter, setUnlockScooter] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    gender: '',
    dob: '',
    address: '',
    aadhaar: '',
    avatarIndex: 0,
  });

  useEffect(() => {
    setUserMobile(profile?.phone || phone);
  }, [profile?.phone, phone]);

  // Detect rider's live GPS position on launch and select nearest zone
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!active) return;
          const { latitude, longitude } = loc.coords;
          const res = await apiGet('/v1/getzoneDetailWithBikeCountList').catch(() => null);
          const list = res?.data || res?.zones || res || [];
          if (Array.isArray(list) && list.length > 0) {
            let closest = null;
            let minDist = Infinity;
            list.forEach((z) => {
              const zLat = z.center?.lat || (Array.isArray(z.points) && z.points[0]?.lat);
              const zLng = z.center?.lng || (Array.isArray(z.points) && z.points[0]?.lng);
              if (zLat && zLng) {
                const R = 6371;
                const dLat = ((zLat - latitude) * Math.PI) / 180;
                const dLon = ((zLng - longitude) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((latitude * Math.PI) / 180) *
                    Math.cos((zLat * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                if (d < minDist) {
                  minDist = d;
                  closest = z;
                }
              }
            });
            if (closest && active) {
              setSelectedZone({
                id: String(closest.zone_id || closest.id || 'gotri'),
                name: closest.zone_name || closest.name || 'Gotri, Vadodara-390021',
                shortName: closest.short_name || closest.name?.split(',')[0] || 'Gotri',
                address: closest.address || '',
                distance: minDist < 1 ? `${Math.round(minDist * 1000)} m` : `${minDist.toFixed(1)} km`,
              });
            }
          }
        }
      } catch (e) {}
    })();
    return () => {
      active = false;
    };
  }, []);
  const [kyc, setKyc] = useState({ selfie: false, front: false, back: false });
  const [offersFrom, setOffersFrom] = useState('profile');
  const [redeemFrom, setRedeemFrom] = useState('profile');
  const [prefs, setPrefs] = useState({ push: true, email: false });
  const [tx, setTx] = useState(null);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const mobile = last10(profile?.phone || phone);
    if (!mobile) return;
    let active = true;
    apiGet(`/notifications?mobile=${mobile}`)
      .then((body) => {
        if (!active) return;
        const rows = body?.data || [];
        if (Array.isArray(rows)) {
          setNotes(
            rows.map((item) => ({
              id: String(item.id),
              kind: item.type ? (item.type.includes('ride') ? 'Rides' : item.type.includes('wallet') ? 'Wallet' : item.type.includes('offer') ? 'Offers' : 'System') : 'System',
              title: item.title,
              text: item.message,
              time: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
              read: Boolean(item.read),
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profile?.phone, phone]);

  const openWallet = () => {
    if (walletIntro || screen === 'wallet') return;
    setWalletIntro(true);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.stage}>
      {screen === 'onboarding' ? (
        <OnboardingScreen onFinish={() => setScreen('home')} />
      ) : screen === 'rent' || screen === 'pay' || screen === 'booked' || screen === 'ride' || screen === 'ended' ? (
        <View style={styles.stage}>
          <RentScreen
            vehicle={vehicle}
            selectedZone={selectedZone}
            onBack={() => setScreen(rentFrom || 'home')}
            onContinue={(next) => {
              setTrip(next);
              setVehicleListFrom('rent');
              setScreen('vehicleList');
            }}
          />
          {screen === 'pay' || screen === 'booked' || screen === 'ride' || screen === 'ended' ? (
            <View style={styles.cover}>
              <PayScreen
                vehicle={vehicle}
                trip={trip}
                phone={profile?.phone || phone}
                profile={profile}
                onBack={() => setScreen(payBackTo)}
                onPay={(next) => {
                  const tail = Date.now().toString().slice(-8);
                  setReceipt({ ...next, bookingId: `EVG${tail}` });
                  setScreen('booked');
                }}
              />
            </View>
          ) : null}
          {screen === 'booked' || screen === 'ride' || screen === 'ended' ? (
            <View style={styles.booked}>
              <BookingConfirmedScreen
                vehicle={vehicle}
                trip={trip}
                receipt={receipt}
                onBack={() => setScreen('pay')}
                onStart={() => {
                  setRideFrom('booked');
                  setScreen('ride');
                }}
              />
            </View>
          ) : null}
          {screen === 'ride' || screen === 'ended' ? (
            <View style={styles.ride}>
              <RideScreen
                vehicle={vehicle}
                trip={trip}
                receipt={receipt}
                onBack={() => setScreen(rideFrom)}
                onExtendRide={({ addedPrice, newDropAt, addedHours }) => {
                  setTrip((prev) =>
                    prev ? { ...prev, dropAt: newDropAt } : prev,
                  );
                  setReceipt((prev) =>
                    prev
                      ? { ...prev, total: (prev.total || 0) + (addedPrice || 0) }
                      : prev,
                  );
                  const mobile = last10(profile?.phone || phone);
                  if (mobile) {
                    apiPost('/rides/extend', {
                      mobile,
                      added_hours: addedHours,
                      new_end_date: new Date(newDropAt).toISOString(),
                      extra_amount: addedPrice,
                      vehicle_id: vehicle?.id || vehicle?.code,
                    }).catch(() => {});
                  }
                }}
                onEnd={(summary) => {
                  setRideSummary(summary);
                  setScreen('ended');
                  const mobile = last10(profile?.phone || phone);
                  apiPost('/rides/return', {
                    mobile,
                    rider_name: profile?.name || 'Evegah Rider',
                    vehicle_id: vehicle?.id || vehicle?.code,
                    return_condition: 'Good',
                    notes: `Duration: ${summary?.elapsed || ''}, Distance: ${summary?.distance || ''} km`,
                  }).catch(() => {});
                }}
              />
            </View>
          ) : null}
          {screen === 'ended' ? (
            <View style={styles.ended}>
              <EndRideScreen
                vehicle={vehicle}
                trip={trip}
                receipt={receipt}
                summary={rideSummary}
                onDone={() => setScreen('home')}
              />
            </View>
          ) : null}
        </View>
      ) : screen === 'vehicleList' ? (
        <View style={styles.stage}>
          <VehicleListScreen
            trip={trip}
            selectedZone={selectedZone}
            onBack={() => setScreen(vehicleListFrom || 'home')}
            onOpenLocation={() => setLocationOpen(true)}
            onSelectVehicle={(next) => {
              setVehicle(next);
              setVehicleFrom('vehicleList');
              setScreen('vehicle');
            }}
          />
          <Modal
            visible={locationOpen}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={() => setLocationOpen(false)}
          >
            <LocationScreen
              selectedZone={selectedZone}
              onBack={() => setLocationOpen(false)}
              onSelectZone={(zone) => {
                setSelectedZone(zone);
                setLocationOpen(false);
              }}
            />
          </Modal>
        </View>
      ) : screen === 'vehicle' ? (
        <VehicleDetailsScreen
          vehicle={vehicle}
          trip={trip}
          onBack={() => setScreen(vehicleFrom || 'vehicleList')}
          onBook={(flexiData) => {
            let nextVehicle = vehicle;
            let nextTrip = trip;
            if (flexiData && typeof flexiData === 'object') {
              nextVehicle = { ...(vehicle || {}), ...flexiData };
              setVehicle(nextVehicle);
              const pAddress = flexiData.flexiPickup || flexiData.flexiPickupAddress;
              const dAddress = flexiData.flexiDrop || flexiData.flexiDropAddress;
              if (pAddress || dAddress) {
                nextTrip = {
                  ...(trip || {
                    pickupAt: Date.now(),
                    dropAt: Date.now() + 24 * 3600 * 1000,
                    packageId: 'daily',
                    durationText: '24 hrs',
                  }),
                  pickupName: pAddress || trip?.pickupName || selectedZone?.name || 'Gotri',
                  dropName: dAddress || trip?.dropName || selectedZone?.name || 'Gotri',
                  deliveryAnywhere: Boolean(flexiData.flexiEnabled),
                };
                setTrip(nextTrip);
              }
            }
            if (!isLoggedIn) {
              setPendingBooking({
                vehicle: nextVehicle,
                trip: nextTrip,
                target: 'pay',
              });
              setLoginReturnTo('vehicle');
              setScreen('login');
              return;
            }
            setPayBackTo('vehicle');
            setScreen('pay');
          }}
        />
      ) : screen === 'bms' ? (
        <BmsScreen onBack={() => setScreen('home')} />
      ) : screen === 'security' ? (
        <SecurityScreen
          phone={profile.phone}
          onBack={() => setScreen('profile')}
          onLogout={() => {
            setIsLoggedIn(false);
            setPendingBooking(null);
            const mobile = last10(profile.phone || phone);
            if (mobile) {
              apiPost('/notifications/unregister-token', { mobile }).catch(() => {});
            }
            setProfile({
              name: '',
              phone: '',
              gender: '',
              dob: '',
              address: '',
              aadhaar: '',
              avatarIndex: 0,
            });
            setPhone('');
            setUserMobile('');
            setScreen('home');
          }}
        />
      ) : screen === 'insights' ? (
        <InsightsScreen onBack={() => setScreen('home')} />
      ) : screen === 'transaction' ? (
        <TransactionScreen tx={tx} onBack={() => setScreen('wallet')} />
      ) : screen === 'wallet' ? (
        <WalletScreen
          enterCards={false}
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenScan={() => setScreen('scan')}
          onOpenProfile={() => setScreen('profile')}
          onOffers={() => {
            setOffersFrom('wallet');
            setScreen('offers');
          }}
          onOpenTx={(item) => {
            setTx(item);
            setScreen('transaction');
          }}
          phone={profile.phone}
        />
      ) : screen === 'notifications' ? (
        <NotificationsScreen
          notes={notes}
          phone={profile.phone}
          onBack={() => setScreen('home')}
          onRead={(id) => setNotes((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)))}
          onReadAll={() => setNotes((list) => list.map((item) => ({ ...item, read: true })))}
        />
      ) : screen === 'about' ? (
        <AboutScreen
          phone={profile.phone}
          name={profile.name}
          onBack={() => setScreen('profile')}
          onExplore={() => setScreen('home')}
        />
      ) : screen === 'preferences' ? (
        <PreferencesScreen
          prefs={prefs}
          onChange={setPrefs}
          onBack={() => setScreen('profile')}
        />
      ) : screen === 'help' ? (
        <HelpScreen onBack={() => setScreen('profile')} />
      ) : screen === 'giftCard' ? (
        <GiftCardScreen
          onBack={() => setScreen('profile')}
          onHelp={() => setScreen('help')}
          onRedeem={() => {
            setRedeemFrom('giftCard');
            setScreen('redeemGiftCard');
          }}
        />
      ) : screen === 'redeemGiftCard' ? (
        <RedeemGiftCardScreen
          onBack={() => setScreen(redeemFrom)}
          onRedeemed={() => setScreen('wallet')}
        />
      ) : screen === 'offers' ? (
        <OffersScreen onBack={() => setScreen(offersFrom)} />
      ) : screen === 'refer' ? (
        <ReferScreen
          phone={profile.phone}
          name={profile.name}
          onBack={() => setScreen('profile')}
        />
      ) : screen === 'kyc' ? (
        <KycScreen
          kyc={kyc}
          profile={{ ...profile, phone: profile?.phone || phone }}
          onBack={() => {
            if (pendingBooking) {
              const pb = pendingBooking;
              setPendingBooking(null);
              if (pb.vehicle) setVehicle(pb.vehicle);
              if (pb.trip) setTrip(pb.trip);
              setPayBackTo('vehicle');
              setScreen(pb.target || 'pay');
            } else {
              setScreen(isLoggedIn ? 'home' : 'profile');
            }
          }}
          onStep={(key) => setKyc((current) => ({ ...current, [key]: true }))}
          onKycComplete={(verifiedData) => {
            setKyc({ selfie: true, front: true, back: true });
            if (verifiedData?.name) {
              setProfile((prev) => ({
                ...prev,
                name: verifiedData.name || prev.name,
                dob: verifiedData.dob || prev.dob,
                gender: verifiedData.gender || prev.gender,
                aadhaar: verifiedData.aadhaar || prev.aadhaar,
                address: verifiedData.address || prev.address,
              }));
              apiPost('/renters', {
                rider_name: verifiedData.name,
                mobile: profile.phone || phone,
                gender: verifiedData.gender,
                date_of_birth: verifiedData.dob,
                address: verifiedData.address,
                aadhaar: verifiedData.aadhaar,
              }).catch(() => {});
            }
          }}
        />
      ) : screen === 'editProfile' ? (
        <EditProfileScreen
          profile={profile}
          onBack={() => setScreen('profile')}
          onSave={(next) => {
            setProfile(next);
            setScreen('profile');
            apiPost('/renters', {
              rider_name: next.name,
              mobile: next.phone,
              gender: next.gender,
              date_of_birth: next.dob,
              address: next.address,
            }).catch(() => {});
          }}
        />
      ) : screen === 'profile' ? (
        <ProfileScreen
          profile={profile}
          verified={kyc.selfie && kyc.front && kyc.back}
          onEdit={() => setScreen('editProfile')}
          onKyc={() => setScreen('kyc')}
          onRefer={() => setScreen('refer')}
          onOffers={() => {
            setOffersFrom('profile');
            setScreen('offers');
          }}
          onGiftCard={() => setScreen('giftCard')}
          onRedeemGiftCard={() => {
            setRedeemFrom('profile');
            setScreen('redeemGiftCard');
          }}
          onHelp={() => setScreen('help')}
          onPreferences={() => setScreen('preferences')}
          onAbout={() => setScreen('about')}
          onSecurity={() => setScreen('security')}
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenScan={() => setScreen('scan')}
          onOpenWallet={openWallet}
        />
      ) : screen === 'bluetooth' ? (
        <BluetoothScreen
          onBack={() => setScreen('scan')}
          onUnlock={(scooter) => {
            setUnlockFrom('bluetooth');
            setUnlockScooter(scooter);
            setScreen('unlocking');
          }}
        />
      ) : screen === 'unlocking' ? (
        <UnlockingScreen
          scooter={unlockScooter}
          onBack={() => setScreen(unlockFrom)}
          onStart={() => {
            setRideFrom('unlocking');
            const code = unlockScooter?.code || 'EV-1042';
            if (!trip) {
              const start = Date.now();
              setTrip({
                pickupName: selectedZone?.name || 'Gotri',
                dropName: selectedZone?.name || 'Gotri',
                pickupAt: start,
                dropAt: start + 2 * 60 * 60 * 1000,
              });
            }
            if (!receipt) setReceipt({ bookingId: code.replace('-', '') });
            setScreen('ride');
          }}
        />
      ) : screen === 'scan' ? (
        <ScanScreen
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenProfile={() => setScreen('profile')}
          onOpenWallet={openWallet}
          onFindNearby={() => {
            setScreen('home');
            setLocationOpen(true);
          }}
          onScan={() => {
            setUnlockFrom('scan');
            setUnlockScooter(null);
            setScreen('unlocking');
          }}
          onBluetooth={() => setScreen('bluetooth')}
        />
      ) : screen === 'rideDetail' ? (
        <RideDetailScreen ride={pastRide} onBack={() => setScreen('rides')} />
      ) : screen === 'rides' ? (
        <MyRidesScreen
          onOpenHome={() => setScreen('home')}
          onOpenScan={() => setScreen('scan')}
          onOpenProfile={() => setScreen('profile')}
          onOpenWallet={openWallet}
          onOpenRide={(item) => {
            setPastRide(item);
            setScreen('rideDetail');
          }}
          phone={profile.phone}
        />
      ) : screen === 'home' ? (
        <View style={styles.stage}>
          <HomeScreen
            selectedZone={selectedZone}
            calendarTriggerTick={calendarTriggerTick}
            onOpenLocation={() => setLocationOpen(true)}
            onOpenMyRide={() => setScreen('rides')}
            onOpenScan={() => setScreen('scan')}
            onOpenProfile={() => setScreen('profile')}
            onOpenWallet={openWallet}
            onOpenVehicleList={() => {
              setVehicleListFrom('home');
              setScreen('vehicleList');
            }}
            onSearchVehicles={(tripPayload) => {
              setTrip(tripPayload);
              setVehicleListFrom('home');
              setScreen('vehicleList');
            }}
            onOpenVehicle={(next) => {
              setVehicle(next);
              setVehicleFrom('home');
              setScreen('vehicle');
            }}
            onOpenRent={(nextVehicle, initialTrip) => {
              if (nextVehicle) setVehicle(nextVehicle);
              if (initialTrip) setTrip(initialTrip);
              setRentFrom('home');
              setScreen('rent');
            }}
            onOpenNotifications={() => setScreen('notifications')}
            onOpenInsights={() => setScreen('insights')}
            onOpenBms={() => setScreen('bms')}
            hasUnread={notes.some((item) => !item.read)}
          />
          <Modal
            visible={locationOpen}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={() => setLocationOpen(false)}
          >
            <LocationScreen
              selectedZone={selectedZone}
              onBack={() => setLocationOpen(false)}
              onSelectZone={(zone) => {
                setSelectedZone(zone);
                setLocationOpen(false);
                setCalendarTriggerTick((t) => t + 1);
              }}
            />
          </Modal>
        </View>
      ) : screen === 'login' ? (
        <LoginScreen
          onBack={() => {
            setPendingBooking(null);
            setScreen(loginReturnTo || 'home');
          }}
          onContinue={(nextPhone) => {
            setPhone(nextPhone);
            const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
            setSentOtp(randomOtp);
            sendLoginSmsOtp(nextPhone, randomOtp).catch(() => {});
            const cleanMobile = last10(nextPhone);
            if (cleanMobile) {
              setUserMobile(cleanMobile);
              apiPost('/renters', {
                rider_name: profile.name || `Rider ${cleanMobile.slice(-4)}`,
                mobile: cleanMobile,
                status: 'Registered',
                rent: 1,
                deposit: 0,
                booking_source: 'Rider App',
              }).catch(() => {});
            }
            setScreen('otp');
          }}
        />
      ) : screen === 'otp' ? (
        <OtpScreen
          phone={phone}
          expectedOtp={sentOtp}
          onResendOtp={(newOtp) => {
            setSentOtp(newOtp);
            sendLoginSmsOtp(phone, newOtp).catch(() => {});
          }}
          onEdit={() => setScreen('login')}
          onSuccess={() => {
            setIsLoggedIn(true);
            const mobile = last10(phone);
            if (mobile) {
              setUserMobile(mobile);
              apiGet(`/renters/check-mobile/${mobile}`)
                .then((body) => {
                  const renter = body?.renter;
                  if (!renter) {
                    apiPost('/renters', {
                      rider_name: profile.name || `Rider ${mobile.slice(-4)}`,
                      mobile,
                      status: 'Registered',
                      rent: 1,
                      deposit: 0,
                      booking_source: 'Rider App',
                    }).catch(() => {});
                    return;
                  }
                  setProfile((current) => ({
                    ...current,
                    name: renter.rider_name || renter.name || current.name || `Rider ${mobile.slice(-4)}`,
                    phone: renter.mobile || current.phone || phone,
                    gender: renter.gender || current.gender,
                    dob: renter.date_of_birth || current.dob,
                    address: renter.address || renter.present_address || current.address,
                  }));
                  const kycStatus = String(renter.kyc_status || '').toLowerCase();
                  if (kycStatus.includes('approv') || kycStatus.includes('verif')) {
                    setKyc({ selfie: true, front: true, back: true });
                  }
                })
                .catch(() => {});
            }

            const isKycDone = kyc.selfie && kyc.front && kyc.back;
            if (!isKycDone) {
              setScreen('kyc');
            } else if (pendingBooking) {
              const pb = pendingBooking;
              setPendingBooking(null);
              if (pb.vehicle) setVehicle(pb.vehicle);
              if (pb.trip) setTrip(pb.trip);
              setPayBackTo('vehicle');
              setScreen(pb.target || 'pay');
            } else {
              setScreen('home');
            }
          }}
        />
      ) : (
        <View style={styles.stage}>
          <HomeScreen
            selectedZone={selectedZone}
            calendarTriggerTick={calendarTriggerTick}
            onOpenLocation={() => setLocationOpen(true)}
            onOpenMyRide={() => setScreen('rides')}
            onOpenScan={() => setScreen('scan')}
            onOpenProfile={() => setScreen('profile')}
            onOpenWallet={openWallet}
            onOpenVehicleList={() => setScreen('vehicleList')}
            onSearchVehicles={(tripPayload) => {
              setTrip(tripPayload);
              setPayBackTo('vehicle');
              setScreen('vehicleList');
            }}
            onOpenVehicle={(next) => {
              setVehicle(next);
              setVehicleFrom('home');
              setScreen('vehicle');
            }}
            onOpenNotifications={() => setScreen('notifications')}
            onOpenInsights={() => setScreen('insights')}
            onOpenBms={() => setScreen('bms')}
            hasUnread={notes.some((item) => !item.read)}
          />
        </View>
      )}
      {walletIntro ? (
        <WalletIntro
          active={screen}
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenScan={() => setScreen('scan')}
          onOpenProfile={() => setScreen('profile')}
          onOpen={() => setScreen('wallet')}
          onDone={() => setWalletIntro(false)}
        />
      ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    elevation: 8,
  },
  booked: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    elevation: 12,
  },
  ride: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 7,
    elevation: 16,
  },
  ended: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    elevation: 20,
  },
});
