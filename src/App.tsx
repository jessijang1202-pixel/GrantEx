import React, { useEffect, useState } from 'react';
import { Search, Filter, ExternalLink, Building2, Calendar, CircleDollarSign, Loader2, CalendarDays, LayoutGrid, ChevronLeft, ChevronRight, MapPin, Users, Menu, X } from 'lucide-react';

interface Grant {
  id: string;
  title: string;
  agency: string;
  source: string;
  category: string;
  amount: string;
  deadline: string; // YYYY-MM-DD
  status: string;
  url: string;
  target: string;
  region: string;
}

export default function App() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters (Multi-select)
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeTargets, setActiveTargets] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  
  // View mode & Calendar State
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'recommend'>('grid');
  // Defaulting to the current local month dynamically
  const [currentMonth, setCurrentMonth] = useState(new Date()); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sources = ['K-Startup', '소상공인24', '모두의 창업'];
  const categories = ['사업화', 'R&D', '기술지원', '공간지원', '자금/인력'];
  const targets = ['예비창업자', '초기창업(3년이내)', '도약기(7년이내)', '재창업자', '소상공인'];
  const regions = ['전국', '서울', '경기', '비수도권'];

  useEffect(() => {
    fetch('/api/grants')
      .then(res => res.json())
      .then(data => {
        setGrants(data.grants || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch", err);
        setLoading(false);
      });
  }, []);

  const filteredGrants = grants.filter(grant => {
    const matchesSearch = grant.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          grant.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = activeSources.length === 0 || activeSources.includes(grant.source);
    const matchesCategory = activeCategories.length === 0 || activeCategories.some(c => grant.category.includes(c));
    const matchesTarget = activeTargets.length === 0 || activeTargets.includes(grant.target);
    const matchesRegion = activeRegions.length === 0 || activeRegions.includes(grant.region);
    
    return matchesSearch && matchesSource && matchesCategory && matchesTarget && matchesRegion;
  });

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Group filtered grants by deadline
  const grantsByDate = filteredGrants.reduce((acc, grant) => {
    if (!acc[grant.deadline]) {
      acc[grant.deadline] = [];
    }
    acc[grant.deadline].push(grant);
    return acc;
  }, {} as Record<string, Grant[]>);

  const renderCheckboxGroup = (title: string, options: string[], state: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => (
    <div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-2">
        <label className="flex items-center space-x-3 text-sm text-slate-600 cursor-pointer">
          <input 
            type="checkbox" 
            checked={state.length === 0}
            onChange={() => setter([])}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 accent-blue-600 cursor-pointer"
          />
          <span className={state.length === 0 ? "font-bold text-blue-600" : ""}>전체</span>
        </label>
        {options.map(item => (
          <label key={item} className="flex items-center space-x-3 text-sm text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={state.includes(item)}
              onChange={() => {
                setter(prev => 
                  prev.includes(item) 
                    ? prev.filter(i => i !== item)
                    : [...prev, item]
                );
              }}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 accent-blue-600 cursor-pointer"
            />
            <span className={state.includes(item) ? "font-bold text-blue-600" : ""}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
        <button 
          onClick={() => {
            setViewMode('grid');
            setSearchQuery('');
            setActiveCategories([]);
            setActiveRegions([]);
            setActiveSources([]);
            setActiveTargets([]);
          }}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none text-left"
        >
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">K-Grant Explorer</span>
        </button>
        
        <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-500 h-full">
          <button 
            onClick={() => setViewMode('grid')}
            className={`h-full px-2 border-b-2 flex items-center ${viewMode === 'grid' ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent hover:text-slate-800 pt-[2px]'}`}
          >
            전체 지원금
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`h-full px-2 border-b-2 flex items-center ${viewMode === 'calendar' ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent hover:text-slate-800 pt-[2px]'}`}
          >
            일정 달력 (캘린더)
          </button>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setViewMode('recommend'); }}
            className={`h-full px-2 border-b-2 flex items-center ${viewMode === 'recommend' ? 'text-blue-600 border-blue-600 font-bold' : 'border-transparent hover:text-slate-800 pt-[2px]'}`}
          >
            맞춤형 추천
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="relative hidden lg:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="지원사업명, 기관 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:border-blue-400 focus:outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full flex flex-col overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <span className="font-bold text-slate-800">메뉴 & 필터</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} /></button>
            </div>
            
            <div className="p-4 border-b border-slate-100 flex flex-col gap-2">
              <button 
                onClick={() => { setViewMode('grid'); setIsMobileMenuOpen(false); }}
                className={`text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutGrid size={18} />
                전체 지원금
              </button>
              <button 
                onClick={() => { setViewMode('calendar'); setIsMobileMenuOpen(false); }}
                className={`text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${viewMode === 'calendar' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CalendarDays size={18} />
                일정 달력 (캘린더)
              </button>
              <button 
                onClick={() => { setViewMode('recommend'); setIsMobileMenuOpen(false); }}
                className={`text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${viewMode === 'recommend' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Search size={18} />
                맞춤형 추천
              </button>
            </div>

            <div className="p-5 border-b border-slate-100">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="지원사업명 검색..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-700 focus:bg-white focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-5 space-y-8 pb-10">
              {renderCheckboxGroup("지역 선택", regions, activeRegions, setActiveRegions)}
              {renderCheckboxGroup("지원 분야", categories, activeCategories, setActiveCategories)}
              {renderCheckboxGroup("기업 유형", targets, activeTargets, setActiveTargets)}
              {renderCheckboxGroup("출처 사이트", sources, activeSources, setActiveSources)}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Filters */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 overflow-y-auto shrink-0 z-10 custom-scrollbar space-y-8">
          {renderCheckboxGroup("지역 선택", regions, activeRegions, setActiveRegions)}
          {renderCheckboxGroup("지원 분야", categories, activeCategories, setActiveCategories)}
          {renderCheckboxGroup("기업 유형", targets, activeTargets, setActiveTargets)}
          {renderCheckboxGroup("출처 사이트", sources, activeSources, setActiveSources)}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 shrink-0 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {viewMode === 'grid' ? '정부지원금 공고' : 
                     viewMode === 'calendar' ? '마감일 캘린더' : '맞춤형 지원금 추천'}
                  </h1>
                  <p className="text-slate-500 text-sm">
                    {viewMode === 'grid' 
                      ? `총 1,248개 중 조건에 맞는 등록 무료 지원금 ${filteredGrants.length}건을 찾았습니다.`
                      : viewMode === 'calendar' 
                      ? '조건에 맞는 지원금의 접수 마감일을 월별로 확인하세요.'
                      : '작성하신 프로필 정보를 바탕으로 가장 합격률이 높은 지원사업을 추천해 드립니다.'}
                  </p>
                </div>
                
                {viewMode === 'calendar' ? (
                  <div className="flex items-center gap-4 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold w-24 text-center">
                      {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                    </span>
                    <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ) : viewMode === 'recommend' ? (
                  <div className="hidden sm:flex space-x-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg font-bold shadow-sm">매칭 알고리즘 최적화 98%</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold shadow-sm">K-Startup</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold shadow-sm">소상공인24</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-blue-500 flex-1">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p className="text-slate-500 text-sm font-medium">데이터를 불러오는 중입니다...</p>
                </div>
              ) : filteredGrants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed flex-1">
                  <Filter size={40} className="text-slate-300 mb-4" />
                  <h3 className="text-slate-900 font-bold text-lg mb-1">검색 결과가 없습니다</h3>
                  <p className="text-slate-500 text-sm">다른 지역이나 지원대상을 선택해보세요.</p>
                </div>
              ) : (
                viewMode === 'grid' ? (
                  // --- GRID VIEW ---
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {filteredGrants.map(grant => (
                      <a href={grant.url} target="_blank" rel="noopener noreferrer" key={grant.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-blue-400 transition-colors cursor-pointer group shadow-sm hover:shadow block">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border bg-white ${
                              grant.category.includes('사업화') ? 'text-blue-600 border-blue-600' :
                              grant.category.includes('지원') ? 'text-emerald-600 border-emerald-600' :
                              grant.category.includes('공간') ? 'text-indigo-600 border-indigo-600' :
                              grant.category.includes('R&D') ? 'text-amber-600 border-amber-600' :
                              'text-slate-600 border-slate-600'
                            }`}>
                              {grant.category}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              grant.status === '접수마감임박' ? 'text-red-500' : 
                              grant.status === '마감' ? 'text-slate-400 bg-slate-50 border border-slate-100' :
                              'text-slate-900 bg-slate-50 border border-slate-100'
                            }`}>
                              {grant.status === '접수마감임박' ? `D-마감임박` : grant.status}
                            </span>
                          </div>
                          
                          <h2 className="text-[17px] font-bold text-slate-900 mb-4 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 pr-2">
                            {grant.title}
                          </h2>
                          
                          <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-500 mb-4">
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400 shrink-0" />
                              <span className="truncate">{grant.target}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-slate-400 shrink-0" />
                              <span className="truncate">{grant.region}</span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                              <Calendar size={14} className="text-slate-400 shrink-0" />
                              <span>마감: {grant.deadline}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                          <div className="text-[15px] font-bold text-slate-800 flex items-center gap-1.5">
                            <CircleDollarSign size={16} className="text-blue-500" />
                            {grant.amount}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-100 flex items-center gap-1">
                            {grant.agency.length > 8 ? `${grant.agency.substring(0, 8)}...` : grant.agency}
                            <ExternalLink size={10} className="text-slate-300 ml-1" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : viewMode === 'recommend' ? (
                  // --- RECOMMEND VIEW ---
                  <div className="flex flex-col gap-6 pb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-4">
                          김대표 님의 사업 프로필 반영
                        </div>
                        <h2 className="text-2xl font-bold mb-2">초기창업 (3년 이내) • IT/플랫폼 분야 • 서울 지역</h2>
                        <p className="text-blue-100 max-w-lg">최근 합격 트렌드 및 대표님의 사업 연차와 지역에 가장 유리한 상환 의무 없는 지원금을 분석했습니다.</p>
                      </div>
                      <div className="absolute right-0 top-0 w-64 h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-4 px-2">🔥 최우선 매천 추천 공고 (Top 3)</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredGrants.slice(0, 3).map((grant, i) => (
                        <a href={grant.url} target="_blank" rel="noopener noreferrer" key={grant.id} className="bg-white border-2 border-indigo-100 rounded-xl p-6 flex flex-col justify-between hover:border-indigo-400 transition-colors cursor-pointer group shadow-sm relative block">
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm z-10 text-sm">
                            {i+1}
                          </div>
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border bg-white ${
                                grant.category.includes('사업화') ? 'text-blue-600 border-blue-600' :
                                grant.category.includes('지원') ? 'text-emerald-600 border-emerald-600' :
                                grant.category.includes('공간') ? 'text-indigo-600 border-indigo-600' :
                                grant.category.includes('R&D') ? 'text-amber-600 border-amber-600' :
                                'text-slate-600 border-slate-600'
                              }`}>
                                {grant.category}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                grant.status === '접수마감임박' ? 'text-red-500' : 
                                grant.status === '마감' ? 'text-slate-400 bg-slate-50 border border-slate-100' :
                                'text-slate-900 bg-slate-50 border border-slate-100'
                              }`}>
                                {grant.status === '접수마감임박' ? `D-마감임박` : grant.status}
                              </span>
                            </div>
                            
                            <h2 className="text-[17px] font-bold text-slate-900 mb-4 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 pr-6">
                              {grant.title}
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-500 mb-4">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">{grant.target}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">{grant.region}</span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2">
                                <Calendar size={14} className="text-slate-400 shrink-0" />
                                <span className="font-medium text-red-500">마감: {grant.deadline}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                            <div className="text-[15px] font-bold text-indigo-700 flex items-center gap-1.5">
                              <CircleDollarSign size={16} className="text-indigo-500" />
                              {grant.amount}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded flex items-center gap-1">
                              {grant.agency.length > 8 ? `${grant.agency.substring(0, 8)}...` : grant.agency}
                              <ExternalLink size={10} className="text-slate-400 ml-1" />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  // --- CALENDAR VIEW ---
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 shrink-0">
                      {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-slate-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,1fr)]">
                      {calendarDays().map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="border-b border-r border-slate-100 bg-slate-50/30 p-2"></div>;
                        
                        const dateStr = formatDateString(day);
                        const dayGrants = grantsByDate[dateStr] || [];
                        const isToday = formatDateString(new Date()) === dateStr;

                        return (
                          <div key={day.toISOString()} className={`border-b border-r border-slate-100 p-2 relative transition-colors hover:bg-slate-50 ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                              {day.getDate()}
                            </div>
                            
                            <div className="space-y-1">
                              {dayGrants.map(grant => (
                                <a
                                  href={grant.url}
                                  target="_blank"
                                  rel="noopener noreferrer" 
                                  key={grant.id} 
                                  className="text-[10px] bg-white border border-slate-200 rounded p-1.5 cursor-pointer hover:border-blue-400 group truncate transition-colors shadow-sm block relative z-10"
                                  title={grant.title}
                                >
                                  <div className="flex gap-1 mb-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${grant.status === '접수마감임박' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                    <span className="font-bold text-slate-700 truncate group-hover:text-blue-600">
                                      {grant.title}
                                    </span>
                                  </div>
                                  <div className="text-slate-400 text-[9px] pl-2.5 truncate">
                                    {grant.agency}
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bottom Toolbar */}
          <footer className="h-12 bg-slate-900 text-white flex items-center justify-between px-8 text-xs shrink-0">
            <div className="flex items-center space-x-6">
              <span>업데이트: 2026.04.21 14:00</span>
              <span className="opacity-50">|</span>
              <span className="hidden sm:inline">연동기관: K-Startup, 소상공인24, 기업마당, 모두의창업</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:underline">개인정보처리방침</a>
              <a href="#" className="hover:underline">이용약관</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
