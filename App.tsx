
import React, { useState, useEffect, useMemo } from 'react';
import { RankItem, CheckIn, PageRank, Priority } from './types';
import { getItems, saveItems, getCheckIns, saveCheckIns } from './utils/storage';
import { RankBadge } from './components/RankBadge';
import { COLORS, DEFAULT_CHECKLIST } from './constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type View = 'dashboard' | 'form' | 'details' | 'export';

export default function App() {
  const [items, setItems] = useState<RankItem[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'recent' | 'worst' | 'best'>('recent');

  useEffect(() => {
    setItems(getItems());
    setCheckins(getCheckIns());
  }, []);

  useEffect(() => {
    if (items.length > 0) saveItems(items);
  }, [items]);

  useEffect(() => {
    if (checkins.length > 0) saveCheckIns(checkins);
  }, [checkins]);

  const projects = useMemo(() => Array.from(new Set(items.map(i => i.project))), [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = item.keyword.toLowerCase().includes(search.toLowerCase()) || 
                            item.url.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || item.currentPage.toString() === filterStatus;
        const matchesProject = filterProject === 'all' || item.project === filterProject;
        return matchesSearch && matchesStatus && matchesProject;
      })
      .sort((a, b) => {
        if (sortMode === 'recent') return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
        if (sortMode === 'worst') return b.currentPage - a.currentPage;
        if (sortMode === 'best') return a.currentPage - b.currentPage;
        return 0;
      });
  }, [items, search, filterStatus, filterProject, sortMode]);

  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    let risers = 0;
    let fallers = 0;

    items.forEach(item => {
      const itemCheckins = checkins
        .filter(c => c.itemId === item.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (itemCheckins.length >= 2) {
        const latest = itemCheckins[0];
        const previous = itemCheckins.find(c => new Date(c.date).getTime() <= sevenDaysAgo) || itemCheckins[1];
        if (latest.page < previous.page) risers++;
        if (latest.page > previous.page) fallers++;
      }
    });

    return {
      total: items.length,
      pageOne: items.filter(i => i.currentPage === 1).length,
      risers,
      fallers
    };
  }, [items, checkins]);

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItemId = Math.random().toString(36).substr(2, 9);
    const page = parseInt(formData.get('page') as string) as PageRank;

    const newItem: RankItem = {
      id: newItemId,
      project: formData.get('project') as string,
      url: formData.get('url') as string,
      keyword: formData.get('keyword') as string,
      currentPage: page,
      targetPage: 1,
      priority: formData.get('priority') as Priority,
      notes: formData.get('notes') as string,
      testNotes: '',
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      checklist: DEFAULT_CHECKLIST.map(label => ({ id: Math.random().toString(), label, completed: false })),
    };

    const firstCheckin: CheckIn = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: newItemId,
      date: new Date().toISOString(),
      page: page,
    };

    setItems([...items, newItem]);
    setCheckins([...checkins, firstCheckin]);
    setCurrentView('dashboard');
  };

  const handleNewCheckIn = (itemId: string, page: PageRank, notes?: string) => {
    const newCheckin: CheckIn = {
      id: Math.random().toString(36).substr(2, 9),
      itemId,
      date: new Date().toISOString(),
      page,
      notes
    };
    setCheckins([...checkins, newCheckin]);
    setItems(items.map(item => item.id === itemId ? { ...item, currentPage: page, lastUpdatedAt: new Date().toISOString() } : item));
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este monitoramento? Todo o histórico será perdido.')) {
      setItems(items.filter(i => i.id !== id));
      setCheckins(checkins.filter(c => c.itemId !== id));
      setCurrentView('dashboard');
    }
  };

  const toggleChecklist = (itemId: string, actionId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          checklist: item.checklist.map(cl => 
            cl.id === actionId ? { ...cl, completed: !cl.completed, date: !cl.completed ? new Date().toISOString() : undefined } : cl
          )
        };
      }
      return item;
    }));
  };

  const exportCSV = () => {
    const headers = ['Projeto', 'Palavra-chave', 'URL', 'Pagina Atual', 'Ultima Atualizacao', 'Prioridade'];
    const rows = filteredItems.map(item => [
      item.project,
      item.keyword,
      item.url,
      item.currentPage === 4 ? '4+' : item.currentPage,
      new Date(item.lastUpdatedAt).toLocaleDateString(),
      item.priority
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rank_tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const Dashboard = () => (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Total de URLs</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Na Página 1</p>
          <p className="text-2xl font-bold text-green-600">{stats.pageOne}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Subiram (7d)</p>
          <p className="text-2xl font-bold text-blue-600">↑ {stats.risers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Caíram (7d)</p>
          <p className="text-2xl font-bold text-red-600">↓ {stats.fallers}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Buscar palavra-chave ou URL..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Todos Status</option>
              <option value="1">Página 1</option>
              <option value="2">Página 2</option>
              <option value="3">Página 3</option>
              <option value="4">Página 4+</option>
            </select>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="all">Todos Projetos</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Projeto / Palavra-chave</th>
              <th className="px-6 py-4 hidden md:table-cell">URL</th>
              <th className="px-6 py-4">Variação</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => {
               const itemCheckins = checkins.filter(c => c.itemId === item.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
               let variation = "Igual";
               let varColor = "text-slate-400";
               if (itemCheckins.length >= 2) {
                 const diff = itemCheckins[1].page - itemCheckins[0].page;
                 if (diff > 0) { variation = `Subiu ${diff}`; varColor = "text-green-600 font-bold"; }
                 else if (diff < 0) { variation = `Caiu ${Math.abs(diff)}`; varColor = "text-red-600 font-bold"; }
               }
               const isCritical = item.currentPage === 4 && (Date.now() - new Date(item.lastUpdatedAt).getTime() > 14 * 86400000);
               return (
                <tr key={item.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedItemId(item.id); setCurrentView('details'); }}>
                  <td className="px-6 py-4 text-center"><RankBadge page={item.currentPage} size="sm" /></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">{item.project}</span>
                      <span className="font-semibold text-slate-700">{item.keyword}</span>
                      {isCritical && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded w-fit mt-1">⚠️ CRÍTICO (+14d)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm truncate max-w-xs block" onClick={(e) => e.stopPropagation()}>{item.url}</a>
                  </td>
                  <td className="px-6 py-4"><span className={`text-sm ${varColor}`}>{variation}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600">Ver Detalhes →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button onClick={() => setCurrentView('export')} className="bg-slate-800 text-white p-4 rounded-full shadow-lg hover:bg-slate-700 transition-colors flex items-center justify-center w-14 h-14">📤</button>
        <button onClick={() => setCurrentView('form')} className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-colors flex items-center justify-center w-14 h-14"><span className="text-2xl">+</span></button>
      </div>
    </div>
  );

  const ItemForm = () => (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold mb-6">Novo Monitoramento</h2>
      <form onSubmit={handleAddItem} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Projeto</label>
          <input list="project-list" name="project" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Arte Clean" />
          <datalist id="project-list">{projects.map(p => <option key={p} value={p} />)}</datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Palavra-chave</label>
          <input name="keyword" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: limpeza de sofá" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL Alvo</label>
          <input name="url" type="url" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://meusite.com/pagina" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Página Atual</label>
            <select name="page" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="1">Página 1</option>
              <option value="2">Página 2</option>
              <option value="3">Página 3</option>
              <option value="4">Página 4+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
            <select name="priority" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
          <textarea name="notes" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-24"></textarea>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Salvar</button>
          <button type="button" onClick={() => setCurrentView('dashboard')} className="px-6 py-3 border border-slate-200 rounded-xl">Cancelar</button>
        </div>
      </form>
    </div>
  );

  const ItemDetails = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return null;
    const itemCheckins = checkins.filter(c => c.itemId === item.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartData = itemCheckins.map(c => ({ date: new Date(c.date).toLocaleDateString(), page: c.page }));

    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        <button onClick={() => setCurrentView('dashboard')} className="text-indigo-600 font-medium mb-4">← Voltar</button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border-b border-slate-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{item.keyword}</h1>
              <p className="text-indigo-600 text-sm">{item.url}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700 uppercase">{item.project}</span>
                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-600 uppercase">PRIORIDADE: {item.priority}</span>
              </div>
            </div>
            <RankBadge page={item.currentPage} size="lg" />
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold">📈 Evolução</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis reversed domain={[1, 4]} ticks={[1, 2, 3, 4]} fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="page" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="pt-4 p-6 bg-indigo-50 rounded-xl">
                <h3 className="font-bold mb-3">Novo Check-in</h3>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map(p => (
                    <button key={p} onClick={() => handleNewCheckIn(item.id, p as PageRank)} className={`px-4 py-2 rounded-lg font-bold text-white shadow-sm`} style={{ backgroundColor: (COLORS as any)[`P${p}`] }}>
                      Pág {p === 4 ? '4+' : p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold mb-4">✅ Checklist SEO</h3>
                <div className="space-y-3">
                  {item.checklist.map(action => (
                    <label key={action.id} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={action.completed} onChange={() => toggleChecklist(item.id, action.id)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                      <span className={`text-sm ${action.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{action.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={() => handleDeleteItem(item.id)} className="w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl border border-red-100">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between" onClick={() => setCurrentView('dashboard')}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
            <h1 className="text-xl font-bold text-slate-900">Rank Tracker</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'form' && <ItemForm />}
        {currentView === 'details' && <ItemDetails />}
        {currentView === 'export' && <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-2xl font-bold">Exportar Dados</h2>
          <button onClick={exportCSV} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl">Baixar CSV</button>
          <button onClick={() => setCurrentView('dashboard')} className="w-full py-3 border border-slate-200 rounded-xl">Voltar</button>
        </div>}
      </main>
    </div>
  );
}
