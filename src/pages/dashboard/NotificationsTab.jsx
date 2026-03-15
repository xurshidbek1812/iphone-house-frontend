import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  TriangleAlert,
  ShoppingCart,
  Receipt,
  Package,
  Loader2,
  UserCircle,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const getTypeIcon = (type) => {
  const safeType = String(type || '').toLowerCase();

  if (safeType.includes('kirim')) return <Package size={18} className="text-blue-600" />;
  if (safeType.includes('savdo')) return <ShoppingCart size={18} className="text-emerald-600" />;
  if (safeType.includes('shartnoma')) return <Receipt size={18} className="text-violet-600" />;
  if (safeType.includes("qora ro'yxat")) return <ShieldAlert size={18} className="text-rose-600" />;

  return <Bell size={18} className="text-slate-600" />;
};

const getTypeBadgeClass = (type) => {
  const safeType = String(type || '').toLowerCase();

  if (safeType.includes('kirim')) return 'bg-blue-50 text-blue-600 border-blue-100';
  if (safeType.includes('savdo')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (safeType.includes('shartnoma')) return 'bg-violet-50 text-violet-600 border-violet-100';
  if (safeType.includes("qora ro'yxat")) return 'bg-rose-50 text-rose-600 border-rose-100';

  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const getStatusBadgeClass = (note) => {
  const status = String(note.status || '').toLowerCase();
  const requestStatus = String(note.requestStatus || '').toLowerCase();

  if (String(note.type || '').toLowerCase().includes("qora ro'yxat")) {
    if (requestStatus.includes('yuborildi')) {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (requestStatus.includes('jarayonda')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (requestStatus.includes('tasdiqlandi')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (requestStatus.includes('bekor')) {
      return 'bg-rose-50 text-rose-600 border-rose-100';
    }
  }

  if (status.includes("to'lov")) return 'bg-violet-50 text-violet-600 border-violet-100';
  if (status.includes('jarayonda')) return 'bg-blue-50 text-blue-600 border-blue-100';
  if (status.includes('tasdiq')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';

  return 'bg-slate-50 text-slate-500 border-slate-200';
};

const NotificationsTab = () => {
  const token = sessionStorage.getItem('token');
  const navigate = useNavigate();


  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/api/notifications`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
            });

            const data = await res.json();

            if (!res.ok) {
            throw new Error(data?.error || 'Notificationlar yuklanmadi');
            }

            const mapped = Array.isArray(data)
            ? data.map((item) => ({
                id: item.id,
                type:
                    item.type === 'BLACKLIST'
                    ? "Qora ro'yxat"
                    : item.type === 'INVOICE'
                    ? 'Kirim'
                    : item.type === 'CONTRACT'
                    ? 'Shartnoma'
                    : item.type === 'ORDER'
                    ? 'Savdo'
                    : item.type,
                supplier: item.title,
                sender: 'Tizim',
                totalSum: Number(item.amount || 0),
                date: new Date(item.createdAt).toLocaleString('uz-UZ'),
                isRead: item.isRead,
                status: item.status,
                reason: item.message,
                requestStatus: item.status,
                entityType: item.entityType,
                entityId: item.entityId
                }))
            : [];

            setNotifications(mapped);


      } catch (error) {
        console.error('NotificationsTab xatosi:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  const pendingCount = useMemo(() => {
    return notifications.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      const requestStatus = String(item.requestStatus || '').toLowerCase();

      return (
        status.includes("to'lov") ||
        requestStatus.includes('yuborildi')
      );
    }).length;
  }, [notifications]);

const markAsRead = async (id) => {
  try {
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  } catch (error) {
    console.error(error);
  }
};

const markAllAsRead = async () => {
  try {
    await fetch(`${API_URL}/api/notifications/read-all/all`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  } catch (error) {
    console.error(error);
  }
};

const handleNotificationClick = async (note) => {
  try {
    if (!note?.isRead) {
      await fetch(`${API_URL}/api/notifications/${note.id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === note.id ? { ...item, isRead: true } : item
        )
      );
    }
  } catch (error) {
    console.error('Notificationni o‘qilgan qilishda xatolik:', error);
  }

  const entityType = String(note.entityType || '').toUpperCase();
  const type = String(note.type || '').toUpperCase();

  if (entityType === 'BLACKLIST_REQUEST' || type === 'BLACKLIST') {
    navigate('/mijozlar/qora-buyurtma');
    return;
  }

  if (entityType === 'SUPPLIER_INVOICE' || type === 'INVOICE') {
    navigate('/ombor/taminotchi-kirim');
    return;
  }

  navigate('/dashboard');
};


  if (loading) {
    return (
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm h-[420px] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={38} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-blue-50 text-blue-600 border-blue-100">
              <Bell size={22} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg border bg-blue-50 text-blue-600 border-blue-100">
              ta
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Jami xabarlar
          </p>
          <h3 className="text-2xl font-black text-slate-800">
            {notifications.length}
          </h3>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-amber-50 text-amber-600 border-amber-100">
              <TriangleAlert size={22} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg border bg-amber-50 text-amber-600 border-amber-100">
              ta
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
            O‘qilmagan xabarlar
          </p>
          <h3 className="text-2xl font-black text-slate-800">
            {unreadCount}
          </h3>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-violet-50 text-violet-600 border-violet-100">
              <Receipt size={22} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg border bg-violet-50 text-violet-600 border-violet-100">
              ta
            </span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Kutilayotganlar
          </p>
          <h3 className="text-2xl font-black text-slate-800">
            {pendingCount}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800">Xabarlar markazi</h2>
            <p className="text-slate-400 font-medium mt-1">
              Savdo, shartnoma, kirim va qora ro‘yxat bo‘yicha ogohlantirishlar
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              <CheckCheck size={16} />
              Hammasini o‘qish
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-slate-400 font-bold text-sm">Hozircha xabarlar yo‘q</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((note) => {
              const isUnread = !note.isRead;
              const isBlacklist = String(note.type || '').toLowerCase().includes("qora ro'yxat");

              return (
                <div
                    key={note.id}
                    onClick={() => handleNotificationClick(note)}
                    className={`group relative rounded-[22px] border p-5 transition-all cursor-pointer ${
                        isUnread
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'
                        : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                >

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        {getTypeIcon(note.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getTypeBadgeClass(note.type)}`}
                          >
                            {note.type}
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusBadgeClass(note)}`}
                          >
                            {isBlacklist ? (note.requestStatus || note.status) : note.status}
                          </span>

                          {isUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-800 truncate">
                          {note.supplier}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <UserCircle size={15} />
                            {note.sender}
                          </span>
                          <span>{note.date}</span>
                        </div>

                        {isBlacklist && note.reason && (
                          <p className="mt-2 text-sm text-slate-600 font-medium line-clamp-2">
                            Sabab: {note.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:justify-end">
                      <div className="text-left lg:text-right">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          {isBlacklist ? 'So‘rov' : 'Summa'}
                        </p>

                        {isBlacklist ? (
                          <p className="text-sm font-black text-rose-600">
                            {note.status}
                          </p>
                        ) : (
                          <p className="text-lg font-black text-emerald-600">
                            {formatMoney(note.totalSum)} UZS
                          </p>
                        )}
                      </div>

                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(note.id);
                        }}

                          className="shrink-0 w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                          title="O‘qilgan qilish"
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
