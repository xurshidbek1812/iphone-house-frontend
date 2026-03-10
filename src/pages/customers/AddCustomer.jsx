import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AddCustomer = () => {
  // --- TELEFON FORMATLASH ---
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
  const { id } = useParams(); 
  const isEditMode = !!id;    

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(isEditMode); 
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); 

  const [regionsData, setRegionsData] = useState([]); // API dan keladi
  const [districts, setDistricts] = useState([]);

  const token = sessionStorage.getItem('token');

  // --- ASOSIY STATE ---
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', gender: 'ERKAK', dob: '', pinfl: '', note: '',
    document: { type: 'Passport', series: '', number: '', givenDate: '', expiryDate: '', givenBy: '' },
    address: { regionId: '', districtId: '', mfy: '', street: '', landmark: '' },
    phones: [{ name: 'Shaxsiy raqam', phone: '+998', isMain: true }],
    job: { type: 'ISHCHI', companyName: '', position: '', source: '' }
  });

  // --- API: HUDUDLARNI BAZADAN YUKLASH ---
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch('https://iphone-house-api.onrender.com/api/regions', {
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const data = await res.json();
        setRegionsData(data);
      } catch (err) { console.error(err); }
    };
    fetchRegions();
  }, [token]);

  // --- API: MIJOZ MA'LUMOTI (TAHRIRLASH) ---
  useEffect(() => {
    if (isEditMode && regionsData.length > 0) {
        const fetchCustomerData = async () => {
            try {
                const res = await fetch(`https://iphone-house-api.onrender.com/api/customers/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Mijoz topilmadi");
                const data = await res.json();

                setFormData({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    middleName: data.middleName || '',
                    gender: data.gender,
                    dob: data.dob ? data.dob.split('T')[0] : '',
                    pinfl: data.pinfl,
                    note: data.note || '',
                    document: {
                        type: data.document.type,
                        series: data.document.series,
                        number: data.document.number,
                        givenDate: data.document.givenDate ? data.document.givenDate.split('T')[0] : '',
                        expiryDate: data.document.expiryDate ? data.document.expiryDate.split('T')[0] : '',
                        givenBy: data.document.givenBy
                    },
                    address: {
                        regionId: data.address.regionId,
                        districtId: data.address.districtId,
                        mfy: data.address.mfy || '',
                        street: data.address.street || '',
                        landmark: data.address.landmark || ''
                    },
                    phones: data.phones.map(p => ({ name: p.name, phone: p.phone, isMain: p.isMain })),
                    job: {
                        type: data.job.type,
                        companyName: data.job.companyName || '',
                        position: data.job.position || '',
                        source: data.job.source || ''
                    }
                });

                const selectedRegion = regionsData.find(r => r.id === data.address.regionId);
                if (selectedRegion) setDistricts(selectedRegion.districts);

            } catch (error) {
                toast.error("Xatolik: " + error.message);
                navigate('/mijozlar');
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchCustomerData();
    }
  }, [isEditMode, id, navigate, token, regionsData]);

  // --- HANDLERS ---
  const clearError = (field) => { if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  
  const handleChange = (e) => { 
      const { name, value } = e.target; 
      setFormData(prev => ({ ...prev, [name]: value })); 
      clearError(name); 
  };

  // --- YANGI JSHSHIR LOGIKASI (SOLISHTIRISH) ---
  const handlePinflChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 14); 
    setFormData(prev => ({ ...prev, pinfl: val }));
    clearError('pinfl');

    if (val.length === 14) {
        const sexCentury = parseInt(val[0]);
        const day = val.substring(1, 3);
        const month = val.substring(3, 5);
        const yearPart = val.substring(5, 7);

        let expectedGender = 'ERKAK';
        let yearPrefix = 1900;

        if ([1, 3, 5].includes(sexCentury)) expectedGender = 'ERKAK';
        else if ([2, 4, 6].includes(sexCentury)) expectedGender = 'AYOL';

        if ([1, 2].includes(sexCentury)) yearPrefix = 1800;
        else if ([3, 4].includes(sexCentury)) yearPrefix = 1900;
        else if ([5, 6].includes(sexCentury)) yearPrefix = 2000;

        const fullYear = yearPrefix + parseInt(yearPart);
        // Format: YYYY-MM-DD
        const expectedDob = `${fullYear}-${month}-${day}`;

        // Tekshirish: 1-bosqichda kiritilgan ma'lumotlar bilan mos tushadimi?
        if (formData.gender !== expectedGender) {
            setErrors(prev => ({ ...prev, pinfl: `Xato! JSHSHIR bo'yicha mijoz ${expectedGender} bo'lishi kerak.` }));
        } else if (formData.dob !== expectedDob) {
            setErrors(prev => ({ ...prev, pinfl: `Xato! JSHSHIR bo'yicha tug'ilgan sana ${expectedDob} bo'lishi kerak.` }));
        } else {
            toast.success("JSHSHIR tasdiqlandi!");
        }
    }
  };

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
    const regionId = Number(e.target.value); 
    setFormData(prev => ({ ...prev, address: { ...prev.address, regionId, districtId: '', mfy: '' } }));
    const selectedRegion = regionsData.find(r => r.id === regionId); 
    setDistricts(selectedRegion ? selectedRegion.districts : []); 
    clearError('regionId');
  };

  const handleDistrictChange = (e) => { 
      const districtId = Number(e.target.value); 
      setFormData(prev => ({ ...prev, address: { ...prev.address, districtId, mfy: '' } })); 
      clearError('districtId'); 
  };
  
  const handlePhoneChange = (index, field, value) => {
    const updatedPhones = [...formData.phones]; updatedPhones[index][field] = field === 'phone' ? formatPhoneNumber(value) : value;
    setFormData(prev => ({ ...prev, phones: updatedPhones })); clearError('phones');
  };
  const addPhone = () => setFormData(prev => ({ ...prev, phones: [...prev.phones, { name: '', phone: '+998', isMain: false }] }));
  const removePhone = (index) => setFormData(prev => ({ ...prev, phones: formData.phones.filter((_, i) => i !== index) }));
  const handleJobChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, job: { ...prev.job, [name]: value } })); clearError(name); };

  // --- VALIDATSIYA ---
  const validateStep = () => {
    let newErrors = {}; let isValid = true; const setError = (field, msg) => { newErrors[field] = msg; isValid = false; };
    switch (step) {
      case 1:
        if (!formData.lastName) setError('lastName', "Familiya shart"); 
        if (!formData.firstName) setError('firstName', "Ism shart"); 
        if (!formData.middleName) setError('middleName', "Otasining ismi shart");
        if (!formData.dob) setError('dob', "Sana yo'q"); 
        else { 
            const b = new Date(formData.dob); 
            const t = new Date(); 
            const m = new Date(t.getFullYear() - 16, t.getMonth(), t.getDate()); 
            if (b > m) setError('dob', "Mijoz 16 yoshdan kichik!"); 
        }
        break;
      case 2:
        if (!formData.document.series || formData.document.series.length !== 2) setError('series', "2 harf");
        if (!formData.document.number || formData.document.number.length !== 7) setError('number', "7 xona");
        if (!formData.document.givenDate) setError('givenDate', "Sana yo'q");
        
        // JSHSHIR tekshiruvi (uzunligi va mosligi)
        if (!formData.pinfl) setError('pinfl', "JSHSHIR shart"); 
        else if (formData.pinfl.length !== 14) setError('pinfl', "14 xona bo'lishi kerak");
        else if (errors.pinfl) isValid = false; // Agar solishtirishda xato chiqqan bo'lsa o'tkazmaydi
        break;
      case 3: 
        if (!formData.address.regionId) setError('regionId', "Viloyat yo'q"); 
        if (!formData.address.districtId) setError('districtId', "Tuman yo'q"); 
        if (!formData.address.mfy) setError('mfy', "MFY yo'q"); 
        if (!formData.address.street) setError('street', "Ko'cha yo'q"); 
        break;
      case 4: 
        const isPhonesValid = formData.phones.every(item => item.phone.replace(/[^\d]/g, "").length === 12);
        if (!isPhonesValid) { setError('phones', "Raqamlar to'liq emas!"); toast.error("Raqamlarni to'liq kiriting."); isValid = false; } break;
      case 5: 
        if (formData.job.type === 'ISHCHI' && (!formData.job.companyName || !formData.job.position)) { setError('companyName', "To'ldiring"); isValid = false; } break;
      default: break;
    }
    setErrors(newErrors); return isValid;
  };

  const handleNext = () => { if (validateStep()) step < 5 ? setStep(step + 1) : handleSubmit(); };

  // --- SAQLASH FUNKSIYASI ---
  const handleSubmit = async () => {
    try {
      const url = isEditMode 
        ? `https://iphone-house-api.onrender.com/api/customers/${id}` 
        : 'https://iphone-house-api.onrender.com/api/customers';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccessModalOpen(true);
        setTimeout(() => {
            setIsSuccessModalOpen(false);
            navigate('/mijozlar');
        }, 2000);
      } else {
        toast.error("Xatolik: " + result.error);
      }
    } catch (e) { toast.error("Server xatosi"); }
  };

  // --- UI QISMLARI ---
  const ErrorMsg = ({ field }) => errors[field] && (<div className="flex items-center gap-1 text-red-500 text-[11px] mt-0.5"><AlertCircle size={10} /> {errors[field]}</div>);
  const getInputClass = (field) => `w-full p-2.5 border rounded-lg text-sm outline-none transition-all ${errors[field] ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'focus:ring-2 focus:ring-blue-500 border-gray-200'}`;

  const renderStep1 = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <h3 className="font-bold text-gray-800 text-center mb-6">Shaxsiy ma'lumotlar</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Familiyasi</label><input name="lastName" value={formData.lastName} onChange={handleChange} className={`${getInputClass('lastName')} uppercase`} /><ErrorMsg field="lastName" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Ismi</label><input name="firstName" value={formData.firstName} onChange={handleChange} className={`${getInputClass('firstName')} uppercase`} /><ErrorMsg field="firstName" /></div>
      </div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Otasining ismi</label><input name="middleName" value={formData.middleName} onChange={handleChange} className={`${getInputClass('middleName')} uppercase`} /><ErrorMsg field="middleName" /></div>
      
      <div className="flex gap-6 py-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="gender" value="ERKAK" checked={formData.gender === 'ERKAK'} onChange={handleChange} className="w-4 h-4 text-blue-600" /> Erkak</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="gender" value="AYOL" checked={formData.gender === 'AYOL'} onChange={handleChange} className="w-4 h-4 text-blue-600" /> Ayol</label>
      </div>

      <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tug'ilgan sanasi</label>
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={getInputClass('dob')} />
          <ErrorMsg field="dob" />
      </div>
      
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Izoh</label><textarea name="note" value={formData.note} onChange={handleChange} className="w-full p-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <h3 className="font-bold text-gray-800 text-center mb-6">Shaxsni tasdiqlovchi hujjat</h3>

      <div><label className="block text-xs font-medium text-gray-600 mb-1">Turi</label><select name="type" value={formData.document.type} onChange={handleDocChange} className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"><option value="Passport">Passport</option><option value="ID Card">ID Card</option><option value="Guvohnoma">Haydovchilik guvohnomasi</option></select></div>
      <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Seriyasi</label><input name="series" value={formData.document.series} onChange={handleDocChange} maxLength={2} className={`${getInputClass('series')} uppercase font-bold`} placeholder="AA" /><div className="text-right text-[10px] text-gray-400 mt-0.5">{formData.document.series.length}/2</div><ErrorMsg field="series" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Raqami</label><input name="number" value={formData.document.number} onChange={handleDocChange} maxLength={7} className={`${getInputClass('number')} font-mono`} placeholder="1234567" /><div className="text-right text-[10px] text-gray-400 mt-0.5">{formData.document.number.length}/7</div><ErrorMsg field="number" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Berilgan sanasi</label><input type="date" name="givenDate" value={formData.document.givenDate} onChange={handleDocumentDateChange} max={new Date().toISOString().split("T")[0]} className={getInputClass('givenDate')} /><ErrorMsg field="givenDate" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Amal qilish sanasi</label><input type="date" name="expiryDate" value={formData.document.expiryDate} onChange={(e) => setFormData(prev => ({...prev, document: {...prev.document, expiryDate: e.target.value}}))} className={getInputClass('expiryDate')} /><ErrorMsg field="expiryDate" /></div>
      </div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Berilgan joyi</label><input name="givenBy" value={formData.document.givenBy} onChange={handleDocChange} className={`${getInputClass('givenBy')} uppercase`} /><ErrorMsg field="givenBy" /></div>
      
      {/* JSHSHIR ENG OXIRIGA TUSHDI */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <label className="block text-xs font-bold text-blue-600 mb-1">JSHSHIR raqami</label>
        <input name="pinfl" value={formData.pinfl} onChange={handlePinflChange} maxLength={14} className={`${getInputClass('pinfl')} font-mono bg-blue-50/30 border-blue-200`} placeholder="14 talik raqamni kiriting" />
        <ErrorMsg field="pinfl" />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <h3 className="font-bold text-gray-800 text-center mb-6">Yashash manzillari</h3>
        <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Asosiy / viloyat</label><select value={formData.address.regionId} onChange={handleRegionChange} className={`${getInputClass('regionId')} bg-white`}><option value="">Tanlang...</option>{regionsData.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><ErrorMsg field="regionId" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Asosiy / tuman</label><select value={formData.address.districtId} onChange={handleDistrictChange} disabled={!formData.address.regionId} className={`${getInputClass('districtId')} bg-white disabled:bg-gray-100`}><option value="">Tanlang...</option>{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><ErrorMsg field="districtId" /></div>
            
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Asosiy / MFY</label>
                <input 
                    type="text"
                    name="mfy" 
                    value={formData.address.mfy} 
                    onChange={(e) => {
                        setFormData(prev => ({...prev, address: {...prev.address, mfy: e.target.value}})); 
                        clearError('mfy');
                    }} 
                    disabled={!formData.address.districtId} 
                    className={`${getInputClass('mfy')} disabled:bg-gray-100`}
                    placeholder="Masalan: Navro'z MFY"
                />
                <ErrorMsg field="mfy" />
            </div>

            <div><label className="block text-xs font-medium text-gray-600 mb-1">Asosiy / ko'cha nomi</label><input value={formData.address.street} onChange={(e) => {setFormData(prev => ({...prev, address: {...prev.address, street: e.target.value}})); clearError('street');}} className={getInputClass('street')} /><ErrorMsg field="street" /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Mo'ljal</label><textarea value={formData.address.landmark} onChange={(e) => setFormData(prev => ({...prev, address: {...prev.address, landmark: e.target.value}}))} className="w-full p-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <h3 className="font-bold text-gray-800 text-center mb-6">Telefon raqamlari</h3>
        {formData.phones.map((item, index) => (
            <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kontakt nomi</label>
                    <input type="text" value={item.name} onChange={(e) => handlePhoneChange(index, 'name', e.target.value)} className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder={index === 0 ? "Shaxsiy nomer" : "Qo'shimcha nomer"}/>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefon raqami</label>
                    <input type="text" value={item.phone} onChange={(e) => handlePhoneChange(index, 'phone', e.target.value)} maxLength={19} className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+998"/>
                </div>
                {index === 0 ? (
                    <button type="button" onClick={addPhone} className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm" title="Qo'shish"><Plus size={20} /></button>
                ) : (
                    <button type="button" onClick={() => removePhone(index)} className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm" title="O'chirish"><Trash2 size={20} /></button>
                )}
            </div>
        ))}
        <ErrorMsg field="phones" />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <h3 className="font-bold text-gray-800 text-center mb-6">Ish joyi va lavozimi</h3>
        <div className="flex gap-6 justify-center mb-4">
            {['ISHCHI', 'NAFAQA', 'ISHSIZ'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="radio" name="type" value={type} checked={formData.job.type === type} onChange={handleJobChange} className="w-4 h-4 text-blue-600" />
                    <span className="capitalize">{type.toLowerCase()}</span>
                </label>
            ))}
        </div>
        {formData.job.type === 'ISHCHI' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Ish joyi</label><input name="companyName" value={formData.job.companyName} onChange={handleJobChange} className={getInputClass('companyName')} /><ErrorMsg field="companyName" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Lavozimi</label><input name="position" value={formData.job.position} onChange={handleJobChange} className={getInputClass('position')} /><ErrorMsg field="position" /></div>
            </div>
        )}
        <div className="mt-4"><label className="block text-xs font-medium text-gray-600 mb-1">Mijoz oqimi manbasi</label><select name="source" value={formData.job.source} onChange={handleJobChange} className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"><option value="">Tanlang...</option><option value="Telegram">Telegram</option><option value="Instagram">Instagram</option><option value="Youtube">Youtube</option><option value="Qayta savdo">Qayta savdo</option><option value="Xodim">Xodim orqali</option><option value="Tashabbuskor">Tashabbuskor orqali</option><option value="O'zi keldi">O'zi keldi</option></select></div>
    </div>
  );

  if (isLoadingData) return <div className="flex items-center justify-center h-screen text-gray-500">Ma'lumotlar yuklanmoqda...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-10 relative"> 
      
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 text-center animate-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-12 border border-slate-100">
                <div className="relative w-28 h-28 mx-auto mb-8">
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-28 h-28 bg-emerald-500 rounded-[35px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 rotate-3 transition-transform">
                        <CheckCircle size={56} strokeWidth={2.5} />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">Bajarildi!</h3>
                <p className="text-slate-400 font-bold text-sm px-4 leading-relaxed uppercase tracking-widest">
                    {isEditMode ? 'Mijoz yangilandi' : 'Mijoz saqlandi'}
                </p>
                <div className="mt-10 px-4">
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full animate-progress-line w-full"></div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-gray-800">{isEditMode ? 'Mijozni tahrirlash' : 'Mijoz qo\'shish'}</h1>
        </div>
        <button type="button" onClick={() => navigate(-1)} className="px-4 py-1.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Bekor qilish</button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 px-4">
        <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex flex-col items-center relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${step >= s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                        {step > s ? <Check size={14} /> : s}
                    </div>
                </div>
            ))}
        </div>
        <div className="relative -mt-5 mx-3 h-0.5 bg-gray-100">
            <div className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
        </div>
      </div>

      {/* Forma qismi */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={(e) => e.preventDefault()}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            
            <div className="flex gap-4 mt-8 pt-2">
                {step > 1 && (
                    <button 
                        type="button" 
                        onClick={() => setStep(step - 1)} 
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                        Ortga qaytish
                    </button>
                )}
                <button 
                    type="button" 
                    onClick={handleNext} 
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                >
                    {step === 5 ? (isEditMode ? 'Saqlash' : 'Davom etish (Saqlash)') : 'Davom etish'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
