import { NativeModules } from "react-native";

const { OnnxDetector } = NativeModules;
// console.log("NativeModules:", NativeModules);

export const detectImage = (path) => OnnxDetector.detect(path);
