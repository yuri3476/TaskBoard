const { useState, useEffect, useRef } = React;

const dndIsReady = !!window.ReactBeautifulDnd;
const { DragDropContext, Droppable, Draggable } = dndIsReady ? window.ReactBeautifulDnd : { DragDropContext: null, Droppable: null, Draggable: null };

const KANBAN_STATUSES = ['A Fazer', 'Pronto', 'Bloqueado'];

// --- COMPONENTES ---

// Componente de Tooltip separado para flutuar sobre a UI
const Tooltip = ({ content, position }) => {
  if (!content || !position) return null;

  // Estilo para posicionar o tooltip abaixo do card
  const style = {
    position: 'fixed',
    top: `${position.bottom + 8}px`, // 8px abaixo do card
    left: `${position.left + position.width / 2}px`, // Centralizado horizontalmente com o card
    transform: 'translateX(-50%)',
    zIndex: 100, // Garante que fique sobre todos os outros elementos
  };

  return (
    <div style={style} className="w-64 p-3 bg-white text-gray-800 rounded-md shadow-lg border border-gray-200 animate-fade-in-up">
      <p className="font-bold text-indigo-600 mb-1 border-b border-gray-200 pb-1">Descrição</p>
      <p className="break-words whitespace-pre-wrap text-sm">{content}</p>
    </div>
  );
};


const TaskCard = ({ task, onEditTask, index, onDeleteTask, onShowTooltip, onHideTooltip }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pronto': return 'border-l-green-500';
      case 'Bloqueado': return 'border-l-red-500';
      default: return 'border-l-blue-500';
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    const confirmDelete = confirm(`Tem certeza que deseja excluir a tarefa "${task.Tarefa}"?`);
    if (confirmDelete) {
      onDeleteTask(task.id);
    }
  };

  // Lida com a entrada do mouse para mostrar o tooltip
  const handleMouseEnter = (e) => {
    if (task.Descrição) {
      const rect = e.currentTarget.getBoundingClientRect();
      onShowTooltip(task.Descrição, rect);
    }
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => {
        // CORREÇÃO: O useEffect foi movido para dentro do escopo do Draggable,
        // onde 'snapshot' existe, resolvendo o erro que causava a tela branca.
        useEffect(() => {
            if (snapshot.isDragging) {
                onHideTooltip();
            }
        }, [snapshot.isDragging]);

        return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={onHideTooltip}
              className={`bg-white p-3 rounded shadow-md mb-3 border-l-4 ${getStatusColor(task.Status)} cursor-pointer hover:shadow-lg transition-shadow ${snapshot.isDragging ? 'ring-2 ring-indigo-500 scale-105' : ''}`}
              onClick={() => onEditTask(task)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 break-words mb-2 pr-2">{task.Tarefa}</h4>
                <button onClick={handleDeleteClick} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
        );
      }}
    </Draggable>
  );
};

const TaskModal = ({ isOpen, onClose, onSave, task }) => {
  const [currentTask, setCurrentTask] = useState({});
  
  useEffect(() => {
    setCurrentTask(task ? {...task} : { Tarefa: '', Descrição: '', Status: 'A Fazer' });
  }, [task, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!currentTask.Tarefa.trim()) {
      alert("O nome da tarefa é obrigatório.");
      return;
    }
    onSave(currentTask);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tarefa</label>
          <input name="Tarefa" value={currentTask.Tarefa || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Nome da tarefa" autoFocus />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="Status" value={currentTask.Status || 'A Fazer'} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                {KANBAN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea name="Descrição" value={currentTask.Descrição || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows="4" placeholder="Detalhes da tarefa..."></textarea>
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSave} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks, onEditTask, onDeleteTask, onShowTooltip, onHideTooltip }) => { 
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {KANBAN_STATUSES.map(status => (
                <Droppable key={status} droppableId={status}>
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className={`bg-gray-100 p-4 rounded-lg flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-100' : ''}`}>
                            <h3 className="font-bold text-lg mb-4 text-center text-gray-700 flex-shrink-0">{status}</h3>
                            <div className="space-y-3 min-h-[150px] max-h-[65vh] overflow-y-auto pr-2 flex-grow">
                                {tasks.filter(task => task.Status === status).map((task, index) => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        onEditTask={onEditTask} 
                                        onDeleteTask={onDeleteTask} 
                                        index={index}
                                        onShowTooltip={onShowTooltip}
                                        onHideTooltip={onHideTooltip}
                                    />
                                ))}
                                {provided.placeholder}
                                {tasks.filter(task => task.Status === status).length === 0 && !snapshot.isDraggingOver && (
                                    <div className="text-center text-sm text-gray-500 py-4 border-2 border-dashed rounded-md">Arraste tarefas para cá.</div>
                                )}
                            </div>
                        </div>
                    )}
                </Droppable>
            ))}
        </div>
    ); 
};


