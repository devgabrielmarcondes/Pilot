"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  CircleDollarSign,
  KanbanSquare,
  List,
  MessageSquare,
  BarChart3,
  Plus,
  Send,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  X,
  MoreVertical,
  Info,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DEFAULT_COLUMNS, defaultBudget, defaultMetrics } from "@/lib/campaign-store";
import { BudgetAllocationSchema } from "@/lib/schemas";
import type {
  BudgetAllocation,
  CampaignAssetPlaceholder,
  CampaignContentItem,
  CampaignProject,
  CampaignRun,
  CampaignTask,
  CampaignViewMode,
  MarketingMetric,
  AssistantMessage,
} from "@/lib/schemas";

const viewTabs: { id: CampaignViewMode; label: string; icon: typeof KanbanSquare }[] = [
  { id: "board", label: "Board", icon: KanbanSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "list", label: "List", icon: List },
  { id: "budget", label: "Budget", icon: CircleDollarSign },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
  { id: "assistant", label: "Assistant", icon: MessageSquare },
];

const assistantSuggestions = [
  "Improve this calendar",
  "Reduce CAC",
  "Find budget risks",
  "Rewrite for TikTok",
];

const budgetExplanations: Record<string, string> = {
  "Creator fees": "Budget allocated for paying content creators, influencers, and brand ambassadors for their work.",
  "Paid boost": "Budget for paid amplification of content through social media ads and sponsored posts.",
  "Production": "Budget for content production costs including filming, editing, graphics, and creative assets.",
  "Tools": "Budget for software tools, analytics platforms, and campaign management services.",
  "Contingency": "Reserve budget for unexpected costs, creator replacements, or opportunistic spending.",
};

const metricExplanations: Record<string, string> = {
  "spend": "Total amount spent on the campaign so far across all channels and activities.",
  "projected_leads": "Estimated number of potential customers who have shown interest or engaged with campaign content.",
  "cpl": "Cost Per Lead - calculated as total spend divided by projected leads. Lower is better.",
  "projected_customers": "Estimated number of leads that will convert into paying customers.",
  "cac": "Customer Acquisition Cost - calculated as total spend divided by projected customers. Lower is better.",
  "ctr": "Click-Through Rate - percentage of people who clicked on your content after seeing it.",
  "cvr": "Conversion Rate - percentage of leads that converted into customers.",
  "cpm": "Cost Per Mille - cost per 1,000 impressions. Calculated from spend and CTR.",
  "cpc": "Cost Per Click - average cost for each click on your content. Calculated from spend and CTR.",
  "roas": "Return on Ad Spend - revenue generated per dollar spent. Higher is better.",
  "creator_cost_per_post": "Average cost paid to creators for each piece of content they produce.",
  "budget_remaining": "Remaining budget available for allocation. Calculated as total budget minus allocated amounts.",
};

