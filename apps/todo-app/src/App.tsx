import { useAuthenticator } from '@aws-amplify/ui-react';
import { client } from './client';
import TodoList from './components/TodoList';

function App() {
  const { user, signOut } = useAuthenticator();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>My Todos</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {user?.signInDetails?.loginId}
          </span>
          <button
            onClick={signOut}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <TodoList client={client} />
    </div>
  );
}

export default App;