function App() {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzgMfX6ls0z5o4hM5ja-cHbggZRp7BqfnyxzpXy_qgePP7iqHg4X3fegwiWGTA5r1Ry/exec';
  const [tasks, setTasks] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [currentSheetName, setCurrentSheetName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isAddSheetModalOpen, setIsAddSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const saveTimeout = useRef(null);
  const [tooltip, setTooltip] = useState({ content: null, position: null });

  const handleShowTooltip = (content, rect) => {
    setTooltip({ content, position: rect });
  };

  const handleHideTooltip = () => {
    setTooltip({ content: null, position: null });
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`${APPS_SCRIPT_URL}?action=getSheetNames`)
      .then(res => res.json())
      .then(response => { if(response.status === 'success') { setSheetNames(response.data); if (response.data.length > 0) { setCurrentSheetName(response.data[0]); } else { setIsLoading(false); } } else { throw new Error(response.message || "Erro na API."); } })
      .catch(err => { setError("Falha ao carregar projetos: " + err.message); setIsLoading(false); });
  }, []);

  useEffect(() => {
    if (!currentSheetName) return;
    if (saveTimeout.current) { clearTimeout(saveTimeout.current); setIsSaving(false); }
    setIsLoading(true);
    fetch(`${APPS_SCRIPT_URL}?action=getTasks&sheetName=${encodeURIComponent(currentSheetName)}`)
      .then(res => res.json())
      .then(response => { if(response.status === 'success') { setTasks(response.data); } else { throw new Error(response.message || "Erro na API."); } setIsLoading(false); })
      .catch(err => { setError(`Falha ao carregar tarefas: ` + err.message); setIsLoading(false); });
  }, [currentSheetName]);
  
  const triggerSave = (tasksToSave, sheetNameToSave) => {
    if (saveTimeout.current) { clearTimeout(saveTimeout.current); }
    setIsSaving(true);
    saveTimeout.current = setTimeout(() => {
      const dataToPost = { action: 'saveTasks', sheetName: sheetNameToSave, payload: tasksToSave };
      fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dataToPost) })
      .then(res => res.json())
      .then(data => { if(data.status !== 'success'){ throw new Error(data.message || "Erro ao salvar."); } })
      .catch(err => { setError("Falha ao salvar: " + err.message); })
      .finally(() => { setIsSaving(false); });
    }, 1500);
  };

  const updateTasksAndTriggerSave = (newTasks) => {
    setTasks(newTasks);
    triggerSave(newTasks, currentSheetName);
  };
  
  const handleSaveTask = (taskToSave) => {
    let newTasks;
    if (taskToSave.id) {
      newTasks = tasks.map(t => t.id === taskToSave.id ? taskToSave : t);
    } else {
      const newTask = { 
        ...taskToSave, 
        id: `task-${Date.now()}`,
        Descrição: taskToSave.Descrição || '',
        Status: taskToSave.Status || 'A Fazer'
      };
      newTasks = [...tasks, newTask];
    }
    updateTasksAndTriggerSave(newTasks);
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskIdToDelete) => {
    const newTasks = tasks.filter(task => task.id !== taskIdToDelete);
    updateTasksAndTriggerSave(newTasks);
  };

  const handleDragEnd = (result) => {
    handleHideTooltip();
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const newTasks = tasks.map(t => t.id.toString() === draggableId.toString() ? { ...t, Status: destination.droppableId } : t);
    updateTasksAndTriggerSave(newTasks);
  };
  
  const handleOpenNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleCreateNewSheet = () => {
    const trimmedSheetName = newSheetName.trim();
    if (!trimmedSheetName) { alert("O nome do projeto não pode estar em branco."); return; }
    if (sheetNames.some(name => name.toLowerCase() === trimmedSheetName.toLowerCase())) { alert(`O projeto "${trimmedSheetName}" já existe.`); return; }
    const dataToPost = { action: 'createSheet', sheetName: trimmedSheetName };
    fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dataToPost) })
    .then(res => res.json())
    .then(response => { if(response.status === 'success') { setSheetNames([...sheetNames, trimmedSheetName]); setCurrentSheetName(trimmedSheetName); setIsAddSheetModalOpen(false); setNewSheetName(''); } else { alert("Erro do servidor: " + (response.message || "Erro desconhecido.")); } })
    .catch(err => alert("Erro de comunicação ao criar projeto."));
  };
  
  const renderContent = () => {
    if (isLoading && sheetNames.length === 0) { return <div className="text-center text-gray-500">Carregando seus projetos...</div>; }
    if (!currentSheetName) { return (<div className="text-center bg-white p-10 rounded-lg shadow-md"><h2 className="text-xl font-semibold text-gray-700">Nenhum projeto encontrado.</h2><p className="text-gray-500 my-4">Crie seu primeiro projeto para começar.</p><button onClick={() => setIsAddSheetModalOpen(true)} className="w-full max-w-xs mx-auto bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">Criar Novo Projeto</button></div>); }
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div>
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <label htmlFor="sheet-selector" className="block text-sm font-medium text-gray-700">Projeto Atual</label>
                <div className="flex gap-2 items-center mt-1">
                  <select id="sheet-selector" value={currentSheetName} onChange={(e) => setCurrentSheetName(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md">
                    {sheetNames.map(name => (<option key={name} value={name}>{name}</option>))}
                  </select>
                  <button onClick={() => setIsAddSheetModalOpen(true)} className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600" title="Adicionar Novo Projeto">+</button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                  {isSaving && <span className="text-sm text-gray-500 animate-pulse">Salvando...</span>}
                  <button onClick={handleOpenNewTaskModal} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">+ Adicionar Tarefa</button>
              </div>
            </div>
          </div>
          {isLoading ? <div className="text-center">Carregando tarefas...</div> : <KanbanBoard tasks={tasks} onEditTask={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }} onDeleteTask={handleDeleteTask} onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />}
        </div>
      </DragDropContext>
    );
  };

  return (
    <>
      <Tooltip content={tooltip.content} position={tooltip.position} />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <div className="w-full">
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
              <header className="mb-8 text-center"><h1 className="text-4xl font-bold text-gray-800">Task<span className="text-indigo-600">Board</span> </h1><p className="text-gray-500 mt-1">Conectado diretamente à sua Planilha Google.</p></header>
              <TaskModal isOpen={isTaskModalOpen} onClose={() => { setEditingTask(null); setIsTaskModalOpen(false); }} onSave={handleSaveTask} task={editingTask} />
              {isAddSheetModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={() => setIsAddSheetModalOpen(false)}><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}><h2 className="text-xl font-bold text-gray-800">Criar Novo Projeto</h2><input type="text" value={newSheetName} onChange={(e) => setNewSheetName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Ex: Lançamento do Produto X"/><div className="flex justify-end gap-4 pt-4 border-t"><button onClick={() => setIsAddSheetModalOpen(false)} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Cancelar</button><button onClick={handleCreateNewSheet} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">Criar Projeto</button></div></div></div>)}
              {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert" onClick={() => setError('')}><p className="cursor-pointer">{error} (clique para fechar)</p></div>}
              {renderContent()}
            </main>
        </div>
        <footer className="text-center py-6 border-t border-gray-200 bg-gray-50 w-full"><p className="text-sm text-gray-500">© {new Date().getFullYear()} TaskBoard. Criado por Yuri Rezende.</p></footer>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
