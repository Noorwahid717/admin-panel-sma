"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASSWORD_COMPLEXITY_MESSAGE =
  exports.PASSWORD_COMPLEXITY_REGEX =
  exports.PASSWORD_MIN_LENGTH =
    void 0;
exports.PASSWORD_MIN_LENGTH = 12;
exports.PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
exports.PASSWORD_COMPLEXITY_MESSAGE =
  "Password must contain uppercase, lowercase, number, and special character";
//# sourceMappingURL=security.js.map
