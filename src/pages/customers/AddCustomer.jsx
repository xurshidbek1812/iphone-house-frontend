import React, { useState, useEffect } from 'react';
// useParams import qilindi (URL dan ID ni olish uchun)
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, Plus, Trash2, Calendar, AlertCircle, Save } from 'lucide-react';

const AddCustomer = () => {
  // --- TELEFON FORMATLASH (O'zgarmadi) ---
  const formatPhoneNumber = (value) => {
    if (!value) return "+998";
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return "+998";
    if (phoneNumberLength < 6) return `+998 (${phoneNumber.slice(3, 5)}`;
    if (phoneNumberLength < 9) return `+998 (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}`;
    if (phoneNumberLength < 11) return `+998 (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8, 10)}`;
    return `+998 (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8, 10)}-${phoneNumber.slice(10, 12)}`;
  };  

  const navigate = useNavigate();
  const { id } = useParams(); // <-- YANGI: URL dan ID ni olamiz
  const isEditMode = !!id;    // <-- YANGI: Agar ID bor bo'lsa, demak "Tahrirlash rejimi"

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(isEditMode); // Ma'lumot yuklanayotganda kutish

  const [regionsData, setRegionsData] = useState([]);
  const [districts, setDistricts] = useState([]);

  const token = localStorage.getItem('token');

  // --- ASOSIY STATE (Bo'sh holati) ---
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', gender: 'ERKAK', dob: '', pinfl: '', note: '',
    document: { type: 'Passport', series: '', number: '', givenDate: '', expiryDate: '', givenBy: '' },
    address: { regionId: '', districtId: '', mfy: '', street: '', landmark: '' },
    phones: [{ name: 'Shaxsiy raqam', phone: '+998', isMain: true }],
    job: { type: 'ISHCHI', companyName: '', position: '', source: '' }
  });

  // --- API 1: HUDUDLARNI YUKLASH ---
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch('https://iphone-house-api.onrender.com/api/regions', {
            headers: { 'Authorization': `Bearer ${token}` } // <--- TOKEN
        });
        const data = await res.json();
        setRegionsData(data);
      } catch (err) { console.error(err); }
    };
    fetchRegions();
  }, []);

  // --- API 2: (YANGI) MIJOZ MA'LUMOTLARINI YUKLASH (TAHRIRLASH UCHUN) ---
  useEffect(() => {
    if (isEditMode) {
        const fetchCustomerData = async () => {
            try {
                const res = await fetch(`https://iphone-house-api.onrender.com/api/customers/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Mijoz topilmadi");
                const data = await res.json();

                // Backenddan kelgan ma'lumotni Frontend formatiga o'tkazamiz
                setFormData({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    middleName: data.middleName || '',
                    gender: data.gender,
                    // Sanalarni ISO dan YYYY-MM-DD formatiga o'tkazamiz
                    dob: data.dob.split('T')[0],
                    pinfl: data.pinfl,
                    note: data.note || '',
                    
                    document: {
                        type: data.document.type,
                        series: data.document.series,
                        number: data.document.number,
                        givenDate: data.document.givenDate.split('T')[0],
                        expiryDate: data.document.expiryDate.split('T')[0],
                        givenBy: data.document.givenBy
                    },
                    address: {
                        regionId: data.address.regionId,
                        districtId: data.address.districtId,
                        mfy: data.address.mfy || '',
                        street: data.address.street || '',
                        landmark: data.address.landmark || ''
                    },
                    // Telefonlarni to'g'ridan-to'g'ri olamiz
                    phones: data.phones.map(p => ({ name: p.name, phone: p.phone, isMain: p.isMain })),
                    job: {
                        type: data.job.type,
                        companyName: data.job.companyName || '',
                        position: data.job.position || '',
                        source: data.job.source || ''
                    }
                });

                // Tumanlarni ham yuklab qo'yish kerak, aks holda tuman tanlash ishlamaydi
                if (regionsData.length > 0) {
                    const selectedRegion = regionsData.find(r => r.id === data.address.regionId);
                    if (selectedRegion) setDistricts(selectedRegion.districts);
                }

            } catch (error) {
                alert("Xatolik: " + error.message);
                navigate('/mijozlar');
            } finally {
                setIsLoadingData(false);
            }
        };
        
        // Hududlar yuklanib bo'lgandan keyin mijozni yuklaymiz
        if (regionsData.length > 0) {
            fetchCustomerData();
        }
    }
  }, [isEditMode, id, navigate, regionsData]);

  // --- HANDLERS (O'zgarmadi) ---
  const clearError = (field) => { if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); clearError(name); };
  const handleDocChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, document: { ...prev.document, [name]: value } })); clearError(name); };
  const handleDocumentDateChange = (e) => {
    const givenDateVal = e.target.value; handleDocChange(e);
    if (givenDateVal) {
      const date = new Date(givenDateVal); date.setFullYear(date.getFullYear() + 10); date.setDate(date.getDate() - 1);
      const expiryString = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, document: { ...prev.document, givenDate: givenDateVal, expiryDate: expiryString } })); clearError('expiryDate');
    }
  };
  const handleRegionChange = (e) => {
    const regionId = Number(e.target.value); setFormData(prev => ({ ...prev, address: { ...prev.address, regionId, districtId: '', mfy: '' } }));
    const selectedRegion = regionsData.find(r => r.id === regionId); setDistricts(selectedRegion ? selectedRegion.districts : []); clearError('regionId');
  };
  const handleDistrictChange = (e) => { const districtId = Number(e.target.value); setFormData(prev => ({ ...prev, address: { ...prev.address, districtId, mfy: '' } })); clearError('districtId'); };
  const handlePhoneChange = (index, field, value) => {
    const updatedPhones = [...formData.phones]; updatedPhones[index][field] = field === 'phone' ? formatPhoneNumber(value) : value;
    setFormData(prev => ({ ...prev, phones: updatedPhones })); clearError('phones');
  };
  const addPhone = () => setFormData(prev => ({ ...prev, phones: [...prev.phones, { name: '', phone: '+998', isMain: false }] }));
  const removePhone = (index) => setFormData(prev => ({ ...prev, phones: formData.phones.filter((_, i) => i !== index) }));
  const handleJobChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, job: { ...prev.job, [name]: value } })); clearError(name); };

  // --- VALIDATSIYA (O'zgarmadi) ---
  const validateStep = () => {
    let newErrors = {}; let isValid = true; const setError = (field, msg) => { newErrors[field] = msg; isValid = false; };
    switch (step) {
      case 1:
        if (!formData.lastName) setError('lastName', "Familiya shart"); if (!formData.firstName) setError('firstName', "Ism shart"); if (!formData.middleName) setError('middleName', "Otasining ismi shart");
        if (!formData.dob) setError('dob', "Tug'ilgan sana yo'q"); else { const b = new Date(formData.dob); const t = new Date(); const m = new Date(t.getFullYear() - 16, t.getMonth(), t.getDate()); if (b > m) setError('dob', "Mijoz 16 yoshdan kichik!"); }
        if (!formData.pinfl) setError('pinfl', "JSHSHIR shart"); else if (formData.pinfl.length !== 14) setError('pinfl', "JSHSHIR 14 xona bo'lishi kerak");
        break;
      case 2:
        if (!formData.document.series || formData.document.series.length !== 2) setError('series', "Seriya 2 harf");
        if (!formData.document.number || formData.document.number.length !== 7) setError('number', "Raqam 7 xona");
        if (!formData.document.givenDate) setError('givenDate', "Berilgan sana yo'q");
        break;
      case 3: if (!formData.address.regionId) setError('regionId', "Viloyat yo'q"); if (!formData.address.districtId) setError('districtId', "Tuman yo'q"); if (!formData.address.mfy) setError('mfy', "MFY nomi yo'q"); if (!formData.address.street) setError('street', "Ko'cha nomi yo'q"); break;
      case 4: 
        const isPhonesValid = formData.phones.every(item => item.phone.replace(/[^\d]/g, "").length === 12);
        if (!isPhonesValid) { setError('phones', "Raqamlar to'liq emas!"); alert("Raqamlarni to'liq kiriting."); isValid = false; } break;
      case 5: if (formData.job.type === 'ISHCHI' && (!formData.job.companyName || !formData.job.position)) { setError('companyName', "Ish joyi va lavozim shart"); isValid = false; } break;
      default: break;
    }
    setErrors(newErrors); return isValid;
  };

  const handleNext = () => { if (validateStep()) step < 5 ? setStep(step + 1) : handleSubmit(); };

  // --- (YANGI) SAQLASH FUNKSIYASI ---
  const handleSubmit = async () => {
    try {
      // Tahrirlash rejimi bo'lsa PUT, bo'lmasa POST
      const url = isEditMode 
        ? `https://iphone-house-api.onrender.com/api/customers/${id}` 
        : 'https://iphone-house-api.onrender.com/api/customers';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- TOKEN
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(isEditMode ? "Mijoz ma'lumotlari yangilandi!" : "Yangi mijoz qo'shildi!");
        navigate('/mijozlar');
      } else {
        alert("Xatolik: " + result.error);
      }
    } catch (e) { alert("Server xatosi"); }
  };

  // --- UI QISMLARI (O'zgarmadi) ---
  const ErrorMsg = ({ field }) => errors[field] && (<div className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={12} /> {errors[field]}</div>);
  const getInputClass = (field) => `w-full p-3 border rounded-lg outline-none transition-all ${errors[field] ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-blue-500 border-gray-300'}`;

  // --- RENDER STEPS (HTML qismlari bir xil, faqat sarlavha o'zgaradi) ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800">Shaxsiy ma'lumotlar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Familiyasi *</label><input name="lastName" value={formData.lastName} onChange={handleChange} className={`${getInputClass('lastName')} uppercase`} /><ErrorMsg field="lastName" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Ismi *</label><input name="firstName" value={formData.firstName} onChange={handleChange} className={`${getInputClass('firstName')} uppercase`} /><ErrorMsg field="firstName" /></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Otasining ismi *</label><input name="middleName" value={formData.middleName} onChange={handleChange} className={`${getInputClass('middleName')} uppercase`} /><ErrorMsg field="middleName" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Jinsi</label><div className="flex gap-6"><label className="flex items-center gap-2"><input type="radio" name="gender" value="ERKAK" checked={formData.gender === 'ERKAK'} onChange={handleChange} className="w-5 h-5" /> Erkak</label><label className="flex items-center gap-2"><input type="radio" name="gender" value="AYOL" checked={formData.gender === 'AYOL'} onChange={handleChange} className="w-5 h-5" /> Ayol</label></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sanasi *</label><div className="relative"><input type="date" name="dob" value={formData.dob} onChange={handleChange} className={getInputClass('dob')} /><Calendar className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} /></div><ErrorMsg field="dob" /></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">JSHSHIR raqami *</label><input name="pinfl" value={formData.pinfl} onChange={handleChange} maxLength={14} className={`${getInputClass('pinfl')} font-mono tracking-widest`} placeholder="12345678901234" /><ErrorMsg field="pinfl" /></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label><textarea name="note" value={formData.note} onChange={handleChange} className="w-full p-3 border rounded-lg outline-none" rows={3} /></div>
      </div>
    </div>
  );
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800">Shaxsni tasdiqlovchi hujjat</h2>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Hujjat turi</label><select name="type" value={formData.document.type} onChange={handleDocChange} className="w-full p-3 border rounded-lg bg-white"><option value="Passport">Passport</option><option value="ID Card">ID Card</option><option value="Guvohnoma">Haydovchilik guvohnomasi</option></select></div>
      <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Seriyasi *</label><input name="series" value={formData.document.series} onChange={handleDocChange} maxLength={2} className={`${getInputClass('series')} uppercase font-bold`} placeholder="AA" /><ErrorMsg field="series" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Raqami *</label><input name="number" value={formData.document.number} onChange={handleDocChange} maxLength={7} className={`${getInputClass('number')} font-mono`} placeholder="1234567" /><ErrorMsg field="number" /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Berilgan sanasi *</label><input type="date" name="givenDate" value={formData.document.givenDate} onChange={handleDocumentDateChange} max={new Date().toISOString().split("T")[0]} className={getInputClass('givenDate')} /><ErrorMsg field="givenDate" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Amal qilish sanasi *</label><input type="date" name="expiryDate" value={formData.document.expiryDate} onChange={(e) => setFormData(prev => ({...prev, document: {...prev.document, expiryDate: e.target.value}}))} className={getInputClass('expiryDate')} /><ErrorMsg field="expiryDate" /></div></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Berilgan joyi *</label><input name="givenBy" value={formData.document.givenBy} onChange={handleDocChange} className={`${getInputClass('givenBy')} uppercase`} /><ErrorMsg field="givenBy" /></div>
    </div>
  );
  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800">Yashash manzillari</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Viloyat *</label><select value={formData.address.regionId} onChange={handleRegionChange} className={`${getInputClass('regionId')} bg-white`}><option value="">Tanlang</option>{regionsData.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><ErrorMsg field="regionId" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tuman *</label><select value={formData.address.districtId} onChange={handleDistrictChange} disabled={!formData.address.regionId} className={`${getInputClass('districtId')} bg-white disabled:bg-gray-100`}><option value="">Tanlang</option>{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><ErrorMsg field="districtId" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">MFY *</label><input type="text" name="mfy" value={formData.address.mfy} onChange={(e) => {setFormData(prev => ({...prev, address: {...prev.address, mfy: e.target.value}})); clearError('mfy');}} disabled={!formData.address.districtId} className={`${getInputClass('mfy')} disabled:bg-gray-100`} placeholder="Masalan: Navro'z MFY"/><ErrorMsg field="mfy" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ko'cha nomi *</label><input value={formData.address.street} onChange={(e) => {setFormData(prev => ({...prev, address: {...prev.address, street: e.target.value}})); clearError('street');}} className={getInputClass('street')} /><ErrorMsg field="street" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Mo'ljal</label><textarea value={formData.address.landmark} onChange={(e) => setFormData(prev => ({...prev, address: {...prev.address, landmark: e.target.value}}))} className="w-full p-3 border rounded-lg outline-none" rows={2} /></div>
        </div>
    </div>
  );
  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800">Telefon raqamlari</h2>
        {formData.phones.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Kontakt nomi</label><input type="text" value={item.name} onChange={(e) => handlePhoneChange(index, 'name', e.target.value)} className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder={index === 0 ? "Shaxsiy raqam" : "Masalan: Dadasini raqami"}/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label><input type="text" value={item.phone} onChange={(e) => handlePhoneChange(index, 'phone', e.target.value)} maxLength={19} className="w-full p-3 border rounded-lg bg-white font-mono text-lg tracking-wide focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+998 (__) ___-__-__"/></div>
                </div>
                {index > 0 && (<button onClick={() => removePhone(index)} className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="O'chirish"><Trash2 size={18} /></button>)}
            </div>
        ))}
        <button onClick={addPhone} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 font-medium flex items-center justify-center gap-2 transition-colors"><Plus size={20} /> Yana raqam qo'shish</button>
        <ErrorMsg field="phones" />
    </div>
  );
  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800">Ish joyi va lavozimi</h2>
        <div className="flex gap-6 mb-6">
            {['ISHCHI', 'NAFAQA', 'ISHSIZ'].map((type) => (<label key={type} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value={type} checked={formData.job.type === type} onChange={handleJobChange} className="w-5 h-5 text-blue-600" /><span className="capitalize">{type.toLowerCase()}</span></label>))}
        </div>
        {formData.job.type === 'ISHCHI' && (
            <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-top-2">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ish joyi *</label><input name="companyName" value={formData.job.companyName} onChange={handleJobChange} className={getInputClass('companyName')} placeholder="Masalan: 21-maktab" /><ErrorMsg field="companyName" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lavozimi *</label><input name="position" value={formData.job.position} onChange={handleJobChange} className={getInputClass('position')} placeholder="Masalan: O'qituvchi" /><ErrorMsg field="position" /></div>
            </div>
        )}
        <div className="mt-6 pt-6 border-t"><label className="block text-sm font-medium text-gray-700 mb-1">Mijoz oqimi manbasi</label><select name="source" value={formData.job.source} onChange={handleJobChange} className="w-full p-3 border rounded-lg bg-white"><option value="">Tanlang...</option><option value="Telegram">Telegram</option><option value="Instagram">Instagram</option><option value="Youtube">Youtube</option><option value="Qayta savdo">Qayta savdo</option><option value="Xodim">Xodim orqali</option><option value="Tashabbuskor">Tashabbuskor orqali</option><option value="O'zi keldi">O'zi keldi</option></select></div>
    </div>
  );

  if (isLoadingData) {
      return <div className="flex items-center justify-center h-screen text-gray-500">Ma'lumotlar yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={24} /></button>
        {/* Sarlavha o'zgaradi */}
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Mijoz ma\'lumotlarini tahrirlash' : 'Mijoz qo\'shish'}</h1>
      </div>

      {/* Progress Bar (O'zgarmadi) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${step >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {step > s ? <Check size={16} /> : s}
                    </div>
                </div>
            ))}
        </div>
        <div className="relative -mt-6 mx-4 h-1 bg-gray-200">
            <div className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={(e) => e.preventDefault()}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">{step === 1 ? 'Bekor qilish' : 'Ortga qaytish'}</button>
                <button onClick={handleNext} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200">
                    {/* Tugma matni va ikonasi o'zgaradi */}
                    {step === 5 ? (isEditMode ? <>Saqlash <Save size={18}/></> : <>Saqlash <ChevronRight size={18}/></>) : <>Davom etish <ChevronRight size={18}/></>}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};


export default AddCustomer;
