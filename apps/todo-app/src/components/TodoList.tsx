import { useState, useEffect } from 'react';
import type { client as ClientType, TodoItem } from '../client';

type Priority = 'low' | 'medium' | 'high';

interface Props {
  client: typeof ClientType;
}

const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f87171',
};

function TodoList({ client }: Props) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => setTodos([...items]),
    });
    return () => sub.unsubscribe();
  }, [client]);

  async function createTodo() {
    const content = newContent.trim();
    if (!content) return;
    await client.models.Todo.create({ content, done: false, priority: newPriority });
    setNewContent('');
  }

  async function toggleDone(id: string, current: boolean | null) {
    await client.models.Todo.update({ id, done: !current });
  }

  async function deleteTodo(id: string) {
    await client.models.Todo.delete({ id });
  }

  const sorted = [...todos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTodo()}
          placeholder="What needs to be done?"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: '0.9375rem',
          }}
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Priority)}
          style={{
            padding: '0.5rem',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
          }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={createTodo}
          style={{
            padding: '0.5rem 1.125rem',
            borderRadius: 6,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Add
        </button>
      </div>

      {sorted.length === 0 && (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>
          No todos yet — add one above!
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              borderRadius: 8,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              opacity: todo.done ? 0.55 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={todo.done ?? false}
              onChange={() => toggleDone(todo.id, todo.done)}
              style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }}
            />
            <span
              style={{
                flex: 1,
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#9ca3af' : '#111827',
              }}
            >
              {todo.content}
            </span>
            <span
              title={`Priority: ${todo.priority ?? 'none'}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: PRIORITY_COLOR[(todo.priority as Priority) ?? 'low'],
                flexShrink: 0,
              }}
            />
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0 2px',
              }}
              aria-label="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
