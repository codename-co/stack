const _f =
  (fractionDigits: number = 1) =>
  (n: number) =>
    n.toFixed(fractionDigits).replace(/\.0$/, "");

export const formatSize = (size?: number) => {
  if (!size) {
    return "Unknown";
  }

  const f = _f(2);

  if (size < 1024) {
    return size + " B";
  }
  const kbs = size / 1024;
  if (kbs < 1024) {
    return f(2) + " KB";
  }
  const mbs = kbs / 1024;
  if (mbs < 1024) {
    return f(2) + " MB";
  }
  const gbs = mbs / 1024;
  return f(2) + " GB";
};

export const formatStars = (stars?: number) => {
  if (!stars) {
    return "Unknown";
  }

  const f = _f(1);

  if (stars < 1000) {
    return stars;
  }
  const k = stars / 1000;
  if (k < 1000) {
    return f(k) + "k";
  }
  const m = k / 1000;
  if (m < 1000) {
    return f(m) + "m";
  }
  const b = m / 1000;
  return f(b) + "b";
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
