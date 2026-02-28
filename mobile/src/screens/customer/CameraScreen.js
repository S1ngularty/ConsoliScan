import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";

const { width, height } = Dimensions.get("window");

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#00A86B",
  primaryDark: "#007A4D",
  primaryLight: "rgba(0,168,107,0.15)",
  white: "#FFFFFF",
  black: "#0A0A0A",
  gray100: "#F7F8FA",
  gray200: "#EBEBEB",
  gray500: "#9CA3AF",
  gray700: "#4B5563",
  danger: "#EF4444",
  warning: "#F59E0B",
  overlay: "rgba(8,8,8,0.72)",
  overlayLight: "rgba(8,8,8,0.45)",
};

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ captureType }) => {
  const steps = [
    { key: "idFront", label: "Front", icon: "card-account-details" },
    { key: "idBack", label: "Back", icon: "card-bulleted" },
    { key: "selfie", label: "Selfie", icon: "face-recognition" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === captureType);

  return (
    <View style={stepStyles.container}>
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <View style={stepStyles.step}>
              <View
                style={[
                  stepStyles.dot,
                  done && stepStyles.dotDone,
                  active && stepStyles.dotActive,
                ]}
              >
                {done ? (
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name={step.icon}
                    size={12}
                    color={active ? "#fff" : COLORS.gray500}
                  />
                )}
              </View>
              <Text
                style={[
                  stepStyles.label,
                  active && stepStyles.labelActive,
                  done && stepStyles.labelDone,
                ]}
              >
                {step.label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[stepStyles.line, done && stepStyles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  step: { alignItems: "center", gap: 4 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  dotDone: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  label: { fontSize: 10, fontWeight: "500", color: "rgba(255,255,255,0.45)" },
  labelActive: { color: "#fff", fontWeight: "700" },
  labelDone: { color: COLORS.primary },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 14,
    marginHorizontal: 6,
  },
  lineDone: { backgroundColor: COLORS.primary },
});

// ─── Animated Shutter Button ──────────────────────────────────────────────────
const ShutterButton = ({ onPress, disabled, isCapturing }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[shutterStyles.outer, disabled && { opacity: 0.4 }]}
      >
        <View style={shutterStyles.ring}>
          <View style={shutterStyles.inner}>
            {isCapturing && <ActivityIndicator color="#fff" size="small" />}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const shutterStyles = StyleSheet.create({
  outer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
});

// ─── Scanning Line Animation ──────────────────────────────────────────────────
const ScanLine = ({ frameHeight }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: frameHeight - 4,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [frameHeight]);

  return (
    <Animated.View
      style={[scanStyles.line, { transform: [{ translateY: anim }] }]}
    />
  );
};

const scanStyles = StyleSheet.create({
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});

// ─── Main Camera Screen ───────────────────────────────────────────────────────
const CameraScreen = ({ navigation, route }) => {
  const { captureType, idType, images: initialImages } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [images, setImages] = useState(
    initialImages || { idFront: null, idBack: null }
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [flashMode, setFlashMode] = useState("off");
  const [cameraReady, setCameraReady] = useState(false);
  const [facing] = useState(captureType === "selfie" ? "front" : "back");
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(0);

  const cameraRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const getCaptureTitle = () => {
    switch (captureType) {
      case "idFront": return "Front of ID";
      case "idBack": return "Back of ID";
      case "selfie": return "Take a Selfie";
      default: return "Capture Photo";
    }
  };

  const getCaptureInstructions = () => {
    switch (captureType) {
      case "idFront": return "Align the front of your ID within the frame. Ensure text is clearly visible.";
      case "idBack": return "Align the back of your ID within the frame. Ensure all details are visible.";
      case "selfie": return "Center your face, look directly at the camera, and hold still.";
      default: return "Position your photo in the frame.";
    }
  };

  const getTips = () => {
    switch (captureType) {
      case "idFront":
      case "idBack":
        return ["Good lighting", "No glare or shadows", "All edges visible"];
      case "selfie":
        return ["Face centered", "Look at camera", "Good lighting"];
      default: return [];
    }
  };

  const optimizeImage = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch {
      return uri;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing || !cameraReady) return;
    try {
      setIsCapturing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: Platform.OS === "android",
      });
      setIsProcessing(true);
      const optimizedUri = await optimizeImage(photo.uri);
      setCapturedImage(optimizedUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraReady(false);
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updatedImages = { ...images, [captureType]: capturedImage };
      setImages(updatedImages);

      if (captureType === "idFront") {
        navigation.replace("CameraScreen", { captureType: "idBack", idType, images: updatedImages });
      } else if (captureType === "idBack") {
        navigation.replace("CameraScreen", { captureType: "selfie", idType, images: updatedImages });
      } else if (captureType === "selfie") {
        navigation.replace("EligibilityFormScreen", { idType, images: updatedImages });
      }
    } catch {
      Alert.alert("Error", "Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Permission Loading ──────────────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={s.permContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.permSubtitle}>Initializing camera…</Text>
      </SafeAreaView>
    );
  }

  // ── Permission Denied ───────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permContainer}>
        <View style={s.permIconWrap}>
          <MaterialCommunityIcons name="camera-off" size={40} color={COLORS.danger} />
        </View>
        <Text style={s.permTitle}>Camera Access Required</Text>
        <Text style={s.permSubtitle}>
          Camera access is needed to securely capture your ID and selfie for verification.
        </Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={s.permBtnText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Review Screen ───────────────────────────────────────────────────────────
  if (capturedImage) {
    return (
      <SafeAreaView style={s.reviewContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* Header */}
        <View style={s.reviewHeader}>
          <TouchableOpacity style={s.reviewBack} onPress={handleRetake} disabled={isProcessing}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.black} />
          </TouchableOpacity>
          <View>
            <Text style={s.reviewHeaderTitle}>Review Photo</Text>
            <Text style={s.reviewHeaderSub}>{getCaptureTitle()}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Image Preview */}
        <View style={[s.reviewImageWrap, captureType === "selfie" ? s.reviewImageWrapSelfie : s.reviewImageWrapDoc]}>
          <Image source={{ uri: capturedImage }} style={s.reviewImage} resizeMode="contain" />
          <View style={s.reviewOverlayBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} />
            <Text style={s.reviewOverlayText}>Photo captured</Text>
          </View>
        </View>

        {/* Quality Checklist */}
        <View style={s.checklistCard}>
          <Text style={s.checklistTitle}>Before you continue, confirm:</Text>
          {(captureType === "selfie"
            ? ["Your face is fully visible", "Photo is not blurry", "Good lighting"]
            : ["ID is fully in frame", "Text is legible", "No glare or shadows"]
          ).map((item, i) => (
            <View key={i} style={s.checklistRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.primary} />
              <Text style={s.checklistText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.reviewFooter}>
          <TouchableOpacity
            style={s.retakeBtn}
            onPress={handleRetake}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-retake-outline" size={18} color={COLORS.warning} />
            <Text style={s.retakeBtnText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.confirmBtn, isProcessing && { opacity: 0.65 }]}
            onPress={handleConfirm}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={s.confirmBtnText}>Use This Photo</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera Screen ───────────────────────────────────────────────────────────
  const docFrameW = width * 0.86;
  const docFrameH = docFrameW * 0.63;
  const tips = getTips();

  return (
    <View style={{ flex: 1, backgroundColor: "#a78888" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flashMode}
        zoom={captureType === "selfie" ? 0 : zoom}
        enableZoomGesture={captureType !== "selfie"}
        onCameraReady={() => setCameraReady(true)}
      />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={s.camHeader}>
            <TouchableOpacity
              style={s.camIconBtn}
              onPress={() => navigation.goBack()}
              disabled={isCapturing}
            >
              <MaterialCommunityIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={s.camHeaderCenter}>
              <Text style={s.camTitle}>{getCaptureTitle()}</Text>
              <StepIndicator captureType={captureType} />
            </View>

            {captureType !== "selfie" ? (
              <TouchableOpacity
                style={[s.camIconBtn, flashMode === "on" && s.camIconBtnActive]}
                onPress={() => {
                  setFlashMode((p) => (p === "off" ? "on" : "off"));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                disabled={isCapturing}
              >
                <MaterialCommunityIcons
                  name={flashMode === "off" ? "flash-off" : "flash"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Frame Area */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {captureType === "selfie" ? (
              // ── Selfie Frame ──
              <View style={{ alignItems: "center" }}>
                {/* Dark overlay top */}
                <View style={[s.overlayTop, { height: (height - 300) / 2 - 60 }]} />

                <View style={{ flexDirection: "row", height: 280 }}>
                  <View style={s.overlaySide} />
                  <View style={s.selfieFrame}>
                    {/* Corner dashes rendered as arcs via borderRadius trick */}
                    <View style={s.selfieRing} />
                  </View>
                  <View style={s.overlaySide} />
                </View>

                <View style={[s.overlayBottom]} />
              </View>
            ) : (
              // ── Document Frame ──
              <View style={{ alignItems: "center" }}>
                <View
                  style={[
                    s.docFrame,
                    { width: docFrameW, height: docFrameH },
                  ]}
                >
                  {/* Corners */}
                  {[
                    { top: -2, left: -2 },
                    { top: -2, right: -2 },
                    { bottom: -2, left: -2 },
                    { bottom: -2, right: -2 },
                  ].map((pos, i) => (
                    <View
                      key={i}
                      style={[
                        s.corner,
                        pos,
                        i === 1 && { borderLeftWidth: 0, borderRightWidth: 3 },
                        i === 2 && { borderTopWidth: 0, borderBottomWidth: 3 },
                        i === 3 && { borderTopWidth: 0, borderBottomWidth: 3, borderLeftWidth: 0, borderRightWidth: 3 },
                      ]}
                    />
                  ))}
                  {/* Scanning line */}
                  <ScanLine frameHeight={docFrameH} />
                </View>
              </View>
            )}
          </View>

          {/* Instruction bubble */}
          <View style={s.instructionWrap}>
            <View style={s.instructionBubble}>
              <Text style={s.instructionText}>{getCaptureInstructions()}</Text>
            </View>
            {/* Tips */}
            <View style={s.tipsRow}>
              {tips.map((tip, i) => (
                <View key={i} style={s.tipChip}>
                  <View style={s.tipDot} />
                  <Text style={s.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={s.bottomBar}>
            <ShutterButton
              onPress={takePicture}
              disabled={!cameraReady || isCapturing}
              isCapturing={isCapturing}
            />
            <Text style={s.captureHint}>
              {!cameraReady ? "Preparing…" : isCapturing ? "Capturing…" : "Tap to capture"}
            </Text>
          </View>

        </SafeAreaView>
      </Animated.View>

      {/* Camera loading overlay */}
      {!cameraReady && (
        <View style={s.camLoadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.camLoadingText}>Starting camera…</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Permission screens
  permContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 10,
  },
  permSubtitle: {
    fontSize: 15,
    color: COLORS.gray700,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  permBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 14,
    width: "100%",
  },
  permBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "center" },

  // Review screen
  reviewContainer: { flex: 1, backgroundColor: COLORS.white },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    justifyContent: "space-between",
  },
  reviewBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewHeaderTitle: { fontSize: 16, fontWeight: "700", color: COLORS.black, textAlign: "center" },
  reviewHeaderSub: { fontSize: 12, color: COLORS.gray500, textAlign: "center" },
  reviewImageWrap: {
    backgroundColor: COLORS.black,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewImageWrapSelfie: { aspectRatio: 1 },
  reviewImageWrapDoc: { aspectRatio: 1.58 },
  reviewImage: { width: "100%", height: "100%" },
  reviewOverlayBadge: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewOverlayText: { fontSize: 13, fontWeight: "600", color: COLORS.black },
  checklistCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    gap: 10,
  },
  checklistTitle: { fontSize: 13, fontWeight: "600", color: COLORS.gray700, marginBottom: 4 },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checklistText: { fontSize: 14, color: COLORS.black },
  reviewFooter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.warning,
    gap: 8,
    backgroundColor: "#FFFBF0",
  },
  retakeBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.warning },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Camera screen
  camHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  camIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  camIconBtnActive: {
    backgroundColor: COLORS.primary,
  },
  camHeaderCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  camTitle: { fontSize: 17, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 4 },

  // Overlays
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // backgroundColor: COLORS.overlay,
  },
  overlaySide: {
    flex: 1,
    // backgroundColor: COLORS.overlay,
  },
  overlayBottom: {
    position: "absolute", 
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    // backgroundColor: COLORS.overlay,
  },
  selfieFrame: {
    width: 272,
    height: 272,
    borderRadius: 136,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  selfieRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },

  docFrame: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: COLORS.primary,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 3,
  },

  // Instruction area
  instructionWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  instructionBubble: {
    backgroundColor: COLORS.overlay,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    maxWidth: width * 0.88,
  },
  instructionText: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    lineHeight: 19,
    fontWeight: "500",
  },
  tipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  tipText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" },

  // Bottom bar
  bottomBar: {
    alignItems: "center",
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    gap: 10,
  },
  captureHint: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" },

  // Loading overlay
  camLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  camLoadingText: { marginTop: 12, fontSize: 15, color: "#fff", fontWeight: "600" },
});

export default CameraScreen;