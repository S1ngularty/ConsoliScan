exports.parseBarcodeType = (data) => {
  switch (data) {
    case "ean13":
      return "EAN_13";
      break;
    case "upc":
      return "UPC";
      break;
    case "ean8":
      return "EAN_8";
      break;
    case "code128":
      return "CODE_128";
      break;
    case "upc_a":
      return "UPC_A";
      break;
    case "upc_e":
      return "UPC_E";
      break;
    default:
      return null;
      break;
  }
};
