"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./auth"), exports);
__exportStar(require("./users"), exports);
__exportStar(require("./students"), exports);
__exportStar(require("./teachers"), exports);
__exportStar(require("./classes"), exports);
__exportStar(require("./subjects"), exports);
__exportStar(require("./terms"), exports);
__exportStar(require("./enrollments"), exports);
__exportStar(require("./schedule"), exports);
__exportStar(require("./grades"), exports);
__exportStar(require("./attendance"), exports);
__exportStar(require("./reports"), exports);
__exportStar(require("./storage"), exports);
//# sourceMappingURL=index.js.map
