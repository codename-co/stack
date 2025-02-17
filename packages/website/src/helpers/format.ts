export const formatSize = (size?: number, lang?: string) => {
  if (!size) {
    return "Unknown";
  }

  return Intl.NumberFormat(lang, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    notation: "compact",
    trailingZeroDisplay: "stripIfInteger",

    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
  }).format(size);
};

export const formatStars = (stars?: number, lang?: string) => {
  if (!stars) {
    return "Unknown";
  }

  return Intl.NumberFormat(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    notation: "compact",
    trailingZeroDisplay: "stripIfInteger",
  }).format(stars);
};

import { format as timeagojs, register } from "timeago.js";
import {
  ar,
  de,
  es,
  fr,
  hi_IN,
  it,
  ja,
  ko,
  pt_BR,
  ru,
  zh_CN,
} from "timeago.js/lib/lang";
register("ar", ar);
register("de", de);
register("es", es);
register("fr", fr);
register("hi", hi_IN);
register("it", it);
register("ja", ja);
register("ko", ko);
register("pt", pt_BR);
register("ru", ru);
register("zh", zh_CN);

export const timeago = timeagojs;
