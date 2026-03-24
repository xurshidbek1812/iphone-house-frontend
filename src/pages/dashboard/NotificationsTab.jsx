import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Loader2,
  Receipt,
  FileWarning,
  HandCoins,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MailOpen,
  CircleAlert,
  CheckCheck
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const getTypeIcon = (type) => {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("kirim")) return Receipt;
  if (normalized.includes("shartnoma")) return HandCoins;
  if (normalized.includes("savdo")) return FileWarning;
  if (normalized.includes("qora")) return ShieldAlert;

  return Bell;
};

const getTypeStyles = (type) => {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("kirim")) {
    return {
      box: "bg-blue-50 text-blue-600",
      badge: "bg-blue-50 text-blue-600"
    };
  }

  if (normalized.includes("shartnoma")) {
    return {
      box: "bg-emerald-50 text-emerald-600",
      badge: "bg-emerald-50 text-emerald-600"
    };
  }

  if (normalized.includes("savdo")) {
    return {
      box: "bg-amber-50 text-amber-600",
      badge: "bg-amber-50 text-amber-600"
    };
  }

  if (normalized.includes("qora")) {
    return {
      box: "bg-rose-50 text-rose-600",
      badge: "bg-rose-50 text-rose-600"
    };
  }

  return {
    box: "bg-slate-100 text-slate-600",
    badge: "bg-slate-100 text-slate-600"
  };
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("uz-UZ");
};

const NotificationsTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadNotifications = async (targetPage = page) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/notifications?page=${targetPage}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      setNotifications(Array.isArray(data?.items) ? data.items : []);
      setPage(Number(data?.page || 1));
      setTotalPages(Number(data?.totalPages || 1));
      setTotal(Number(data?.total || 0));
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const handleReadOne = async (id) => {
    try {
      setActionLoading(true);

      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        await loadNotifications(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReadAll = async () => {
    try {
      setActionLoading(true);

      const res = await fetch(`${API_URL}/api/notifications/read-all/all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        await loadNotifications(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const todayStr = new Date().toDateString();

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const todayCount = notifications.filter((n) => {
      if (!n.createdAt) return false;
      return new Date(n.createdAt).toDateString() === todayStr;
    }).length;

    const byType = notifications.reduce((acc, item) => {
      const key = item.type || "Boshqa";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const typeCards = Object.entries(byType)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      unreadCount,
      todayCount,
      totalCount: total,
      typeCards
    };
  }, [notifications, total]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-blue-50 blur-2xl opacity-80" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-indigo-50 blur-2xl opacity-70" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                <Bell size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Xabarlar</h2>
                <p className="text-sm text-slate-400 font-medium">
                  So‘nggi 2 kun ichidagi tizim xabarlari
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              Jami xabarlar:{" "}
              <span className="font-black text-slate-800">
                {analytics.totalCount} ta
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReadAll}
              disabled={actionLoading || notifications.length === 0}
              className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCheck size={16} />
              )}
              Hammasini o‘qilgan qilish
            </button>

            <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
              <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">
                O‘qilmagan
              </div>
              <div className="text-2xl font-black tracking-tight text-blue-400">
                {analytics.unreadCount} ta
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Bell size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Jami
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.totalCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Hamma notificationlar soni
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <MailOpen size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              O‘qilmagan
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.unreadCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Hozircha ko‘rilmagan xabarlar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CalendarDays size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Bugun
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.todayCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bugungi yangi xabarlar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <CircleAlert size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Sahifa
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {page} / {Math.max(totalPages, 1)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Pagination holati
          </div>
        </div>
      </div>

      {analytics.typeCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {analytics.typeCards.map((item) => {
            const Icon = getTypeIcon(item.name);
            const styles = getTypeStyles(item.name);

            return (
              <div
                key={item.name}
                className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${styles.box}`}
                  >
                    <Icon size={22} />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black ${styles.badge}`}
                  >
                    {item.count} ta
                  </span>
                </div>

                <div className="font-black text-slate-800 break-words">
                  {item.name}
                </div>
                <div className="text-sm text-slate-400 font-medium mt-1">
                  Ushbu sahifadagi xabarlar soni
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800">Xabarlar ro‘yxati</h3>
            <p className="text-sm text-slate-400 font-medium">
              Sahifalarga bo‘lingan notificationlar
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-slate-400">Xabarlar topilmadi</div>
        ) : (
          <div className="p-4 space-y-3">
            {notifications.map((item) => {
              const Icon = getTypeIcon(item.type);
              const styles = getTypeStyles(item.type);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${styles.box}`}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-black text-slate-800 break-words">
                            {item.title || item.type || "Xabar"}
                          </p>

                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black ${styles.badge}`}
                          >
                            {item.type || "Xabar"}
                          </span>

                          {!item.isRead && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black bg-amber-50 text-amber-600">
                              Yangi
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-slate-500 break-words">
                          {item.message || "-"}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold flex-wrap mt-2">
                          <span>{formatDateTime(item.createdAt)}</span>
                          {item.status ? (
                            <>
                              <span>•</span>
                              <span>{item.status}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {!item.isRead && (
                        <button
                          onClick={() => handleReadOne(item.id)}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          O‘qildi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-500">
            Jami:{" "}
            <span className="text-slate-800">{total} ta</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadNotifications(page - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Oldingi
            </button>

            <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-sm">
              {page} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => loadNotifications(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              Keyingi
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;