"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { adminApi } from "@/lib/api";
import {
  applicationServerKey,
  pushSupported,
  registerQissatiWorker,
} from "@/lib/push";
import { AdminButton, Notice, Panel } from "./AdminUi";

const STATUS_COPY = {
  checking: "عم نتحقق من هاد الجهاز…",
  on: "الإشعارات مفعّلة على هاد الجهاز.",
  off: "الإشعارات مش مفعّلة على هاد الجهاز.",
  denied: "المتصفح حاجب الإشعارات. اسمحولها من إعدادات الموقع أو التطبيق.",
  unsupported: "هاد المتصفح أو الوضع الحالي ما بدعم إشعارات التطبيق.",
  unconfigured: "الخادم لسا مش مهيأ لإرسال إشعارات التطبيق.",
  error: "ما قدرنا نتحقق من حالة الإشعارات.",
};

/** One explicit opt-in per browser/device. No permission prompt runs on mount. */
export default function DeviceNotifications({ token }) {
  const [status, setStatus] = useState("checking");
  const [publicKey, setPublicKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function syncExistingSubscription() {
      if (!pushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }

      const config = await adminApi.pushConfig(token);
      if (cancelled) return;
      if (!config.ok) {
        setStatus("error");
        return;
      }
      if (!config.data?.configured || !config.data?.publicKey) {
        setStatus("unconfigured");
        return;
      }

      setPublicKey(config.data.publicKey);
      try {
        const registration = await registerQissatiWorker();
        const subscription = await registration.pushManager.getSubscription();
        if (cancelled) return;

        if (!subscription) {
          setStatus(Notification.permission === "denied" ? "denied" : "off");
          return;
        }

        // Re-sync an existing browser subscription on every account visit.
        // This repairs a row cleared by a password rotation without asking the
        // operator for notification permission a second time.
        const saved = await adminApi.savePushSubscription(token, subscription.toJSON());
        if (cancelled) return;
        setStatus(saved.ok ? "on" : "error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    syncExistingSubscription();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const enable = async () => {
    if (busy || !publicKey || !pushSupported()) return;
    setBusy(true);
    setNotice("");

    try {
      // Must happen directly inside the click — mobile browsers refuse a
      // permission prompt detached from a user gesture.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await registerQissatiWorker();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(publicKey),
        });
      }

      const saved = await adminApi.savePushSubscription(token, subscription.toJSON());
      if (!saved.ok) {
        setStatus("error");
        return;
      }

      setStatus("on");
      setNotice("هالجهاز صار يستقبل إشعار أول ما يوصل طلب جديد.");
    } catch {
      setStatus(Notification.permission === "denied" ? "denied" : "error");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (busy || !pushSupported()) return;
    setBusy(true);
    setNotice("");

    try {
      const registration = await registerQissatiWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setStatus("off");
        return;
      }

      const endpoint = subscription.endpoint;
      const removedFromBrowser = await subscription.unsubscribe();
      if (!removedFromBrowser) {
        setStatus("error");
        return;
      }

      // The endpoint is invalid after unsubscribe even if this cleanup request
      // fails; the server also removes 404/410 endpoints on its next send.
      const removedFromServer = await adminApi.deletePushSubscription(token, endpoint);
      setStatus("off");
      setNotice(
        removedFromServer.ok
          ? "وقّفنا الإشعارات على هاد الجهاز."
          : "وقفت على هاد الجهاز، وبنشيل التسجيل القديم تلقائيًا.",
      );
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const canEnable = status === "off" || status === "error";

  return (
    <Panel title="التطبيق وإشعارات الطلبات">
      <p className="text-sm leading-relaxed text-muted">
        ثبّتوا لوحة التحكم من خيار «تثبيت التطبيق» أو «إضافة للشاشة الرئيسية»
        بالمتصفح، وبعدها فعّلوا الإشعارات على كل جهاز بدكم يوصله خبر الطلبات.
        الإشعار بيعرض رقم الطلب بس؛ اسم الطفل وتفاصيله بضلّوا جوّا اللوحة.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t-2 border-ink/10 pt-5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink" aria-live="polite">
          {status === "on" ? (
            <Bell className="h-4 w-4 text-brand-deep" aria-hidden="true" />
          ) : (
            <BellOff className="h-4 w-4 text-muted" aria-hidden="true" />
          )}
          {STATUS_COPY[status]}
        </span>

        {status === "on" ? (
          <AdminButton type="button" variant="outline" size="sm" disabled={busy} onClick={disable}>
            {busy ? "لحظة…" : "وقفوا الإشعارات"}
          </AdminButton>
        ) : canEnable ? (
          <AdminButton type="button" size="sm" disabled={busy || !publicKey} onClick={enable}>
            {busy ? "لحظة…" : "فعّلوا الإشعارات"}
          </AdminButton>
        ) : null}
      </div>

      <Notice tone="success">{notice}</Notice>
    </Panel>
  );
}
