import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════
// 🎨 PROGRESS CIRCLE CUSTOMIZATION
// ═══════════════════════════════════════════════════════════════

// Circle dimensions
const CIRCLE_SIZE = 30; // Total size of the progress circle (px)
const STROKE_WIDTH = 6; // Thickness of the progress ring (px)
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Gap at the bottom of the track (creates incomplete circle effect)
const REAR_GAP_DEG = 28; // Gap size in degrees (0-360)
const REAR_DASH = (CIRCUMFERENCE * (360 - REAR_GAP_DEG)) / 360;
const REAR_OFFSET = -(CIRCUMFERENCE * REAR_GAP_DEG) / 360 / 2;

// Animation timing
const PROGRESS_ANIMATION_DURATION = 200; // Smooth transition speed (ms)

// Color thresholds and values
const COLOR_LOW = "#FFA500"; // 0-40% progress (Orange)
const COLOR_MEDIUM = "#FFD700"; // 40-70% progress (Gold)
const COLOR_HIGH = "#00A86B"; // 70-99% progress (Green)
const COLOR_COMPLETE = "#4DFFA0"; // 100% progress (Bright Green)

// Track (background circle) opacity
const TRACK_OPACITY = 0.2; // Background circle transparency (0-1)

// Complete animation
const COMPLETE_SCALE_MAX = 1.35; // Max scale when reaching 100%
const COMPLETE_BOUNCE = 12; // Bounce effect intensity (higher = more bounce)

// ═══════════════════════════════════════════════════════════════

/**
 * Get progress color based on completion percentage
 */
const getProgressColor = (progress) => {
  if (progress >= 100) return COLOR_COMPLETE;
  if (progress >= 70) return COLOR_MEDIUM;
  if (progress >= 40) return COLOR_MEDIUM;
  return COLOR_LOW;
};

/**
 * Get track color with appropriate opacity
 */
const getTrackColor = (progress) => {
  const baseColor = getProgressColor(progress);
  // Extract RGB and apply opacity
  if (baseColor.startsWith("#")) {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${TRACK_OPACITY})`;
  }
  return `rgba(0,168,107,${TRACK_OPACITY})`;
};

const CircularProgress = ({ progress }) => {
  const prevProgress = useRef(progress);
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Smooth progress animation
  useEffect(() => {
    if (progress !== prevProgress.current) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: PROGRESS_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      prevProgress.current = progress;
    }
  }, [progress]);

  // Scale animation when complete
  const isComplete = progress >= 100;
  useEffect(() => {
    if (isComplete) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: COMPLETE_SCALE_MAX,
          useNativeDriver: true,
          speed: 20,
          bounciness: COMPLETE_BOUNCE,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 14,
          bounciness: 10,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isComplete]);

  // Interpolate animated values
  const fillRatio = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const [currentFillRatio, setCurrentFillRatio] = React.useState(0);

  useEffect(() => {
    const listener = animatedProgress.addListener(({ value }) => {
      setCurrentFillRatio(Math.min(value / 100, 1));
    });
    return () => animatedProgress.removeListener(listener);
  }, []);

  const frontDash = CIRCUMFERENCE * currentFillRatio;
  const frontGap = CIRCUMFERENCE - frontDash;

  const strokeColor = getProgressColor(progress);
  const trackColor = getTrackColor(progress);

  return (
    <Animated.View
      style={[progressStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
        {/* Background track (incomplete circle) */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke={trackColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${REAR_DASH} ${CIRCUMFERENCE - REAR_DASH}`}
          strokeDashoffset={REAR_OFFSET}
          strokeLinecap="round"
          rotation={-90}
          originX={CIRCLE_SIZE / 2}
          originY={CIRCLE_SIZE / 2}
        />
        {/* Progress fill (animated) */}
        {progress > 0 && (
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${frontDash} ${frontGap}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            rotation={-90}
            originX={CIRCLE_SIZE / 2}
            originY={CIRCLE_SIZE / 2}
          />
        )}
      </Svg>
    </Animated.View>
  );
};

const progressStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -(CIRCLE_SIZE / 2),
    marginTop: -(CIRCLE_SIZE / 2),
  },
});

const BarcodeScanner = ({ onDetect, scanProgress = 0, barcodeTypes = ["ean8", "ean13", "upc_a", "upc_e", "code128"] }) => {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off" size={56} color="#444" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            Camera is needed to scan barcodes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleScan =  ({ data, type }) => {
    Haptics.impactAsync(Haptics.NotificationFeedbackType.Success); // Haptic feedback on scan
    // console.log(data)
    onDetect(type, data);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
         barcodeTypes
        }}
        onBarcodeScanned={handleScan}
      />

      <View style={styles.overlay}>
        <View style={[styles.mask, styles.topMask]} />

        <View style={styles.scannerFrameRow}>
          <View style={styles.sideMask} />
          <View style={styles.scannerFrame}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Circular Progress */}
            {scanProgress > 0 && <CircularProgress progress={scanProgress} />}
          </View>
          <View style={styles.sideMask} />
        </View>

        <View style={[styles.mask, styles.bottomMask]}>
          <View style={styles.instructionContainer}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={20}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.instruction}>Align barcode within frame</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// 🎨 SCANNER FRAME CUSTOMIZATION
// ═══════════════════════════════════════════════════════════════

// Corner brackets styling
const CORNER_SIZE = 21; // Size of corner brackets (px)
const CORNER_RADIUS = 5; // Corner roundness (px)
const CORNER_THICKNESS = 3; // Corner line thickness (px)
const CORNER_COLOR = "#00A86B"; // Corner bracket color

// Scanner frame dimensions
const SCANNER_FRAME_WIDTH = 280; // Width of scan area (px)
const SCANNER_FRAME_HEIGHT = 200; // Height of scan area (px)

// Overlay mask (darkened area around scanner)
const MASK_OPACITY = 0.72; // Darkness of overlay (0-1)
const MASK_COLOR = `rgba(0,0,0,${MASK_OPACITY})`;

// Instruction text at bottom
const INSTRUCTION_BG_OPACITY = 0.06; // Instruction pill background opacity
const INSTRUCTION_TEXT_OPACITY = 0.65; // Instruction text opacity

// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Permission screen styles
  permissionContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionCard: {
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#222",
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  permissionMessage: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  permissionButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Scanner overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mask: {
    backgroundColor: MASK_COLOR,
  },
  topMask: {
    flex: 1,
  },
  bottomMask: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrameRow: {
    flexDirection: "row",
    height: SCANNER_FRAME_HEIGHT,
  },
  sideMask: {
    flex: 1,
    backgroundColor: MASK_COLOR,
  },
  scannerFrame: {
    width: SCANNER_FRAME_WIDTH,
    backgroundColor: "transparent",
    position: "relative",
  },

  // Corner bracket styles
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopWidth: CORNER_THICKNESS,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderRightWidth: CORNER_THICKNESS,
    borderTopWidth: CORNER_THICKNESS,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomWidth: CORNER_THICKNESS,
    borderBottomRightRadius: CORNER_RADIUS,
  },

  // Bottom instruction pill
  instructionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: `rgba(255,255,255,${INSTRUCTION_BG_OPACITY})`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  instruction: {
    color: `rgba(255,255,255,${INSTRUCTION_TEXT_OPACITY})`,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});

export default BarcodeScanner;
