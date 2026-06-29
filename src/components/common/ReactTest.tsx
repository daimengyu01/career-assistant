import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
} else {
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created');
  
  root.render(
    <React.StrictMode>
      <MantineProvider>
        <div style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#667eea', marginBottom: '20px' }}>
              🎯 CareerAssistant
            </h1>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
              React + Mantine 渲染测试
            </p>
            <div style={{
              background: '#f0f9ff',
              borderLeft: '4px solid #667eea',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '8px 0' }}><strong>React 版本：</strong>{React.version}</p>
              <p style={{ margin: '8px 0' }}><strong>渲染状态：</strong>✅ 成功</p>
              <p style={{ margin: '8px 0' }}><strong>Mantine：</strong>✅ 已加载</p>
            </div>
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              测试按钮
            </button>
          </div>
        </div>
      </MantineProvider>
    </React.StrictMode>
  );
  
  console.log('React render complete');
}