export function CampaignCommandCenter({
  project,
  run,
  viewMode,
  onViewModeChange,
  tasks,
  onTasksChange,
  contentItems,
  onContentItemsChange,
  budget,
  onBudgetChange,
  metrics,
  onMetricsChange,
  assets,
  onAssetsChange,
  assistantMessages,
  onAssistantMessagesChange,
  customColumns,
  onCustomColumnsChange,
}: {
  project: CampaignProject;
  run: CampaignRun | null;
  viewMode: CampaignViewMode;
  onViewModeChange: (mode: CampaignViewMode) => void;
  tasks: CampaignTask[];
  onTasksChange: (tasks: CampaignTask[]) => void;
  contentItems: CampaignContentItem[];
  onContentItemsChange: (items: CampaignContentItem[]) => void;
  budget: BudgetAllocation[];
  onBudgetChange: (budget: BudgetAllocation[]) => void;
  metrics: MarketingMetric[];
  onMetricsChange: (metrics: MarketingMetric[]) => void;
  assets: CampaignAssetPlaceholder[];
  onAssetsChange: (assets: CampaignAssetPlaceholder[]) => void;
  assistantMessages: AssistantMessage[];
  onAssistantMessagesChange: (msgs: AssistantMessage[]) => void;
  customColumns: string[];
  onCustomColumnsChange: (cols: string[]) => void;
}) {
  const hasData = run?.report != null;

  return (
    <div>
      <div className="main-header">
        <div>
          <h1 className="main-title">Command Center</h1>
          <div className="main-subtitle">{project.name}</div>
        </div>
      </div>

      <div className="command-center-tabs">
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={`command-center-tab ${viewMode === tab.id ? "active" : ""}`}
              key={tab.id}
              type="button"
              onClick={() => onViewModeChange(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {viewMode === "board" && (
        <BoardView
          tasks={tasks}
          onTasksChange={onTasksChange}
          columns={customColumns.length > 0 ? customColumns : DEFAULT_COLUMNS}
          onColumnsChange={onCustomColumnsChange}
          hasData={hasData}
        />
      )}
      {viewMode === "calendar" && (
        <CalendarView
          contentItems={contentItems}
          onContentItemsChange={onContentItemsChange}
          hasData={hasData}
        />
      )}
      {viewMode === "list" && (
        <ListView
          tasks={tasks}
          onTasksChange={onTasksChange}
          contentItems={contentItems}
          onContentItemsChange={onContentItemsChange}
          hasData={hasData}
        />
      )}
      {viewMode === "budget" && (
        <BudgetView budget={budget} onBudgetChange={onBudgetChange} hasData={hasData} />
      )}
      {viewMode === "metrics" && (
        <MetricsView metrics={metrics} onMetricsChange={onMetricsChange} hasData={hasData} />
      )}
      {viewMode === "assistant" && (
        <AssistantView
          project={project}
          messages={assistantMessages}
          onMessagesChange={onAssistantMessagesChange}
          hasData={hasData}
        />
      )}
    </div>
  );
}

/* ─── Task Edit Modal ─── */
function TaskEditModal({
  task,
  columns,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  task: CampaignTask | null;
  columns: string[];
  open: boolean;
  onClose: () => void;
  onSave: (task: CampaignTask) => void;
  onDelete: (id: string) => void;
}) {
  const [edit, setEdit] = useState<CampaignTask | null>(null);

  useMemo(() => {
    if (task) setEdit({ ...task });
  }, [task]);

  if (!edit) return null;

  function handleSave() {
    if (edit) onSave(edit);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Task" width={520}>
      <div className="space-y-4">
        <label className="form-group">
          <span className="form-label">Title</span>
          <input className="form-input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
        </label>
        <label className="form-group">
          <span className="form-label">Description</span>
          <textarea className="form-textarea" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="form-group">
            <span className="form-label">Channel</span>
            <select className="form-select" value={edit.channel} onChange={(e) => setEdit({ ...edit, channel: e.target.value })}>
              <option value="">None</option>
              {["TikTok", "Instagram", "YouTube Shorts", "Twitch", "LinkedIn", "Retail Media"].map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Owner</span>
            <input className="form-input" value={edit.owner} onChange={(e) => setEdit({ ...edit, owner: e.target.value })} placeholder="Assign to..." />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="form-group">
            <span className="form-label">Status</span>
            <select className="form-select" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              {columns.map((col) => (
                <option key={col} value={col}>{col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Risk</span>
            <select className="form-select" value={edit.approvalRisk} onChange={(e) => setEdit({ ...edit, approvalRisk: e.target.value as CampaignTask["approvalRisk"] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <label className="form-group">
          <span className="form-label">Budget</span>
          <input className="form-input" type="number" min={0} step={100} value={edit.budget} onChange={(e) => setEdit({ ...edit, budget: Number(e.target.value) })} />
        </label>
        <div className="flex justify-between pt-4 border-t border-black/12">
          <Button variant="danger" size="sm" type="button" onClick={() => { onDelete(edit.id); onClose(); }}>
            <Trash2 size={12} /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Sortable Kanban Card ─── */
function SortableCard({ task, onClick }: { task: CampaignTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-title">{task.title}</div>
      {task.description && <div className="text-xs text-black/45 mb-1 line-clamp-2">{task.description}</div>}
      <div className="kanban-card-meta">
        {task.channel && <span>{task.channel}</span>}
        {task.owner && <span>{task.owner}</span>}
        {task.budget > 0 && <span>${task.budget}</span>}
      </div>
      <div className="kanban-card-actions">
        <Badge variant={task.approvalRisk === "high" ? "danger" : task.approvalRisk === "medium" ? "warning" : "success"}>
          {task.approvalRisk}
        </Badge>
      </div>
    </div>
  );
}

/* ─── Board View ─── */
function BoardView({
  tasks,
  onTasksChange,
  columns,
  onColumnsChange,
  hasData,
}: {
  tasks: CampaignTask[];
  onTasksChange: (tasks: CampaignTask[]) => void;
  columns: string[];
  onColumnsChange: (cols: string[]) => void;
  hasData: boolean;
}) {
  const [newColName, setNewColName] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const [editColName, setEditColName] = useState("");
  const [editingTask, setEditingTask] = useState<CampaignTask | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTask.status !== overTask.status) {
      onTasksChange(tasks.map((t) => t.id === active.id ? { ...t, status: overTask.status } : t));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    if (activeTask.status === overTask.status) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      onTasksChange(arrayMove(tasks, oldIndex, newIndex));
    }
  }

  function addColumn() {
    if (!newColName.trim()) return;
    onColumnsChange([...columns, newColName.trim().toLowerCase().replace(/\s+/g, "_")]);
    setNewColName("");
    setShowAddCol(false);
  }

  function removeColumn(col: string) {
    onColumnsChange(columns.filter((c) => c !== col));
    onTasksChange(tasks.filter((t) => t.status !== col));
  }

  function saveColEdit(index: number) {
    if (!editColName.trim()) return;
    const oldCol = columns[index];
    const newCol = editColName.trim().toLowerCase().replace(/\s+/g, "_");
    if (oldCol === newCol) { setEditingCol(null); return; }
    onColumnsChange(columns.map((c, i) => i === index ? newCol : c));
    onTasksChange(tasks.map((t) => t.status === oldCol ? { ...t, status: newCol } : t));
    setEditingCol(null);
  }

  function saveTask(updated: CampaignTask) {
    onTasksChange(tasks.map((t) => t.id === updated.id ? updated : t));
  }

  function deleteTask(id: string) {
    onTasksChange(tasks.filter((t) => t.id !== id));
  }

  function addTaskToColumn(col: string) {
    const newTask: CampaignTask = {
      id: crypto.randomUUID(),
      title: "New task",
      description: "",
      channel: "",
      owner: "",
      budget: 0,
      status: col,
      approvalRisk: "low",
      type: "task",
    };
    onTasksChange([...tasks, newTask]);
    setEditingTask(newTask);
  }

  function formatColumnName(col: string) {
    return col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div>
      <TaskEditModal
        task={editingTask}
        columns={columns}
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={saveTask}
        onDelete={deleteTask}
      />

      <div className="kanban-scroll">
        <div className="kanban-board-horizontal">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col);
            return (
              <div className="kanban-column-fixed" key={col}>
                <div className="kanban-column-header">
                  {editingCol === columns.indexOf(col) ? (
                    <div className="flex gap-1 flex-1">
                      <input
                        className="form-input text-xs"
                        value={editColName}
                        onChange={(e) => setEditColName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveColEdit(columns.indexOf(col)); if (e.key === "Escape") setEditingCol(null); }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className="kanban-column-title cursor-pointer flex-1"
                      onDoubleClick={() => { setEditingCol(columns.indexOf(col)); setEditColName(col); }}
                    >
                      {formatColumnName(col)}
                    </span>
                  )}
                  <span className="kanban-column-count">{columnTasks.length}</span>
                  {columns.length > 1 && (
                    <button type="button" onClick={() => removeColumn(col)} className="text-black/20 hover:text-[var(--danger)]">
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="kanban-column-body">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {columnTasks.map((task) => (
                        <SortableCard key={task.id} task={task} onClick={() => setEditingTask(task)} />
                      ))}
                    </SortableContext>
                    <DragOverlay>
                      {activeTask ? (
                        <div className="kanban-card kanban-card-dragging">
                          <div className="kanban-card-title">{activeTask.title}</div>
                          <div className="kanban-card-meta">
                            {activeTask.channel && <span>{activeTask.channel}</span>}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                  {columnTasks.length === 0 && (
                    <div className="text-center text-xs text-black/30 py-4">Empty</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addTaskToColumn(col)}
                  className="kanban-add-btn"
                >
                  <Plus size={12} /> Add task
                </button>
              </div>
            );
          })}

          {showAddCol ? (
            <div className="kanban-column-fixed kanban-column-add">
              <div className="flex gap-1 p-3">
                <input
                  className="form-input text-xs"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addColumn(); if (e.key === "Escape") setShowAddCol(false); }}
                  placeholder="Column name"
                  autoFocus
                />
                <button type="button" onClick={addColumn} className="text-[var(--success)]"><Plus size={14} /></button>
                <button type="button" onClick={() => setShowAddCol(false)}><X size={14} /></button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCol(true)}
              className="kanban-add-column-btn"
            >
              <Plus size={16} /> Add column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Calendar Event Modal ─── */
function CalendarEventModal({
  item,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  item: CampaignContentItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: CampaignContentItem) => void;
  onDelete: (id: string) => void;
}) {
  const [edit, setEdit] = useState<CampaignContentItem | null>(null);

  useMemo(() => {
    if (item) setEdit({ ...item });
  }, [item]);

  if (!edit) return null;

  function handleSave() {
    if (edit) onSave(edit);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Event" width={480}>
      <div className="space-y-4">
        <label className="form-group">
          <span className="form-label">Title</span>
          <input className="form-input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
        </label>
        <label className="form-group">
          <span className="form-label">Description</span>
          <textarea className="form-textarea" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="form-group">
            <span className="form-label">Channel</span>
            <select className="form-select" value={edit.channel} onChange={(e) => setEdit({ ...edit, channel: e.target.value as CampaignContentItem["channel"] })}>
              {["TikTok", "Instagram", "YouTube Shorts", "Twitch", "LinkedIn", "Retail Media"].map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Format</span>
            <input className="form-input" value={edit.format} onChange={(e) => setEdit({ ...edit, format: e.target.value })} placeholder="Video, Carousel, Story..." />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="form-group">
            <span className="form-label">Status</span>
            <select className="form-select" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as CampaignContentItem["status"] })}>
              {["draft", "review", "approved", "published"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Date</span>
            <input className="form-input" type="date" value={edit.scheduledDate} onChange={(e) => setEdit({ ...edit, scheduledDate: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-between pt-4 border-t border-black/12">
          <Button variant="danger" size="sm" type="button" onClick={() => { onDelete(edit.id); onClose(); }}>
            <Trash2 size={12} /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Calendar View (Monthly) ─── */
function CalendarView({
  contentItems,
  onContentItemsChange,
  hasData,
}: {
  contentItems: CampaignContentItem[];
  onContentItemsChange: (items: CampaignContentItem[]) => void;
  hasData: boolean;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingItem, setEditingItem] = useState<CampaignContentItem | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [startDayOfWeek, daysInMonth]);

  function getItemsForDay(day: number): CampaignContentItem[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return contentItems.filter((item) => item.scheduledDate === dateStr || item.day === day);
  }

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  function addEventToDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const newItem: CampaignContentItem = {
      id: crypto.randomUUID(),
      title: "New event",
      description: "",
      channel: "TikTok",
      format: "",
      scheduledDate: dateStr,
      status: "draft",
      day,
    };
    onContentItemsChange([...contentItems, newItem]);
    setEditingItem(newItem);
  }

  function saveEvent(updated: CampaignContentItem) {
    onContentItemsChange(contentItems.map((item) => item.id === updated.id ? updated : item));
  }

  function deleteEvent(id: string) {
    onContentItemsChange(contentItems.filter((item) => item.id !== id));
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="cal-full-height">
      <CalendarEventModal
        item={editingItem}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={prevMonth}><ChevronLeft size={14} /></Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="secondary" size="sm" type="button" onClick={nextMonth}><ChevronRight size={14} /></Button>
        </div>
      </div>

      <div className="cal-month-grid cal-month-full">
        {dayNames.map((d) => (
          <div className="cal-month-header" key={d}>{d}</div>
        ))}
        {days.map((day, i) => {
          const dayItems = day ? getItemsForDay(day) : [];
          return (
            <div className={`cal-month-cell ${day ? "" : "cal-month-cell-empty"}`} key={i}>
              {day && (
                <>
                  <div className="cal-month-day-num">{day}</div>
                  <div className="cal-month-events">
                    {dayItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="cal-event" onClick={() => setEditingItem(item)}>
                        <div className="cal-event-channel">{item.channel}</div>
                        <div className="cal-event-dots">
                          <MoreVertical size={10} />
                        </div>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="cal-event-more" onClick={() => dayItems[3] && setEditingItem(dayItems[3])}>
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => addEventToDay(day)} className="cal-month-add">
                    <Plus size={10} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── List Item Modal ─── */
function ListItemModal({
  item,
  columns,
  open,
  onClose,
  onSaveTask,
  onSaveContent,
  onDelete,
}: {
  item: { id: string; title: string; type: string; channel: string; status: string; kind: "task" | "content"; description: string } | null;
  columns: string[];
  open: boolean;
  onClose: () => void;
  onSaveTask: (task: CampaignTask) => void;
  onSaveContent: (item: CampaignContentItem) => void;
  onDelete: (id: string, kind: "task" | "content") => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");

  useMemo(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setChannel(item.channel);
      setStatus(item.status);
    }
  }, [item]);

  if (!item) return null;

  function handleSave() {
    if (!item) return;
    if (item.kind === "task") {
      onSaveTask({ id: item.id, title, description, channel, owner: "", budget: 0, status, approvalRisk: "low", type: item.type });
    } else {
      onSaveContent({ id: item.id, title, description, channel: channel as CampaignContentItem["channel"], format: "", scheduledDate: "", status: status as CampaignContentItem["status"], day: 1 });
    }
    onClose();
  }

  const statusOptions = item.kind === "task" ? columns : ["draft", "review", "approved", "published"];

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${item.type}`} width={480}>
      <div className="space-y-4">
        <label className="form-group">
          <span className="form-label">Title</span>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="form-group">
          <span className="form-label">Description</span>
          <textarea className="form-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="form-group">
            <span className="form-label">Channel</span>
            <select className="form-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">None</option>
              {["TikTok", "Instagram", "YouTube Shorts", "Twitch", "LinkedIn", "Retail Media"].map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Status</span>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-between pt-4 border-t border-black/12">
          <Button variant="danger" size="sm" type="button" onClick={() => { onDelete(item.id, item.kind); onClose(); }}>
            <Trash2 size={12} /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── List View ─── */
function ListView({
  tasks,
  onTasksChange,
  contentItems,
  onContentItemsChange,
  hasData,
}: {
  tasks: CampaignTask[];
  onTasksChange: (tasks: CampaignTask[]) => void;
  contentItems: CampaignContentItem[];
  onContentItemsChange: (items: CampaignContentItem[]) => void;
  hasData: boolean;
}) {
  const [editingItem, setEditingItem] = useState<{ id: string; title: string; type: string; channel: string; status: string; kind: "task" | "content"; description: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allItems = useMemo(() => [
    ...tasks.map((t) => ({ id: t.id, title: t.title, type: "Task", channel: t.channel, status: t.status, kind: "task" as const, description: t.description })),
    ...contentItems.map((c) => ({ id: c.id, title: c.title, type: "Content", channel: c.channel, status: c.status, kind: "content" as const, description: c.description })),
  ], [tasks, contentItems]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = allItems.findIndex((i) => i.id === active.id);
    const newIndex = allItems.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(allItems, oldIndex, newIndex);
    const newTasks = reordered.filter((i) => i.kind === "task").map((i) => {
      const orig = tasks.find((t) => t.id === i.id);
      return orig ? { ...orig, title: i.title, channel: i.channel, status: i.status } : orig!;
    });
    const newContent = reordered.filter((i) => i.kind === "content").map((i) => {
      const orig = contentItems.find((c) => c.id === i.id);
      return orig ? { ...orig, title: i.title, channel: orig.channel, status: orig.status } : orig!;
    });
    onTasksChange(newTasks);
    onContentItemsChange(newContent);
  }

  function handleSaveTask(task: CampaignTask) {
    onTasksChange(tasks.map((t) => t.id === task.id ? task : t));
  }

  function handleSaveContent(item: CampaignContentItem) {
    onContentItemsChange(contentItems.map((c) => c.id === item.id ? item : c));
  }

  function handleDelete(id: string, kind: "task" | "content") {
    if (kind === "task") {
      onTasksChange(tasks.filter((t) => t.id !== id));
    } else {
      onContentItemsChange(contentItems.filter((c) => c.id !== id));
    }
  }

  function formatStatus(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div>
      <ListItemModal
        item={editingItem}
        columns={DEFAULT_COLUMNS}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSaveTask={handleSaveTask}
        onSaveContent={handleSaveContent}
        onDelete={handleDelete}
      />

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th style={{ width: 24 }}></th>
              <th>Title</th>
              <th>Type</th>
              <th>Channel</th>
              <th>Status</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={allItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {allItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-black/40 py-8">
                      {hasData ? "No items to display" : "Run and approve the agent to populate the list."}
                    </td>
                  </tr>
                ) : (
                  allItems.map((item) => (
                    <SortableRow key={item.id} item={item} onClick={() => setEditingItem(item)} />
                  ))
                )}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>
    </div>
  );
}

function SortableRow({ item, onClick }: {
  item: { id: string; title: string; type: string; channel: string; status: string; kind: "task" | "content" };
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  function formatStatus(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <tr ref={setNodeRef} style={style} className="cursor-pointer hover:bg-black/2" onClick={onClick}>
      <td>
        <button type="button" className="drag-handle" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
        </button>
      </td>
      <td className="font-medium">{item.title}</td>
      <td><Badge>{item.type}</Badge></td>
      <td className="mono text-xs">{item.channel || "-"}</td>
      <td><Badge variant="info">{formatStatus(item.status)}</Badge></td>
    </tr>
  );
}

/* ─── Budget View ─── */
function BudgetView({
  budget,
  onBudgetChange,
  hasData,
}: {
  budget: BudgetAllocation[];
  onBudgetChange: (budget: BudgetAllocation[]) => void;
  hasData: boolean;
}) {
  const [newBucketName, setNewBucketName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null);
  const total = budget.reduce((sum, b) => sum + b.amount, 0);

  function updateAmount(id: string, amount: number) {
    onBudgetChange(
      budget.map((b) =>
        b.id === id
          ? { ...b, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : b.percentage }
          : b
      )
    );
  }

  function addBucket() {
    if (!newBucketName.trim()) return;
    onBudgetChange([
      ...budget,
      BudgetAllocationSchema.parse({ id: crypto.randomUUID(), bucket: newBucketName.trim(), amount: 0, percentage: 0 }),
    ]);
    setNewBucketName("");
    setShowAdd(false);
  }

  function deleteBucket(id: string) {
    onBudgetChange(budget.filter((b) => b.id !== id));
  }

  function resetBudget() {
    onBudgetChange(defaultBudget());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-mono text-black/40 uppercase tracking-wider">Total allocated</div>
          <div className="text-2xl font-display font-semibold">${total.toLocaleString()}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={resetBudget}>
            <RotateCcw size={12} /> Reset
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => setShowAdd(true)}>
            <Plus size={12} /> Add bucket
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4">
          <input
            className="form-input"
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addBucket(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="Bucket name"
            autoFocus
          />
          <Button size="sm" type="button" onClick={addBucket}><Plus size={12} /></Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => setShowAdd(false)}><X size={12} /></Button>
        </div>
      )}

      <div className="budget-grid">
        {budget.map((allocation) => (
          <div
            className="bucket-card"
            key={allocation.id}
            onMouseEnter={() => setHoveredBucket(allocation.bucket)}
            onMouseLeave={() => setHoveredBucket(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="bucket-name">{allocation.bucket}</div>
                {budgetExplanations[allocation.bucket] && (
                  <div className="relative">
                    <Info size={12} className="text-black/30 cursor-help" />
                    {hoveredBucket === allocation.bucket && (
                      <div className="eval-tooltip" style={{ top: "100%", left: 0, marginTop: 4 }}>
                        {budgetExplanations[allocation.bucket]}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => deleteBucket(allocation.id)} className="text-black/20 hover:text-[var(--danger)]">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="bucket-amount">${allocation.amount.toLocaleString()}</div>
            <div className="bucket-percentage">{allocation.percentage}% of total</div>
            <input
              className="bucket-input"
              type="number"
              min={0}
              step={500}
              value={allocation.amount}
              onChange={(e) => updateAmount(allocation.id, Number(e.target.value))}
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Metrics View ─── */
function MetricsView({
  metrics,
  onMetricsChange,
  hasData,
}: {
  metrics: MarketingMetric[];
  onMetricsChange: (metrics: MarketingMetric[]) => void;
  hasData: boolean;
}) {
  const [newMetricLabel, setNewMetricLabel] = useState("");
  const [newMetricUnit, setNewMetricUnit] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  function updateMetric(key: string, value: number) {
    onMetricsChange(
      metrics.map((m) => (m.key === key ? { ...m, value } : m))
    );
  }

  function addMetric() {
    if (!newMetricLabel.trim()) return;
    const key = newMetricLabel.trim().toLowerCase().replace(/\s+/g, "_");
    onMetricsChange([
      ...metrics,
      { key, label: newMetricLabel.trim(), value: 0, unit: newMetricUnit.trim(), editable: true },
    ]);
    setNewMetricLabel("");
    setNewMetricUnit("");
    setShowAdd(false);
  }

  function deleteMetric(key: string) {
    onMetricsChange(metrics.filter((m) => m.key !== key));
  }

  function resetMetrics() {
    onMetricsChange(defaultMetrics());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs font-mono text-black/40 uppercase tracking-wider">Campaign Metrics</div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={resetMetrics}>
            <RotateCcw size={12} /> Reset
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => setShowAdd(true)}>
            <Plus size={12} /> Add metric
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4">
          <input
            className="form-input"
            value={newMetricLabel}
            onChange={(e) => setNewMetricLabel(e.target.value)}
            placeholder="Metric name"
            autoFocus
          />
          <input
            className="form-input"
            value={newMetricUnit}
            onChange={(e) => setNewMetricUnit(e.target.value)}
            placeholder="Unit ($, %, x)"
            style={{ maxWidth: 80 }}
          />
          <Button size="sm" type="button" onClick={addMetric}><Plus size={12} /></Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => setShowAdd(false)}><X size={12} /></Button>
        </div>
      )}

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div
            className="metric-card"
            key={metric.key}
            onMouseEnter={() => setHoveredMetric(metric.key)}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="metric-label">{metric.label}</div>
                {metricExplanations[metric.key] && (
                  <div className="relative">
                    <Info size={12} className="text-black/30 cursor-help" />
                    {hoveredMetric === metric.key && (
                      <div className="eval-tooltip" style={{ top: "100%", left: 0, marginTop: 4 }}>
                        {metricExplanations[metric.key]}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {metric.editable && (
                <button type="button" onClick={() => deleteMetric(metric.key)} className="text-black/20 hover:text-[var(--danger)]">
                  <Trash2 size={10} />
                </button>
              )}
            </div>
            {metric.editable ? (
              <input
                className="metric-input"
                type="number"
                min={0}
                step={metric.unit === "%" ? 0.1 : metric.unit === "x" ? 0.1 : 1}
                value={metric.value}
                onChange={(e) => updateMetric(metric.key, Number(e.target.value))}
              />
            ) : (
              <div className="metric-value">
                {metric.value > 0 ? metric.value.toLocaleString() : "--"}
                {metric.value > 0 && <span className="metric-unit"> {metric.unit}</span>}
              </div>
            )}
            {metric.editable && (
              <div className="text-xs text-black/40 mt-1">{metric.unit}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Assistant View ─── */
function AssistantView({
  project,
  messages,
  onMessagesChange,
  hasData,
}: {
  project: CampaignProject;
  messages: AssistantMessage[];
  onMessagesChange: (msgs: AssistantMessage[]) => void;
  hasData: boolean;
}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    onMessagesChange([...messages, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/campaign/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          campaignId: project.id,
          brief: project.brief,
        }),
      });
      const data = await response.json();

      const assistantMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "I could not generate a response. Please try again.",
        createdAt: new Date().toISOString(),
      };

      onMessagesChange([...messages, userMsg, assistantMsg]);
    } catch {
      const fallbackMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Unable to reach the assistant. Please try again.",
        createdAt: new Date().toISOString(),
      };
      onMessagesChange([...messages, userMsg, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="assistant-layout">
      <div className="assistant-messages">
        {messages.length === 0 && (
          <div className="text-center text-sm text-black/40 py-12">
            Ask anything about this campaign. The assistant uses the campaign brief and output as context.
          </div>
        )}
        {messages.map((msg) => (
          <div className={`assistant-message ${msg.role}`} key={msg.id}>
            <div className={`assistant-avatar ${msg.role === "user" ? "user-avatar" : "bot-avatar"}`}>
              {msg.role === "user" ? "G" : "P"}
            </div>
            <div className="assistant-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="assistant-message assistant">
            <div className="assistant-avatar bot-avatar">P</div>
            <div className="assistant-content text-black/40">Thinking...</div>
          </div>
        )}
      </div>

      <div className="assistant-input-area">
        <div className="flex gap-2">
          <input
            className="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about this campaign..."
            disabled={!hasData}
          />
          <Button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!hasData || !input.trim() || isLoading}
          >
            <Send size={14} />
          </Button>
        </div>
        <div className="assistant-suggestions">
          {assistantSuggestions.map((suggestion) => (
            <button
              className="assistant-suggestion"
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              disabled={!hasData || isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
